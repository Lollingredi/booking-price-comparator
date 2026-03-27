"""
Booking.com Playwright-based price scraper.

Anti-detection techniques used:
  1. playwright-stealth — patches navigator.webdriver, WebGL, canvas fingerprint, etc.
  2. Randomised user-agent from a pool of real Chrome UAs
  3. Randomised viewport size
  4. Human-like delays between steps (1–4 s)
  5. Persistent cookie jar (reused across requests)
  6. Resource blocking (images / media) to reduce footprint
  7. Optional HTTP proxy via SCRAPER_PROXY env var
     (recommended for production: residential proxy, e.g. Bright Data / Oxylabs)
     Format: http://user:pass@host:port  or  socks5://user:pass@host:port

hotel_key format: Booking.com hotel slug from the property URL
  URL example:  https://www.booking.com/hotel/it/emma-bologna-fiera.it.html
  hotel_key:    emma-bologna-fiera.it   ← include everything up to .html

NOTE — Windows / Python 3.14 compatibility
  Playwright uses asyncio.create_subprocess_exec internally.  On Windows the
  default event loop in recent Python / uvicorn builds is SelectorEventLoop,
  which does NOT support subprocesses.  Every public method therefore runs the
  Playwright coroutines in a *separate thread* that owns a fresh
  ProactorEventLoop, avoiding the NotImplementedError entirely.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Callable, TypeVar

import asyncio
import json
import logging
import random
import re
import sys
import threading
from pathlib import Path

from playwright.async_api import (
    BrowserContext,
    Page,
    async_playwright,
)

if TYPE_CHECKING:
    from playwright.async_api import AsyncPlaywright

from app.services.providers import HotelSearchResult, RateProvider, RateResult

logger = logging.getLogger(__name__)

T = TypeVar("T")

# ── User-agent pool (real Chrome 122–124 UAs) ────────────────────────────────

_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]

_VIEWPORTS = [
    {"width": 1920, "height": 1080},
    {"width": 1680, "height": 1050},
    {"width": 1440, "height": 900},
    {"width": 1366, "height": 768},
    {"width": 1280, "height": 800},
]

# Selector cascade for room price elements — most to least specific
_PRICE_SELECTORS = [
    "[data-testid='price-and-discounted-price']",
    "[data-testid='price-for-x-nights']",
    ".prco-inline-block-maker-helper",
    ".bui-price-display__value",
    ".hp-price-value",
    "[class*='priceLabel']",
    "[class*='price'][class*='room']",
]

# Cookie storage path (one file per process, reused across requests)
_COOKIE_FILE = Path(__file__).parent / ".booking_cookies.json"
_COOKIE_LOCK = threading.Lock()

# Price sanity bounds: ignore values outside this range (€)
_PRICE_MIN: float = 10.0
_PRICE_MAX: float = 10_000.0


# ── Thread-isolation helper ───────────────────────────────────────────────────

def _run_in_own_loop(coro_factory: Callable[[], "asyncio.coroutine"]) -> T:  # type: ignore[type-arg]
    """
    Run *coro_factory()* inside a brand-new event loop created on the calling
    thread.  On Windows we explicitly use ProactorEventLoop so that
    asyncio.create_subprocess_exec (required by Playwright) is available.

    This function is meant to be called from a worker thread via
    asyncio.to_thread(); it is synchronous and blocks until the coroutine
    completes.
    """
    if sys.platform == "win32":
        loop = asyncio.ProactorEventLoop()
    else:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro_factory())
    finally:
        loop.close()
        asyncio.set_event_loop(None)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _jitter(lo: float = 0.8, hi: float = 2.5) -> float:
    return random.uniform(lo, hi)


def _load_cookies() -> list[dict]:
    with _COOKIE_LOCK:
        if _COOKIE_FILE.exists():
            try:
                return json.loads(_COOKIE_FILE.read_text())
            except Exception:
                pass
    return []


def _save_cookies(cookies: list[dict]) -> None:
    with _COOKIE_LOCK:
        try:
            _COOKIE_FILE.write_text(json.dumps(cookies, indent=2))
        except Exception:
            pass


async def _apply_stealth(page: Page) -> None:
    """Manual stealth patches — covers the most common bot-detection signals."""
    await page.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3].map(() => ({
                0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf',
                     description: 'Portable Document Format', enabledPlugin: Plugin },
                description: 'Chromium PDF Plugin', filename: 'internal-pdf-viewer',
                length: 1, name: 'Chromium PDF Plugin',
            })),
        });
        Object.defineProperty(navigator, 'languages', { get: () => ['it-IT', 'it', 'en-US', 'en'] });
        window.chrome = { runtime: {} };
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    """)


