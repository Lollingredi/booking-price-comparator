import logging
import os
from datetime import date, datetime, timedelta
from decimal import Decimal

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DB
from app.models.hotel import Hotel, HotelCompetitor
from app.models.rate import RateSnapshot
from app.schemas.rate import ComparisonRow, HistoryPoint, HotelRates, RateSnapshotOut
from app.services.rate_fetcher import (
    SCRAPING_AVAILABLE,
    fetch_and_save_rates,
    fetch_rates_if_stale,
)

logger = logging.getLogger(__name__)
router = APIRouter()

_GH_OWNER = os.getenv("GITHUB_OWNER", "Lollingredi")
_GH_REPO = os.getenv("GITHUB_REPO", "booking-price-comparator")
_GH_WORKFLOW = "scrape_rates.yml"
_GH_BRANCH = os.getenv("GITHUB_BRANCH", "master")


async def _trigger_github_workflow(days_ahead: int) -> str | None:
    """Dispatch workflow_dispatch on GitHub Actions. Returns error string or None on success."""
    token = os.getenv("GITHUB_API_TOKEN")
    if not token:
        return "GITHUB_API_TOKEN non configurato su Render."
    url = f"https://api.github.com/repos/{_GH_OWNER}/{_GH_REPO}/actions/workflows/{_GH_WORKFLOW}/dispatches"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    payload = {"ref": _GH_BRANCH, "inputs": {"days_ahead": str(days_ahead)}}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers=headers)
    if resp.status_code == 204:
        return None
    logger.error("GitHub workflow dispatch failed: %s %s", resp.status_code, resp.text)
    return f"GitHub API error {resp.status_code}: {resp.text}"


class FetchNowResult(BaseModel):
    scraped: int
    prices_found: int
    errors: list[str]
    workflow_triggered: bool = False


@router.post("/fetch-now", response_model=FetchNowResult)
async def fetch_now(
    current_user: CurrentUser,
    db: DB,
    check_in: date = Query(...),
    check_out: date = Query(...),
    days_ahead: int = Query(default=7, ge=1, le=30),
):
    """Manually trigger a price scrape for the user's hotel + all active competitors.
    On Render (no Playwright) triggers the GitHub Actions workflow instead."""
    if not SCRAPING_AVAILABLE:
        err = await _trigger_github_workflow(days_ahead)
        if err:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Impossibile avviare il workflow GitHub Actions: {err} "
                    "Vai su github.com → Actions → 'Scrape Hotel Rates' → Run workflow."
                ),
            )
        return FetchNowResult(scraped=0, prices_found=0, errors=[], workflow_triggered=True)
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

    # Build the list of check-in dates to scrape
    date_offsets = list(range(days_ahead))
    check_in_dates = [(check_in + timedelta(days=i), check_in + timedelta(days=i + 1)) for i in date_offsets]

    for ci, co in check_in_dates:
        for key in keys:
            try:
                snaps = await fetch_and_save_rates(db, key, ci, co)
                scraped += 1
                prices_found += len(snaps)
                if len(snaps) == 0:
                    logger.warning(
                        "fetch-now: no prices found for slug=%r (%s→%s) — slug may be incorrect",
                        key, ci, co,
                    )
                else:
                    logger.info(
                        "fetch-now: %d price(s) for slug=%r (%s→%s)",
                        len(snaps), key, ci, co,
                    )
            except Exception as exc:
                logger.error(
                    "fetch-now: error scraping slug=%r (%s→%s): %s",
                    key, ci, co, exc, exc_info=True,
                )
                errors.append(f"{key} ({ci}): {exc}")

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
    since = datetime.utcnow() - timedelta(days=days)
    fetched_day = func.date(RateSnapshot.fetched_at).label("fetched_day")

    result = await db.execute(
        select(
            fetched_day,
            RateSnapshot.ota_code,
            RateSnapshot.ota_name,
            func.min(RateSnapshot.price).label("min_price"),
        )
        .where(
            RateSnapshot.hotel_booking_key == hotel_key,
            RateSnapshot.fetched_at >= since,
        )
        .group_by(
            func.date(RateSnapshot.fetched_at),
            RateSnapshot.ota_code,
            RateSnapshot.ota_name,
        )
        .order_by(func.date(RateSnapshot.fetched_at))
    )

    return [
        HistoryPoint(
            date=row.fetched_day,
            ota_code=row.ota_code,
            ota_name=row.ota_name,
            min_price=row.min_price,
        )
        for row in result.all()
    ]


@router.get("/history/all", response_model=list[HistoryPoint])
async def get_history_all(
    current_user: CurrentUser,
    db: DB,
    days: int = Query(default=30, ge=1, le=365),
):
    """Return price history for all hotels (own + competitors), one series per hotel name."""
    hotel_result = await db.execute(select(Hotel).where(Hotel.user_id == current_user.id))
    hotel = hotel_result.scalar_one_or_none()
    if not hotel:
        return []

    await db.refresh(hotel, ["competitors"])

    # Map booking_key -> display_name
    key_to_name: dict[str, str] = {}
    if hotel.booking_key:
        key_to_name[hotel.booking_key] = hotel.name
    for comp in hotel.competitors:
        if comp.competitor_booking_key:
            key_to_name[comp.competitor_booking_key] = comp.competitor_name

    if not key_to_name:
        return []

    today = date.today()
    from_date = today + timedelta(days=1)
    to_date = today + timedelta(days=days)

    result = await db.execute(
        select(
            RateSnapshot.hotel_booking_key,
            RateSnapshot.check_in_date,
            func.min(RateSnapshot.price).label("min_price"),
        )
        .where(
            RateSnapshot.hotel_booking_key.in_(list(key_to_name.keys())),
            RateSnapshot.check_in_date >= from_date,
            RateSnapshot.check_in_date <= to_date,
        )
        .group_by(
            RateSnapshot.hotel_booking_key,
            RateSnapshot.check_in_date,
        )
        .order_by(RateSnapshot.check_in_date)
    )

    return [
        HistoryPoint(
            date=row.check_in_date,
            ota_code=key_to_name[row.hotel_booking_key],
            ota_name=key_to_name[row.hotel_booking_key],
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
