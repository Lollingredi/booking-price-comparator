import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class HotelMember(Base):
    """Join table: allows multiple users to access a single hotel.

    Roles:
      - owner: full control (only one per hotel, matches Hotel.user_id)
      - manager: can edit hotel/competitors, view all data
      - viewer: read-only access to dashboard and data
    """
    __tablename__ = "hotel_members"
    __table_args__ = (
        UniqueConstraint("hotel_id", "user_id", name="uq_hotel_member"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hotel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(
        Enum("owner", "manager", "viewer", name="member_role_enum"),
        nullable=False,
        default="viewer",
    )
    invited_email: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    hotel: Mapped["Hotel"] = relationship("Hotel", backref="members")
    user: Mapped["User"] = relationship("User", backref="team_memberships")
