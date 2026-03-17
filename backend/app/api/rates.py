import logging
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DB
from app.models.hotel import Hotel, HotelCompetitor
from app.models.rate import RateSnapshot
from app.schemas.rate import ComparisonRow, HistoryPoint, HotelRates, RateSnapshotOut
from app.services.rate_fetcher import fetch_and_save_rates, fetch_rates_if_stale

logger = logging.getLogger(__name__)
router = APIRouter()


class FetchNowResult(BaseModel):
    scraped: int
    prices_found: int
    errors: list[str]


@router.post("/fetch-now", response_model=FetchNowResult)
async def fetch_now(
    current_user: CurrentUser,
    db: DB,
    check_in: date = Query(...),
    check_out: date = Query(...),
):
    """Manually trigger a price scrape for the user's hotel + all active competitors."""
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not configured.")

    comps_result = await db.execute(
        select(HotelCompetitor).where(
            HotelCompetitor.hotel_id == hotel.id,
            HotelCompetitor.is_active == True,
        )
    )
    competitors = comps_result.scalars().all()

    # Skip hotels without a configured Booking.com slug
    keys = [
        k for k in
        [hotel.booking_key] + [c.competitor_booking_key for c in competitors]
        if k and k.strip()
    ]

    if not keys:
        logger.warning(
            "fetch-now: no booking keys configured for user %s (hotel=%r)",
            current_user.id, hotel.name,
        )

    scraped = 0
    prices_found = 0
    errors: list[str] = []

    for key in keys:
        try:
            snaps = await fetch_and_save_rates(db, key, check_in, check_out)
            scraped += 1
            prices_found += len(snaps)
            if len(snaps) == 0:
                logger.warning(
                    "fetch-now: no prices found for slug=%r (%s→%s) — slug may be incorrect",
                    key, check_in, check_out,
                )
            else:
                logger.info(
                    "fetch-now: %d price(s) for slug=%r (%s→%s)",
                    len(snaps), key, check_in, check_out,
                )
        except Exception as exc:
            logger.error(
                "fetch-now: error scraping slug=%r (%s→%s): %s",
                key, check_in, check_out, exc, exc_info=True,
            )
            errors.append(f"{key}: {exc}")

    await db.commit()
    return FetchNowResult(scraped=scraped, prices_found=prices_found, errors=errors)


@router.get("/current", response_model=list[HotelRates])
async def get_current_rates(
    current_user: CurrentUser,
    db: DB,
    check_in: date = Query(...),
    check_out: date = Query(...),
):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not configured.")

    response: list[HotelRates] = []

    own_snapshots = (
        await fetch_rates_if_stale(db, hotel.booking_key, check_in, check_out)
        if hotel.booking_key and hotel.booking_key.strip()
        else []
    )
    response.append(
        HotelRates(
            hotel_key=hotel.booking_key,
            hotel_name=hotel.name,
            is_own_hotel=True,
            rates=[RateSnapshotOut.model_validate(s) for s in own_snapshots],
        )
    )

    comps_result = await db.execute(
        select(HotelCompetitor).where(
            HotelCompetitor.hotel_id == hotel.id,
            HotelCompetitor.is_active == True,
        )
    )
    competitors = comps_result.scalars().all()

    for comp in competitors:
        snapshots = (
            await fetch_rates_if_stale(db, comp.competitor_booking_key, check_in, check_out)
            if comp.competitor_booking_key and comp.competitor_booking_key.strip()
            else []
        )
        response.append(
            HotelRates(
                hotel_key=comp.competitor_booking_key,
                hotel_name=comp.competitor_name,
                is_own_hotel=False,
                rates=[RateSnapshotOut.model_validate(s) for s in snapshots],
            )
        )

    return response


@router.get("/history", response_model=list[HistoryPoint])
async def get_history(
    current_user: CurrentUser,
    db: DB,
    hotel_key: str = Query(...),
    days: int = Query(default=30, ge=1, le=365),
):
    since = date.today() - timedelta(days=days)

    result = await db.execute(
        select(
            RateSnapshot.check_in_date,
            RateSnapshot.ota_code,
            RateSnapshot.ota_name,
            func.min(RateSnapshot.price).label("min_price"),
        )
        .where(
            RateSnapshot.hotel_booking_key == hotel_key,
            RateSnapshot.check_in_date >= since,
        )
        .group_by(
            RateSnapshot.check_in_date,
            RateSnapshot.ota_code,
            RateSnapshot.ota_name,
        )
        .order_by(RateSnapshot.check_in_date)
    )

    return [
        HistoryPoint(
            date=row.check_in_date,
            ota_code=row.ota_code,
            ota_name=row.ota_name,
            min_price=row.min_price,
        )
        for row in result.all()
    ]


@router.get("/comparison", response_model=list[ComparisonRow])
async def get_comparison(
    current_user: CurrentUser,
    db: DB,
    check_in: date = Query(...),
    check_out: date = Query(...),
):
    result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not configured.")

    comps_result = await db.execute(
        select(HotelCompetitor).where(
            HotelCompetitor.hotel_id == hotel.id,
            HotelCompetitor.is_active == True,
        )
    )
    competitors = comps_result.scalars().all()

    all_hotels = [(hotel.booking_key, hotel.name, True)] + [
        (c.competitor_booking_key, c.competitor_name, False) for c in competitors
    ]

    all_ota_codes: set[str] = set()
    hotel_rate_maps: dict[str, dict[str, Decimal]] = {}

    for key, name, is_own in all_hotels:
        snaps_result = await db.execute(
            select(RateSnapshot)
            .where(
                RateSnapshot.hotel_booking_key == key,
                RateSnapshot.check_in_date == check_in,
                RateSnapshot.check_out_date == check_out,
            )
            .order_by(RateSnapshot.fetched_at.desc())
        )
        snaps = snaps_result.scalars().all()
        rate_map: dict[str, Decimal] = {}
        for s in snaps:
            if s.ota_code not in rate_map:
                rate_map[s.ota_code] = s.price
            all_ota_codes.add(s.ota_code)
        hotel_rate_maps[key] = rate_map

    rows: list[ComparisonRow] = []
    for key, name, is_own in all_hotels:
        rate_map = hotel_rate_maps.get(key, {})
        ota_prices: dict[str, Decimal | None] = {
            ota: rate_map.get(ota) for ota in all_ota_codes
        }
        prices_with_values = [p for p in ota_prices.values() if p is not None]
        min_price = min(prices_with_values) if prices_with_values else None
        rows.append(
            ComparisonRow(
                hotel_key=key,
                hotel_name=name,
                is_own_hotel=is_own,
                ota_prices=ota_prices,
                min_price=min_price,
                rank=0,
            )
        )

    sortable = [r for r in rows if r.min_price is not None]
    sortable.sort(key=lambda r: r.min_price)
    for i, r in enumerate(sortable, 1):
        r.rank = i
    no_price = [r for r in rows if r.min_price is None]
    for r in no_price:
        r.rank = len(sortable) + 1

    return rows
