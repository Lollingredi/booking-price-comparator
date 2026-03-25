import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class RateSnapshotOut(BaseModel):
    id: uuid.UUID
    hotel_booking_key: str
    ota_code: str
    ota_name: str
    price: Decimal
    currency: str
    check_in_date: date
    check_out_date: date
    fetched_at: datetime

    model_config = {"from_attributes": True}


class CurrentRatesRequest(BaseModel):
    check_in: date
    check_out: date


class HotelRates(BaseModel):
    hotel_key: str
    hotel_name: str
    is_own_hotel: bool
    rates: list[RateSnapshotOut]


class ComparisonRow(BaseModel):
    hotel_key: str
    hotel_name: str
    is_own_hotel: bool
    ota_prices: dict[str, Decimal | None]
    min_price: Decimal | None
    rank: int


class HistoryPoint(BaseModel):
    date: date
    ota_code: str
    ota_name: str
    min_price: Decimal


class CalendarDay(BaseModel):
    """One day in the calendar heatmap."""
    check_in: date
    own_min: Decimal | None = None
    best_competitor: Decimal | None = None
    rank: int | None = None
    total_hotels: int = 0
