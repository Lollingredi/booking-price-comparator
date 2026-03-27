"""
Xotelo API provider — no proxy required, works from GitHub Actions.

Xotelo aggregates hotel rates from Booking.com, Expedia, Hotels.com and others
using the same hotel key (Booking.com slug).

API endpoint: https://data.xotelo.com/api/rates
Docs: https://xotelo.com
"""
import logging
from decimal import Decimal

import httpx

from app.services.providers import HotelSearchResult, RateProvider, RateResult

logger = logging.getLogger(__name__)

_BASE_URL = "https://data.xotelo.com/api/rates"
_TIMEOUT = 20.0

# Map Xotelo OTA names → our internal codes/names
_OTA_MAP: dict[str, tuple[str, str]] = {
    "booking.com":  ("booking_com",  "Booking.com"),
    "expedia":      ("expedia",      "Expedia"),
    "hotels.com":   ("hotels_com",   "Hotels.com"),
    "agoda":        ("agoda",        "Agoda"),
    "trip.com":     ("trip_com",     "Trip.com"),
    "hotelbeds":    ("hotelbeds",    "Hotelbeds"),
}


def _normalise_ota(name: str) -> tuple[str, str]:
    """Return (ota_code, ota_name) for a raw OTA name from Xotelo."""
    key = name.lower().strip()
    for pattern, value in _OTA_MAP.items():
        if pattern in key:
            return value
    # Unknown OTA — create a safe code from the name
    code = key.replace(" ", "_").replace(".", "_")[:50]
    return code, name.strip()


class XoteloProvider(RateProvider):
    """
    Fetches hotel rates from the Xotelo aggregation API.

    - No Playwright / browser required
    - No proxy required
    - Returns rates from multiple OTAs in one HTTP call
    """

    async def fetch_rates(
        self, hotel_key: str, check_in: str, check_out: str
    ) -> list[RateResult]:
        params = {
            "hotel_key": hotel_key,
            "chk_in": check_in,
            "chk_out": check_out,
        }
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.get(_BASE_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            logger.warning("XoteloProvider HTTP error for key=%s: %s", hotel_key, exc)
            return []
        except Exception as exc:
            logger.warning("XoteloProvider unexpected error for key=%s: %s", hotel_key, exc)
            return []

        if data.get("error"):
            logger.warning("Xotelo API error for key=%s: %s", hotel_key, data["error"])
            return []

        rates_raw = (data.get("result") or {}).get("rates") or []
        results: list[RateResult] = []
        for entry in rates_raw:
            try:
                raw_name: str = entry.get("name") or ""
                raw_rate = entry.get("rate")
                if raw_rate is None:
                    continue
                price = float(raw_rate)
                if price <= 0:
                    continue
                ota_code, ota_name = _normalise_ota(raw_name)
                results.append(RateResult(
                    ota_code=ota_code,
                    ota_name=ota_name,
                    price=round(price, 2),
                    currency="EUR",
                ))
            except (ValueError, TypeError):
                continue

        logger.info(
            "XoteloProvider: %d rates for key=%s (%s→%s): %s",
            len(results), hotel_key, check_in, check_out,
            [(r.ota_name, r.price) for r in results],
        )
        return results

    async def search_hotel(self, query: str) -> list[HotelSearchResult]:
        # Xotelo doesn't offer a hotel-search endpoint; delegate to Booking scraper
        return []


# Singleton
xotelo_provider = XoteloProvider()
