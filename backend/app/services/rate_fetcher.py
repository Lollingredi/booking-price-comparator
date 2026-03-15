import asyncio
import logging
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Hotel, HotelCompetitor, RateSnapshot
from app.services.xotelo import xotelo_provider

logger = logging.getLogger(__name__)

RATE_FRESHNESS_SECONDS = 3600  # 1 hour


async def is_data_fresh(db: AsyncSession, hotel_key: str, check_in: date, check_out: date) -> bool:
    """Return True if we have rates fetched within the freshness window."""
    cutoff = datetime.now(timezone.utc).timestamp() - RATE_FRESHNESS_SECONDS
    from datetime import datetime as dt
    cutoff_dt = dt.fromtimestamp(cutoff, tz=timezone.utc)

    result = await db.execute(
        select(RateSnapshot)
        .where(
            RateSnapshot.hotel_xotelo_key == hotel_key,
            RateSnapshot.check_in_date == check_in,
            RateSnapshot.check_out_date == check_out,
            RateSnapshot.fetched_at >= cutoff_dt,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def fetch_and_save_rates(
    db: AsyncSession,
    hotel_key: str,
    check_in: date,
    check_out: date,
) -> list[RateSnapshot]:
    """Fetch rates from Xotelo and persist them to the DB."""
    fetched_at = datetime.now(timezone.utc)
    rate_results = await xotelo_provider.fetch_rates(
        hotel_key,
        check_in.isoformat(),
        check_out.isoformat(),
    )

    snapshots = []
    for r in rate_results:
        snap = RateSnapshot(
            hotel_xotelo_key=hotel_key,
            ota_code=r.ota_code,
            ota_name=r.ota_name,
            price=r.price,
            currency=r.currency,
            check_in_date=check_in,
            check_out_date=check_out,
            fetched_at=fetched_at,
        )
        db.add(snap)
        snapshots.append(snap)

    await db.flush()
    logger.info(
        "Saved %d rate snapshots for hotel_key=%s check_in=%s",
        len(snapshots),
        hotel_key,
        check_in,
    )
    return snapshots


async def fetch_rates_if_stale(
    db: AsyncSession,
    hotel_key: str,
    check_in: date,
    check_out: date,
) -> list[RateSnapshot]:
    """Fetch fresh rates if existing data is stale; otherwise return cached."""
    if not await is_data_fresh(db, hotel_key, check_in, check_out):
        await fetch_and_save_rates(db, hotel_key, check_in, check_out)

    result = await db.execute(
        select(RateSnapshot)
        .where(
            RateSnapshot.hotel_xotelo_key == hotel_key,
            RateSnapshot.check_in_date == check_in,
            RateSnapshot.check_out_date == check_out,
        )
        .order_by(RateSnapshot.fetched_at.desc())
    )
    return list(result.scalars().all())


async def fetch_all_hotels_rates(db: AsyncSession, check_in: date, check_out: date):
    """Batch-fetch rates for all active hotels + competitors. Rate-limited to 1 req/s."""
    hotels_result = await db.execute(select(Hotel))
    hotels = hotels_result.scalars().all()

    all_keys: set[str] = set()
    for hotel in hotels:
        all_keys.add(hotel.xotelo_hotel_key)
        comps_result = await db.execute(
            select(HotelCompetitor).where(
                HotelCompetitor.hotel_id == hotel.id,
                HotelCompetitor.is_active == True,
            )
        )
        for comp in comps_result.scalars().all():
            all_keys.add(comp.competitor_xotelo_key)

    processed = 0
    errors = 0
    for key in all_keys:
        try:
            await fetch_and_save_rates(db, key, check_in, check_out)
            processed += 1
        except Exception as exc:
            logger.error("Failed to fetch rates for key=%s: %s", key, exc)
            errors += 1
        await asyncio.sleep(1)  # Xotelo rate limit

    await db.commit()
    logger.info(
        "fetch_all_hotels_rates done: processed=%d errors=%d",
        processed,
        errors,
    )
    return processed, errors
