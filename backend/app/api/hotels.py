import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.models.hotel import Hotel, HotelCompetitor
from app.schemas.hotel import (
    CompetitorCreate,
    CompetitorOut,
    HotelCreate,
    HotelOut,
    HotelSearchResult,
)
from app.services.xotelo import xotelo_provider

router = APIRouter()


@router.post("", response_model=HotelOut, status_code=status.HTTP_201_CREATED)
async def create_or_update_hotel(payload: HotelCreate, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()

    if hotel:
        hotel.name = payload.name
        hotel.xotelo_hotel_key = payload.xotelo_hotel_key
        hotel.city = payload.city
        hotel.stars = payload.stars
    else:
        hotel = Hotel(
            user_id=current_user.id,
            name=payload.name,
            xotelo_hotel_key=payload.xotelo_hotel_key,
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
        competitor_xotelo_key=payload.competitor_xotelo_key,
        competitor_stars=payload.competitor_stars,
    )
    db.add(competitor)
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


@router.get("/search", response_model=list[HotelSearchResult])
async def search_hotels(q: str, current_user: CurrentUser):
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters.")
    results = await xotelo_provider.search_hotel(q)
    return [
        HotelSearchResult(
            hotel_key=r.hotel_key,
            name=r.name,
            address=r.address,
            city=r.city,
        )
        for r in results
    ]
