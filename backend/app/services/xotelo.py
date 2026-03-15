import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class RateResult:
    ota_code: str
    ota_name: str
    price: float
    currency: str = "EUR"


@dataclass
class HotelSearchResult:
    hotel_key: str
    name: str
    address: str | None = None
    city: str | None = None


class RateProvider(ABC):
    @abstractmethod
    async def fetch_rates(
        self, hotel_key: str, check_in: str, check_out: str
    ) -> list[RateResult]:
        ...

    @abstractmethod
    async def search_hotel(self, query: str) -> list[HotelSearchResult]:
        ...


class XoteloProvider(RateProvider):
    MAX_RETRIES = 3
    BASE_BACKOFF = 1.0  # seconds

    def __init__(self):
        self.base_url = settings.XOTELO_BASE_URL.rstrip("/")
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=15.0)
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(self, endpoint: str, params: dict) -> dict:
        client = await self._get_client()
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        last_exc: Exception | None = None

        for attempt in range(self.MAX_RETRIES):
            started_at = datetime.now(timezone.utc)
            try:
                response = await client.get(url, params=params)
                elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
                logger.info(
                    "Xotelo %s params=%s status=%s elapsed=%.2fs",
                    endpoint,
                    params,
                    response.status_code,
                    elapsed,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "Xotelo HTTP error %s attempt=%d/%d: %s",
                    endpoint,
                    attempt + 1,
                    self.MAX_RETRIES,
                    exc,
                )
                last_exc = exc
            except httpx.RequestError as exc:
                logger.warning(
                    "Xotelo request error %s attempt=%d/%d: %s",
                    endpoint,
                    attempt + 1,
                    self.MAX_RETRIES,
                    exc,
                )
                last_exc = exc

            if attempt < self.MAX_RETRIES - 1:
                backoff = self.BASE_BACKOFF * (2 ** attempt)
                await asyncio.sleep(backoff)

        raise RuntimeError(f"Xotelo {endpoint} failed after {self.MAX_RETRIES} attempts") from last_exc

    async def fetch_rates(
        self, hotel_key: str, check_in: str, check_out: str
    ) -> list[RateResult]:
        """
        Fetch rates from Xotelo /rates endpoint.
        Returns a list of RateResult objects.
        """
        try:
            data = await self._request(
                "rates",
                {"hotel_key": hotel_key, "chk_in": check_in, "chk_out": check_out},
            )
        except RuntimeError:
            return []

        result = data.get("result", {})
        rates_raw = result.get("rates", [])

        if not rates_raw:
            logger.info("No rates returned for hotel_key=%s", hotel_key)
            return []

        return [
            RateResult(
                ota_code=r.get("code", "Unknown"),
                ota_name=r.get("name", "Unknown"),
                price=float(r.get("rate", 0)),
                currency="EUR",
            )
            for r in rates_raw
            if r.get("rate") is not None
        ]

    async def search_hotel(self, query: str) -> list[HotelSearchResult]:
        """
        Search hotels by name using Xotelo /search endpoint.
        """
        try:
            data = await self._request("search", {"query": query})
        except RuntimeError:
            return []

        results_raw = data.get("result", [])
        if not isinstance(results_raw, list):
            return []

        return [
            HotelSearchResult(
                hotel_key=item.get("key", ""),
                name=item.get("name", ""),
                address=item.get("address"),
                city=item.get("city"),
            )
            for item in results_raw
            if item.get("key")
        ]

    async def list_hotels(self, location_key: str) -> list[HotelSearchResult]:
        """
        List hotels by location using Xotelo /list endpoint.
        """
        try:
            data = await self._request("list", {"location_key": location_key})
        except RuntimeError:
            return []

        results_raw = data.get("result", [])
        if not isinstance(results_raw, list):
            return []

        return [
            HotelSearchResult(
                hotel_key=item.get("key", ""),
                name=item.get("name", ""),
                address=item.get("address"),
                city=item.get("city"),
            )
            for item in results_raw
            if item.get("key")
        ]


# Singleton provider instance
xotelo_provider = XoteloProvider()
