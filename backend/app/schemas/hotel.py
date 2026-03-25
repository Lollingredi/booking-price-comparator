import re
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


# Only allow slug chars: letters, digits, hyphens, dots (no ../, ?, #, etc.)
_BOOKING_KEY_RE = re.compile(r'^[a-zA-Z0-9\-\.]{0,200}$')


def _validate_key(v: str) -> str:
    if v and not _BOOKING_KEY_RE.match(v):
        raise ValueError("Può contenere solo lettere, numeri, trattini e punti.")
    return v


class HotelCreate(BaseModel):
    name: str
    booking_key: str = ""
    city: str
    stars: int | None = None

    @field_validator("booking_key")
    @classmethod
    def validate_booking_key(cls, v: str) -> str:
        return _validate_key(v)


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

    @field_validator("competitor_booking_key")
    @classmethod
    def validate_competitor_booking_key(cls, v: str) -> str:
        return _validate_key(v)


class CompetitorPatch(BaseModel):
    competitor_booking_key: str | None = None
    competitor_name: str | None = None
    competitor_stars: int | None = None

    @field_validator("competitor_booking_key")
    @classmethod
    def validate_competitor_booking_key(cls, v: str | None) -> str | None:
        if v is not None:
            _validate_key(v)
        return v


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
