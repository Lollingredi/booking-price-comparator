"""
ScraperAPI provider — no local Playwright or proxy required.

ScraperAPI renders the page via their own rotating-proxy headless browser
and returns the final HTML. Works from GitHub Actions with zero extra
infrastructure. Free tier: 5,000 credits/month (render=true costs 5 credits
per request).

Set SCRAPERAPI_KEY in GitHub Secrets (and .env locally).
Sign up free: https://www.scraperapi.com/
"""
import logging
import re
import urllib.parse

import httpx
from bs4 import BeautifulSoup

from app.services.providers import HotelSearchResult, RateProvider, RateResult

logger = logging.getLogger(__name__)

_SCRAPER_API_URL = "http://api.scraperapi.com/"
_TIMEOUT = 60.0  # ScraperAPI render can take up to 30-40s

# Price sanity bounds (EUR)
_PRICE_MIN: float = 10.0
_PRICE_MAX: float = 10_000.0

# CSS selectors for Booking.com price elements, most to least specific
_PRICE_SELECTORS = [
    "[data-testid='price-and-discounted-price']",
    "[data-testid='price-for-x-nights']",
    ".prco-inline-block-maker-helper",
    ".bui-price-display__value",
    "[class*='priceLabel']",
    "[class*='price'][class*='room']",
    "[class*='bui-price']",
]

# Booking.com multi-OTA comparison table selectors
_OTA_ROW_SELECTORS = [
    "[data-testid='ota-price-row']",
    ".hp-facilities-block .bui-list",
]


def _extract_prices_from_html(html: str) -> list[float]:
    """Parse rendered Booking.com HTML and return all valid price values."""
    soup = BeautifulSoup(html, "html.parser")
    prices: list[float] = []

    # Try CSS selectors first
    for selector in _PRICE_SELECTORS:
        elements = soup.select(selector)
        for el in elements:
            text = el.get_text(separator=" ")
            nums = re.findall(r"[\d.,]+", text.replace(".", "").replace(",", "."))
            for n in nums:
                try:
                    v = float(n)
                    if _PRICE_MIN < v < _PRICE_MAX:
                        prices.append(v)
                except ValueError:
                    pass
        if prices:
            logger.debug("Prices found via selector '%s': %s", selector, prices[:5])
            return prices

    # Fallback: JSON in script tags (Booking.com sometimes embeds price data as JSON)
    for pattern in (
        r'"gross_amount_hotel_currency"\s*:\s*\{[^}]*"value"\s*:\s*([\d.]+)',
        r'"price"\s*:\s*([\d.]+)',
        r'"amount"\s*:\s*([\d.]+)',
    ):
        matches = re.findall(pattern, html)
        for m in matches:
            try:
                v = float(m)
                if _PRICE_MIN < v < _PRICE_MAX:
                    prices.append(v)
            except ValueError:
                pass
        if prices:
            logger.debug("Prices found via JSON pattern '%s': %s", pattern, prices[:5])
            return prices

    return []


class ScraperApiProvider(RateProvider):
    """
    Fetches Booking.com hotel rates via ScraperAPI.
    Requires SCRAPERAPI_KEY environment variable.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def fetch_rates(
        self, hotel_key: str, check_in: str, check_out: str
    ) -> list[RateResult]:
        target_url = (
            f"https://www.booking.com/hotel/it/{hotel_key}.html"
            f"?checkin={check_in}&checkout={check_out}"
            f"&group_adults=2&no_rooms=1&selected_currency=EUR&lang=it"
        )
        params = {
            "api_key": self.api_key,
            "url": target_url,
            "render": "true",           # JavaScript rendering
            "country_code": "it",       # Italian IP for locale-correct prices
            "keep_headers": "true",
        }

        logger.info(
            "ScraperApiProvider: fetching key=%s  %s→%s", hotel_key, check_in, check_out
        )
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.get(_SCRAPER_API_URL, params=params)
                if resp.status_code == 403:
                    logger.error(
                        "ScraperAPI returned 403 — SCRAPERAPI_KEY non valida o crediti esauriti."
                    )
                    return []
                if resp.status_code == 429:
                    logger.warning("ScraperAPI rate limit hit for key=%s", hotel_key)
                    return []
                resp.raise_for_status()
                html = resp.text
        except httpx.HTTPError as exc:
            logger.warning("ScraperApiProvider HTTP error for key=%s: %s", hotel_key, exc)
            return []

        prices = _extract_prices_from_html(html)
        if not prices:
            logger.warning(
                "ScraperApiProvider: no prices found for key=%s. "
                "HTML length=%d. Booking.com may have returned a captcha or empty page.",
                hotel_key, len(html),
            )
            return []

        min_price = round(min(prices), 2)
        logger.info("ScraperApiProvider min price for key=%s: €%.2f", hotel_key, min_price)
        return [
            RateResult(
                ota_code="booking_com",
                ota_name="Booking.com",
                price=min_price,
                currency="EUR",
            )
        ]

    async def search_hotel(self, query: str) -> list[HotelSearchResult]:
        # Delegate hotel search to BookingProvider if available, else return empty
        return []


def make_scraper_api_provider() -> "ScraperApiProvider | None":
    from app.config import settings
    if not settings.SCRAPERAPI_KEY:
        return None
    return ScraperApiProvider(api_key=settings.SCRAPERAPI_KEY)
