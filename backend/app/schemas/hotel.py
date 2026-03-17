import uuid
from datetime import datetime

from pydantic import BaseModel


class HotelCreate(BaseModel):
    name: str
    booking_key: str = ""
    city: str
    stars: int | None = None


class HotelOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    booking_key: str
    city: str
    stars: int | None
    created_at: datetime
    competitors: list["CompetitorOut"] = []

    model_config = {"from_attributes": True}


class CompetitorCreate(BaseModel):
    competitor_name: str
    competitor_booking_key: str = ""
    competitor_stars: int | None = None


class CompetitorOut(BaseModel):
    id: uuid.UUID
    hotel_id: uuid.UUID
    competitor_name: str
    competitor_booking_key: str
    competitor_stars: int | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class HotelSearchResult(BaseModel):
    hotel_key: str
    name: str
    address: str | None = None
    city: str | None = None