async def _new_context(pw: AsyncPlaywright, proxy: str | None) -> BrowserContext:
    launch_opts: dict = {
        "headless": True,
        "args": [
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--disable-extensions",
            "--disable-infobars",
            "--disable-notifications",
        ],
    }
    if proxy:
        launch_opts["proxy"] = {"server": proxy}

    browser = await pw.chromium.launch(**launch_opts)
    ctx = await browser.new_context(
        user_agent=random.choice(_USER_AGENTS),
        viewport=random.choice(_VIEWPORTS),
        locale="it-IT",
        timezone_id="Europe/Rome",
        accept_downloads=False,
        extra_http_headers={
            "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
        },
    )
    saved = _load_cookies()
    if saved:
        try:
            await ctx.add_cookies(saved)
        except Exception:
            pass
    return ctx


async def _new_page(ctx: BrowserContext) -> Page:
    page = await ctx.new_page()
    await page.route(
        "**/*",
        lambda route: route.abort()
        if route.request.resource_type in ("image", "media", "font")
        else route.continue_(),
    )
    await _apply_stealth(page)
    try:
        from playwright_stealth import stealth_async  # type: ignore
        await stealth_async(page)
        logger.debug("playwright-stealth applied")
    except ImportError:
        logger.debug("playwright-stealth not installed; using manual patches")
    return page


async def _extract_prices_from_dom(page: Page) -> list[float]:
    for selector in _PRICE_SELECTORS:
        try:
            elements = await page.query_selector_all(selector)
            prices: list[float] = []
            for el in elements:
                text = await el.inner_text()
                nums = re.findall(r"[\d.,]+", text.replace(".", "").replace(",", "."))
                for n in nums:
                    try:
                        v = float(n)
                        if _PRICE_MIN < v < _PRICE_MAX:
                            prices.append(v)
                    except ValueError:
                        pass
            if prices:
                logger.debug("Found %d prices via selector '%s'", len(prices), selector)
                return prices
        except Exception as exc:
            logger.debug("_extract_prices_from_dom: selector %r failed: %s", selector, exc)
            continue
    return []


async def _extract_prices_via_intercept(page: Page, url: str) -> list[float]:
    prices: list[float] = []

    def _handle_response(response):
        if prices:
            return
        url_lower = response.url.lower()
        if any(kw in url_lower for kw in ("price", "rate", "avail", "room", "graphql")):
            asyncio.ensure_future(_parse_response(response))

    async def _parse_response(response):
        try:
            body = await response.text()
            found = [
                float(m)
                for m in re.findall(r'"(?:price|amount|gross_amount|value)"\s*:\s*([\d.]+)', body)
                if _PRICE_MIN < float(m) < _PRICE_MAX
            ]
            if found:
                prices.extend(found)
        except Exception as exc:
            logger.debug("_parse_response: failed to parse %s: %s", response.url[:80], exc)

    page.on("response", _handle_response)
    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    await asyncio.sleep(_jitter(1.5, 3.0))
    page.remove_listener("response", _handle_response)
    return prices


# ── Core scraping functions (run inside the dedicated thread loop) ────────────

async def _do_fetch_rates(
    hotel_key: str, check_in: str, check_out: str, proxy: str | None
) -> list[RateResult]:
    url = (
        f"https://www.booking.com/hotel/it/{hotel_key}.html"
        f"?checkin={check_in}&checkout={check_out}"
        f"&group_adults=2&no_rooms=1&selected_currency=EUR"
    )
    logger.info("Scraping Booking.com: slug=%s  %s→%s", hotel_key, check_in, check_out)

    async with async_playwright() as pw:
        ctx = await _new_context(pw, proxy)
        try:
            page = await _new_page(ctx)

            # Visit homepage first — more natural browsing pattern
            try:
                await page.goto("https://www.booking.com", wait_until="domcontentloaded", timeout=20000)
                await asyncio.sleep(_jitter(1.0, 2.0))
            except Exception:
                pass

            prices = await _extract_prices_via_intercept(page, url)

            if not prices:
                try:
                    await page.wait_for_selector(
                        ", ".join(_PRICE_SELECTORS[:3]), timeout=10000
                    )
                except Exception:
                    pass
                await asyncio.sleep(_jitter(0.5, 1.5))
                prices = await _extract_prices_from_dom(page)

            _save_cookies(await ctx.cookies())

            # ── Debug: capture page state when no prices found ────────────────
            if not prices:
                try:
                    title = await page.title()
                    html = await page.content()
                    debug_path = Path(__file__).parent / f"_debug_{hotel_key}.html"
                    debug_path.write_text(html[:80_000], encoding="utf-8", errors="replace")
                    snippet = html[:500].replace("\n", " ")
                    logger.warning(
                        "No prices found for slug=%s | title=%r | snippet=%s | saved=%s",
                        hotel_key, title, snippet, debug_path,
                    )
                except Exception as dbg_exc:
                    logger.warning("No prices found for slug=%s (debug failed: %s)", hotel_key, dbg_exc)
        finally:
            await ctx.close()
            await ctx.browser.close()

    if not prices:
        return []

    min_price = round(min(prices), 2)
    logger.info("Min price for slug=%s: €%.2f", hotel_key, min_price)
    return [RateResult(ota_code="booking_com", ota_name="Booking.com", price=min_price, currency="EUR")]


