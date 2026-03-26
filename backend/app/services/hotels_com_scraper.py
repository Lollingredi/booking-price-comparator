"""
Hotels.com Playwright-based price scraper.

Hotels.com is owned by Expedia Group and shares much of the same infrastructure.
Uses the same thread-isolation approach as BookingProvider.
"""
import asyncio
import logging
import random
import re

from app.services.providers import HotelSearchResult, RateProvider, RateResult

logger = logging.getLogger(__name__)

_PRICE_MIN: float = 10.0
_PRICE_MAX: float = 10_000.0

_PRICE_SELECTORS = [
    "[data-stid='content-hotel-lead-price'] span",
    "[data-test-id='price-summary']",
    ".uitk-type-500.uitk-type-bold",
    "[class*='price-summary'] [class*='price']",
    "[class*='price'][class*='lead']",
]


async def _do_fetch_rates_hotels_com(
    hotel_name: str, check_in: str, check_out: str, proxy: str | None
) -> list[RateResult]:
    """Scrape Hotels.com search results for a hotel name."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return []

    query = hotel_name.replace("-", " ").replace(".", " ")
    url = (
        f"https://it.hotels.com/Hotel-Search?"
        f"destination={query.replace(' ', '%20')}"
        f"&startDate={check_in}&endDate={check_out}"
        f"&rooms=1&adults=2&currency=EUR"
    )
    logger.info("Scraping Hotels.com: query=%s  %s→%s", query, check_in, check_out)

    async with async_playwright() as pw:
        launch_opts: dict = {"headless": True, "args": ["--no-sandbox", "--disable-blink-features=AutomationControlled"]}
        if proxy:
            launch_opts["proxy"] = {"server": proxy}
        browser = await pw.chromium.launch(**launch_opts)
        try:
            ctx = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
                viewport={"width": 1440, "height": 900},
                locale="it-IT",
            )
            page = await ctx.new_page()
            await page.route("**/*", lambda route: route.abort() if route.request.resource_type in ("image", "media", "font") else route.continue_())

            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(random.uniform(2.0, 4.0))

            prices: list[float] = []
            for selector in _PRICE_SELECTORS:
                try:
                    elements = await page.query_selector_all(selector)
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
                        break
                except Exception:
                    continue

            await ctx.close()
        finally:
            await browser.close()

    if not prices:
        logger.warning("Hotels.com: no prices found for query=%s", query)
        return []

    min_price = round(min(prices), 2)
    logger.info("Hotels.com min price for %s: €%.2f", query, min_price)
    return [RateResult(ota_code="hotels_com", ota_name="Hotels.com", price=min_price, currency="EUR")]


class HotelsComProvider(RateProvider):
    """Fetches hotel prices from Hotels.com using Playwright."""

    def __init__(self, proxy: str | None = None):
        self.proxy = proxy

    async def fetch_rates(self, hotel_key: str, check_in: str, check_out: str) -> list[RateResult]:
        from app.services.booking_scraper import _run_in_own_loop
        proxy = self.proxy
        return await asyncio.to_thread(
            _run_in_own_loop,
            lambda: _do_fetch_rates_hotels_com(hotel_key, check_in, check_out, proxy),
        )

    async def search_hotel(self, query: str) -> list[HotelSearchResult]:
        return []
