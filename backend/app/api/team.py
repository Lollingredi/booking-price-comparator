"""Team management endpoints — invite/list/remove members per hotel."""
import logging
import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DB
from app.models.hotel import Hotel
from app.models.team import HotelMember
from app.models.user import User
from app.schemas.team import TeamInviteCreate, TeamMemberOut, TeamMemberPatch

logger = logging.getLogger(__name__)

router = APIRouter()


async def _get_owned_hotel(current_user_id: uuid.UUID, db) -> Hotel:
    """Return the hotel owned by current_user, or raise 404."""
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user_id))
    hotel = result.scalar_one_or_none()
    if hotel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel non trovato")
    return hotel


def _enrich(member: HotelMember, user: User | None) -> TeamMemberOut:
    return TeamMemberOut(
        id=member.id,
        hotel_id=member.hotel_id,
        user_id=member.user_id,
        role=member.role,
        invited_email=member.invited_email,
        created_at=member.created_at,
        user_email=user.email if user else member.invited_email,
        user_name=user.full_name if user else None,
    )


@router.get("", response_model=list[TeamMemberOut])
async def list_members(current_user: CurrentUser, db: DB):
    """List all team members for the current user's hotel."""
    hotel = await _get_owned_hotel(current_user.id, db)
    result = await db.execute(
        select(HotelMember).where(HotelMember.hotel_id == hotel.id)
    )
    members = result.scalars().all()

    enriched = []
    for m in members:
        user_result = await db.execute(select(User).where(User.id == m.user_id))
        user = user_result.scalar_one_or_none()
        enriched.append(_enrich(m, user))
    return enriched


@router.post("", response_model=TeamMemberOut, status_code=status.HTTP_201_CREATED)
async def invite_member(payload: TeamInviteCreate, current_user: CurrentUser, db: DB):
    """Invite a user by email to access this hotel."""
    hotel = await _get_owned_hotel(current_user.id, db)

    # Look up user by email
    user_result = await db.execute(select(User).where(User.email == payload.email))
    invited_user = user_result.scalar_one_or_none()

    if invited_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nessun account trovato per {payload.email}. L'utente deve registrarsi prima.",
        )

    if invited_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi invitare te stesso.",
        )

    member = HotelMember(
        hotel_id=hotel.id,
        user_id=invited_user.id,
        role=payload.role,
        invited_email=payload.email,
    )
    db.add(member)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Questo utente è già membro del team.",
        )

    await db.refresh(member)
    return _enrich(member, invited_user)


@router.patch("/{member_id}", response_model=TeamMemberOut)
async def update_member_role(
    member_id: uuid.UUID,
    payload: TeamMemberPatch,
    current_user: CurrentUser,
    db: DB,
):
    """Change role of a team member (owner only)."""
    hotel = await _get_owned_hotel(current_user.id, db)

    result = await db.execute(
        select(HotelMember).where(
            HotelMember.id == member_id,
            HotelMember.hotel_id == hotel.id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membro non trovato")
    if member.role == "owner":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Non puoi modificare il ruolo dell'owner.")

    member.role = payload.role
    await db.flush()
    await db.refresh(member)

    user_result = await db.execute(select(User).where(User.id == member.user_id))
    user = user_result.scalar_one_or_none()
    return _enrich(member, user)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(member_id: uuid.UUID, current_user: CurrentUser, db: DB):
    """Remove a team member (owner only)."""
    hotel = await _get_owned_hotel(current_user.id, db)

    result = await db.execute(
        select(HotelMember).where(
            HotelMember.id == member_id,
            HotelMember.hotel_id == hotel.id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membro non trovato")
    if member.role == "owner":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Non puoi rimuovere l'owner.")

    await db.delete(member)
    await db.flush()