async def _do_search_hotel(query: str, proxy: str | None) -> list[HotelSearchResult]:
    search_url = f"https://www.booking.com/searchresults.html?ss={query.replace(' ', '+')}&lang=it&sb=1"
    results: list[HotelSearchResult] = []

    async with async_playwright() as pw:
        ctx = await _new_context(pw, proxy)
        try:
            page = await _new_page(ctx)
            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(_jitter(1.5, 3.0))

            cards = await page.query_selector_all("[data-testid='property-card']")
            for idx, card in enumerate(cards[:8]):
                try:
                    link_el = await card.query_selector("a[data-testid='title-link']")
                    name_el = await card.query_selector("[data-testid='title']")
                    addr_el = await card.query_selector("[data-testid='address']")
                    if not link_el or not name_el:
                        continue
                    href = await link_el.get_attribute("href") or ""
                    name = (await name_el.inner_text()).strip()
                    addr = (await addr_el.inner_text()).strip() if addr_el else None
                    m = re.search(r"/hotel/\w+/([^?#]+?)\.html", href)
                    if not m:
                        logger.debug("search_hotel: query=%r card[%d] href=%r — no slug match", query, idx, href[:120])
                        continue
                    slug = m.group(1)
                    logger.info("search_hotel: query=%r [%d] slug=%r name=%r", query, idx, slug, name)
                    results.append(HotelSearchResult(hotel_key=slug, name=name, address=addr, city=addr))
                except Exception as card_exc:
                    logger.debug("search_hotel: query=%r card[%d] parse error: %s", query, idx, card_exc)
                    continue

            _save_cookies(await ctx.cookies())
            if results:
                logger.info("search_hotel('%s') → %d result(s), first slug=%r", query, len(results), results[0].hotel_key)
            else:
                page_title = await page.title()
                logger.warning(
                    "search_hotel: no results for query=%r | page title=%r | cards found=%d",
                    query, page_title, len(cards),
                )
        except Exception as exc:
            logger.error("search_hotel error for '%s': %s", query, exc)
        finally:
            await ctx.close()
            await ctx.browser.close()

    return results


# ── Public provider class ─────────────────────────────────────────────────────

class BookingProvider(RateProvider):
    """
    Fetches hotel prices from Booking.com using a stealth Playwright browser.
    All Playwright work runs in a thread-isolated ProactorEventLoop so that
    this class is safe to use from any asyncio framework on any platform
    (including Python 3.14 / Windows where SelectorEventLoop is the default).
    """

    def __init__(self, proxy: str | None = None):
        self.proxy = proxy

    async def fetch_rates(self, hotel_key: str, check_in: str, check_out: str) -> list[RateResult]:
        proxy = self.proxy
        return await asyncio.to_thread(
            _run_in_own_loop,
            lambda: _do_fetch_rates(hotel_key, check_in, check_out, proxy),
        )

    async def search_hotel(self, query: str) -> list[HotelSearchResult]:
        proxy = self.proxy
        return await asyncio.to_thread(
            _run_in_own_loop,
            lambda: _do_search_hotel(query, proxy),
        )


# Singleton — proxy configurable via SCRAPER_PROXY env var
def _make_provider() -> BookingProvider:
    import os
    proxy = os.getenv("SCRAPER_PROXY") or None
    if proxy:
        if not (proxy.startswith("http://") or proxy.startswith("https://") or proxy.startswith("socks5://")):
            logger.error(
                "SCRAPER_PROXY non valido: %r — deve iniziare con http://, https:// o socks5://. "
                "Il proxy verrà ignorato.",
                proxy,
            )
            proxy = None
    return BookingProvider(proxy=proxy)


booking_provider = _make_provider()
