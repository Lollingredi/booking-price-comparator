import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # DB column still named xotelo_hotel_key — renamed in Python layer only
    booking_key: Mapped[str] = mapped_column("xotelo_hotel_key", String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    stars: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="hotels")
    competitors: Mapped[list["HotelCompetitor"]] = relationship(
        "HotelCompetitor", back_populates="hotel", cascade="all, delete-orphan"
    )


class HotelCompetitor(Base):
    __tablename__ = "hotel_competitors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hotel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True
    )
    competitor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # DB column still named competitor_xotelo_key — renamed in Python layer only
    competitor_booking_key: Mapped[str] = mapped_column("competitor_xotelo_key", String(100), nullable=False)
    competitor_stars: Mapped[int] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    hotel: Mapped["Hotel"] = relationship("Hotel", back_populates="competitors")
