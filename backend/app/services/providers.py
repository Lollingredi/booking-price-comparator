"""
Abstract base classes for rate providers.
Concrete implementations: BookingProvider (booking_scraper.py).
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


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
    ) -> list[RateResult]: ...

    @abstractmethod
    async def search_hotel(self, query: str) -> list[HotelSearchResult]: ...
