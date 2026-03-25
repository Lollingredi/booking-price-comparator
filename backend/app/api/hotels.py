import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.core.rate_limit import rate_limit
from app.models.hotel import Hotel, HotelCompetitor
from app.schemas.hotel import (
    CompetitorCreate,
    CompetitorOut,
    CompetitorPatch,
    HotelCreate,
    HotelOut,
    HotelSearchResult,
)
from app.services.rate_fetcher import _get_provider as _get_rate_provider

router = APIRouter()


@router.post("", response_model=HotelOut, status_code=status.HTTP_201_CREATED)
async def create_or_update_hotel(payload: HotelCreate, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()

    if hotel:
        hotel.name = payload.name
        hotel.booking_key = payload.booking_key
        hotel.city = payload.city
        hotel.stars = payload.stars
    else:
        hotel = Hotel(
            user_id=current_user.id,
            name=payload.name,
            booking_key=payload.booking_key,
            city=payload.city,
            stars=payload.stars,
        )
        db.add(hotel)

    await db.flush()
    await db.refresh(hotel, ["competitors"])
    return hotel


@router.get("/mine", response_model=HotelOut)
async def get_my_hotel(current_user: CurrentUser, db: DB):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found. Please create your hotel first.")
    await db.refresh(hotel, ["competitors"])
    return hotel


@router.post("/competitors", response_model=CompetitorOut, status_code=status.HTTP_201_CREATED)
async def add_competitor(payload: CompetitorCreate, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Create your hotel first before adding competitors.")

    competitor = HotelCompetitor(
        hotel_id=hotel.id,
        competitor_name=payload.competitor_name,
        competitor_booking_key=payload.competitor_booking_key,
        competitor_stars=payload.competitor_stars,
    )
    db.add(competitor)
    await db.flush()
    return competitor


@router.patch("/competitors/{competitor_id}", response_model=CompetitorOut)
async def update_competitor(competitor_id: uuid.UUID, payload: CompetitorPatch, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found.")

    comp_result = await db.execute(
        select(HotelCompetitor).where(
            HotelCompetitor.id == competitor_id,
            HotelCompetitor.hotel_id == hotel.id,
        )
    )
    competitor = comp_result.scalar_one_or_none()
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found.")

    if payload.competitor_booking_key is not None:
        competitor.competitor_booking_key = payload.competitor_booking_key
    if payload.competitor_name is not None:
        competitor.competitor_name = payload.competitor_name
    if payload.competitor_stars is not None:
        competitor.competitor_stars = payload.competitor_stars

    await db.flush()
    return competitor


@router.delete("/competitors/{competitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_competitor(competitor_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found.")

    comp_result = await db.execute(
        select(HotelCompetitor).where(
            HotelCompetitor.id == competitor_id,
            HotelCompetitor.hotel_id == hotel.id,
        )
    )
    competitor = comp_result.scalar_one_or_none()
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found.")

    await db.delete(competitor)


@router.delete("/mine", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_hotel(current_user: CurrentUser, db: DB):
    """Delete the user's hotel and all associated competitors, resetting their configuration."""
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found.")

    comps_result = await db.execute(
        select(HotelCompetitor).where(HotelCompetitor.hotel_id == hotel.id)
    )
    for comp in comps_result.scalars().all():
        await db.delete(comp)

    await db.delete(hotel)


@router.get("/suggestions", response_model=list[HotelSearchResult])
async def suggest_competitors(current_user: CurrentUser, db: DB):
    """Return up to 6 hotels in the user's city that are not already configured as competitors."""
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel or not hotel.city:
        return []

    await db.refresh(hotel, ["competitors"])
    excluded = {hotel.booking_key} | {
        c.competitor_booking_key for c in hotel.competitors if c.competitor_booking_key
    }

    try:
        raw = await _get_rate_provider().search_hotel(hotel.city)
    except Exception:
        return []

    suggestions: list[HotelSearchResult] = []
    for r in raw:
        if r.hotel_key and r.hotel_key not in excluded:
            suggestions.append(HotelSearchResult(
                hotel_key=r.hotel_key,
                name=r.name,
                address=r.address,
                city=r.city,
            ))
            if len(suggestions) >= 6:
                break
    return suggestions


@router.get("/search", response_model=list[HotelSearchResult])
async def search_hotels(q: str, current_user: CurrentUser, _rl: None = Depends(rate_limit(10, 60))):
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters.")
    results = await _get_rate_provider().search_hotel(q)
    return [
        HotelSearchResult(
            hotel_key=r.hotel_key,
            name=r.name,
            address=r.address,
            city=r.city,
        )
        for r in results
    ]
