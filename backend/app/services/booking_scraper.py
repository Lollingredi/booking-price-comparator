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
  URL example:  https://www.booking.com/hotel/it/baglioni-bologna.html
  hotel_key:    baglioni-bologna

  To find a slug: open the hotel on Booking.com → copy the part between
  /hotel/it/ and .html in the address bar.
"""

import asyncio
import json
import logging
import random
import re
import time
from pathlib import Path
from typing import Optional

from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    async_playwright,
)

from app.services.xotelo import HotelSearchResult, RateProvider, RateResult

logger = logging.getLogger(__name__)

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


def _jitter(lo: float = 0.8, hi: float = 2.5) -> float:
    return random.uniform(lo, hi)


def _load_cookies() -> list[dict]:
    if _COOKIE_FILE.exists():
        try:
            return json.loads(_COOKIE_FILE.read_text())
        except Exception:
            pass
    return []


def _save_cookies(cookies: list[dict]) -> None:
    try:
        _COOKIE_FILE.write_text(json.dumps(cookies, indent=2))
    except Exception:
        pass


async def _apply_stealth(page: Page) -> None:
    """
    Manual stealth patches when playwright-stealth is not installed.
    Covers the most common bot-detection signals.
    """
    await page.add_init_script("""
        // Remove webdriver flag
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

        // Fake plugins (Chrome normally has 3)
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3].map(() => ({
                0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format', enabledPlugin: Plugin },
                description: 'Chromium PDF Plugin', filename: 'internal-pdf-viewer', length: 1, name: 'Chromium PDF Plugin',
            })),
        });

        // Fake languages
        Object.defineProperty(navigator, 'languages', { get: () => ['it-IT', 'it', 'en-US', 'en'] });

        // Override chrome object
        window.chrome = { runtime: {} };

        // Hide automation-related properties
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    """)


class BookingProvider(RateProvider):
    """
    Fetches hotel prices from Booking.com using a stealth Playwright browser.
    """

    def __init__(self, proxy: Optional[str] = None):
        self.proxy = proxy          # e.g. "http://user:pass@host:port"
        self._browser: Optional[Browser] = None
        self._playwright = None

    # ── Browser lifecycle ────────────────────────────────────────────────────

    async def _get_browser(self) -> Browser:
        if self._browser is None or not self._browser.is_connected():
            self._playwright = await async_playwright().start()
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
            if self.proxy:
                launch_opts["proxy"] = {"server": self.proxy}
            self._browser = await self._playwright.chromium.launch(**launch_opts)
            logger.info("Playwright browser started (proxy=%s)", bool(self.proxy))
        return self._browser

    async def close(self) -> None:
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None

    async def _new_context(self) -> BrowserContext:
        browser = await self._get_browser()
        ua = random.choice(_USER_AGENTS)
        vp = random.choice(_VIEWPORTS)

        context_opts: dict = {
            "user_agent": ua,
            "viewport": vp,
            "locale": "it-IT",
            "timezone_id": "Europe/Rome",
            "accept_downloads": False,
            "extra_http_headers": {
                "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
            },
        }
        ctx = await browser.new_context(**context_opts)

        # Restore cookies from previous sessions
        saved = _load_cookies()
        if saved:
            try:
                await ctx.add_cookies(saved)
            except Exception:
                pass

        return ctx

    async def _new_page(self, ctx: BrowserContext) -> Page:
        page = await ctx.new_page()

        # Block images / media / fonts to reduce detection surface and speed up
        await page.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in ("image", "media", "font")
            else route.continue_(),
        )

        # Apply manual stealth patches
        await _apply_stealth(page)

        # Try playwright-stealth if available
        try:
            from playwright_stealth import stealth_async  # type: ignore
            await stealth_async(page)
            logger.debug("playwright-stealth applied")
        except ImportError:
            logger.debug("playwright-stealth not installed; using manual patches")

        return page

    # ── Price extraction helpers ─────────────────────────────────────────────

    async def _extract_prices_from_dom(self, page: Page) -> list[float]:
        """Try multiple CSS selectors to find room prices on the page."""
        for selector in _PRICE_SELECTORS:
            try:
                elements = await page.query_selector_all(selector)
                prices: list[float] = []
                for el in elements:
                    text = await el.inner_text()
                    # Strip currency symbols and convert
                    nums = re.findall(r"[\d.,]+", text.replace(".", "").replace(",", "."))
                    for n in nums:
                        try:
                            v = float(n)
                            if 10 < v < 10000:   # sanity range for hotel prices
                                prices.append(v)
                        except ValueError:
                            pass
                if prices:
                    logger.debug("Found %d prices via selector '%s'", len(prices), selector)
                    return prices
            except Exception:
                continue
        return []

    async def _extract_prices_via_intercept(self, page: Page, url: str) -> list[float]:
        """
        Navigate to URL while intercepting API responses that contain price data.
        Returns price list if found, empty list otherwise.
        """
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
                found = [float(m) for m in re.findall(r'"(?:price|amount|gross_amount|value)"\s*:\s*([\d.]+)', body)
                         if 10 < float(m) < 10000]
                if found:
                    prices.extend(found)
            except Exception:
                pass

        page.on("response", _handle_response)
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(_jitter(1.5, 3.0))
        page.remove_listener("response", _handle_response)
        return prices

    # ── Public API ────────────────────────────────────────────────────────────

    async def fetch_rates(
        self, hotel_key: str, check_in: str, check_out: str
    ) -> list[RateResult]:
        """
        Scrape Booking.com for the cheapest available room price.

        Args:
            hotel_key: Booking.com hotel slug (e.g. "baglioni-bologna")
            check_in:  ISO date string "YYYY-MM-DD"
            check_out: ISO date string "YYYY-MM-DD"

        Returns:
            List with one RateResult (min price found) or empty list on failure.
        """
        url = (
            f"https://www.booking.com/hotel/it/{hotel_key}.html"
            f"?checkin={check_in}&checkout={check_out}"
            f"&group_adults=2&no_rooms=1&selected_currency=EUR"
        )
        logger.info("Scraping Booking.com: slug=%s  %s→%s", hotel_key, check_in, check_out)

        ctx = await self._new_context()
        try:
            page = await self._new_page(ctx)

            # ── Step 1: visit Booking.com homepage first (more natural) ──────
            try:
                await page.goto("https://www.booking.com", wait_until="domcontentloaded", timeout=20000)
                await asyncio.sleep(_jitter(1.0, 2.0))
            except Exception:
                pass

            # ── Step 2: navigate to hotel page ───────────────────────────────
            prices = await self._extract_prices_via_intercept(page, url)

            # ── Step 3: DOM fallback if intercept yielded nothing ─────────────
            if not prices:
                # Wait a bit more for JS to render prices
                try:
                    await page.wait_for_selector(
                        ", ".join(_PRICE_SELECTORS[:3]),
                        timeout=10000,
                    )
                except Exception:
                    pass
                await asyncio.sleep(_jitter(0.5, 1.5))
                prices = await self._extract_prices_from_dom(page)

            # ── Persist cookies ───────────────────────────────────────────────
            _save_cookies(await ctx.cookies())

            if not prices:
                logger.warning("No prices found for slug=%s", hotel_key)
                return []

            min_price = round(min(prices), 2)
            logger.info("Min price for slug=%s: €%.2f", hotel_key, min_price)
            return [
                RateResult(
                    ota_code="booking_com",
                    ota_name="Booking.com",
                    price=min_price,
                    currency="EUR",
                )
            ]

        except Exception as exc:
            logger.error("Error scraping slug=%s: %s", hotel_key, exc)
            return []
        finally:
            await ctx.close()

    async def search_hotel(self, query: str) -> list[HotelSearchResult]:
        """
        Search Booking.com for hotels matching the query.
        Returns up to 8 results with hotel_key = Booking.com slug.
        """
        search_url = (
            f"https://www.booking.com/searchresults.html"
            f"?ss={query.replace(' ', '+')}&lang=it&sb=1"
        )
        ctx = await self._new_context()
        results: list[HotelSearchResult] = []
        try:
            page = await self._new_page(ctx)
            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(_jitter(1.5, 3.0))

            # Extract hotel cards
            cards = await page.query_selector_all("[data-testid='property-card']")
            for card in cards[:8]:
                try:
                    link_el = await card.query_selector("a[data-testid='title-link']")
                    name_el = await card.query_selector("[data-testid='title']")
                    addr_el = await card.query_selector("[data-testid='address']")

                    if not link_el or not name_el:
                        continue

                    href = await link_el.get_attribute("href") or ""
                    name = (await name_el.inner_text()).strip()
                    addr = (await addr_el.inner_text()).strip() if addr_el else None

                    # Extract slug from href: /hotel/it/{slug}.html
                    m = re.search(r"/hotel/\w+/([^.?#]+)", href)
                    if not m:
                        continue
                    slug = m.group(1)

                    results.append(
                        HotelSearchResult(
                            hotel_key=slug,
                            name=name,
                            address=addr,
                            city=addr,
                        )
                    )
                except Exception:
                    continue

            _save_cookies(await ctx.cookies())
            logger.info("search_hotel('%s') → %d results", query, len(results))
        except Exception as exc:
            logger.error("search_hotel error for '%s': %s", query, exc)
        finally:
            await ctx.close()

        return results


# Singleton — lazy-initialised, proxy configurable via env
def _make_provider() -> BookingProvider:
    import os
    proxy = os.getenv("SCRAPER_PROXY")  # optional: http://user:pass@host:port
    return BookingProvider(proxy=proxy or None)


booking_provider = _make_provider()
