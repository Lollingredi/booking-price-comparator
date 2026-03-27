import asyncio
import logging
from collections import defaultdict
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Hotel, HotelCompetitor, RateSnapshot
from app.config import settings
from app.services.providers import RateProvider

logger = logging.getLogger(__name__)

RATE_FRESHNESS_SECONDS = 3600  # 1 hour


def _get_provider() -> "RateProvider | None":
    """Return the primary rate provider (ScraperAPI), or None if key not set."""
    from app.services.scraper_api_provider import make_scraper_api_provider
    return make_scraper_api_provider()


def _get_all_providers() -> list[RateProvider]:
    """
    Return all available rate providers.
    ScraperAPI is the only supported provider (uses Booking.com slugs).
    Playwright is kept as an optional extra if SCRAPER_PROXY is configured.
    """
    providers: list[RateProvider] = []

    from app.services.scraper_api_provider import make_scraper_api_provider
    scraper_api = make_scraper_api_provider()
    if scraper_api:
        providers.append(scraper_api)
        logger.info("Using ScraperAPI as primary provider")
    else:
        logger.error(
            "SCRAPERAPI_KEY non impostata — nessun provider disponibile. "
            "Aggiungi SCRAPERAPI_KEY nei GitHub Secrets per abilitare lo scraping."
        )

    # Optional Playwright scrapers (only if proxy configured)
    proxy = settings.SCRAPER_PROXY or None
    if proxy:
        try:
            from app.services.booking_scraper import booking_provider
            providers.append(booking_provider)
        except Exception:
            pass

    return providers


# SCRAPING_AVAILABLE = True only in GitHub Actions (GITHUB_ACTIONS=true is set
# automatically) or when SCRAPER_FORCE_ENABLED=true is set explicitly.
# On Render (web server) this is False so fetch-now triggers GitHub Actions
# instead of running ScraperAPI synchronously (which would exceed the 30s timeout).
import os as _os
SCRAPING_AVAILABLE: bool = (
    _os.getenv("GITHUB_ACTIONS") == "true"
    or _os.getenv("SCRAPER_FORCE_ENABLED") == "true"
)


async def is_data_fresh(db: AsyncSession, hotel_key: str, check_in: date, check_out: date) -> bool:
    cutoff = datetime.now(timezone.utc).timestamp() - RATE_FRESHNESS_SECONDS
    from datetime import datetime as dt
    cutoff_dt = dt.fromtimestamp(cutoff, tz=timezone.utc)

    result = await db.execute(
        select(RateSnapshot)
        .where(
            RateSnapshot.hotel_booking_key == hotel_key,
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
    providers = _get_all_providers()
    if not providers:
        raise RuntimeError("Nessun provider di tariffe disponibile.")
    fetched_at = datetime.now(timezone.utc)

    # Fetch from all available OTA providers
    all_rate_results = []
    for provider in providers:
        try:
            results = await provider.fetch_rates(
                hotel_key,
                check_in.isoformat(),
                check_out.isoformat(),
            )
            all_rate_results.extend(results)
        except Exception as exc:
            logger.warning(
                "Provider %s failed for key=%s: %s",
                type(provider).__name__, hotel_key, exc,
            )

    snapshots = []
    for r in all_rate_results:
        snap = RateSnapshot(
            hotel_booking_key=hotel_key,
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
        "Saved %d rate snapshots for hotel_key=%s check_in=%s (providers: %d)",
        len(snapshots), hotel_key, check_in, len(providers),
    )
    return snapshots


async def fetch_rates_if_stale(
    db: AsyncSession,
    hotel_key: str,
    check_in: date,
    check_out: date,
) -> list[RateSnapshot]:
    if SCRAPING_AVAILABLE and not await is_data_fresh(db, hotel_key, check_in, check_out):
        await fetch_and_save_rates(db, hotel_key, check_in, check_out)

    result = await db.execute(
        select(RateSnapshot)
        .where(
            RateSnapshot.hotel_booking_key == hotel_key,
            RateSnapshot.check_in_date == check_in,
            RateSnapshot.check_out_date == check_out,
        )
        .order_by(RateSnapshot.fetched_at.desc())
    )
    return list(result.scalars().all())


async def fetch_all_hotels_rates(db: AsyncSession, check_in: date, check_out: date):
    """Batch-fetch rates for all active hotels + competitors with a configured slug."""
    hotels_result = await db.execute(select(Hotel))
    hotels = hotels_result.scalars().all()

    logger.info("fetch_all_hotels_rates: trovati %d hotel nel DB", len(hotels))

    # Load all active competitors in a single query to avoid N+1
    comps_result = await db.execute(
        select(HotelCompetitor).where(HotelCompetitor.is_active == True)
    )
    comp_map: dict = defaultdict(list)
    for comp in comps_result.scalars().all():
        comp_map[comp.hotel_id].append(comp)

    all_keys: set[str] = set()
    for hotel in hotels:
        key_val = repr(hotel.booking_key)
        if hotel.booking_key and hotel.booking_key.strip():
            all_keys.add(hotel.booking_key)
            logger.info("  hotel '%s' → booking_key=%s (OK)", hotel.name, key_val)
        else:
            logger.warning(
                "  hotel '%s' → booking_key=%s (VUOTO — vai su Impostazioni e imposta il Booking.com Slug)",
                hotel.name, key_val,
            )
        for comp in comp_map.get(hotel.id, []):
            comp_key_val = repr(comp.competitor_booking_key)
            if comp.competitor_booking_key and comp.competitor_booking_key.strip():
                all_keys.add(comp.competitor_booking_key)
                logger.info("    competitor '%s' → booking_key=%s (OK)", comp.competitor_name, comp_key_val)
            else:
                logger.warning(
                    "    competitor '%s' → booking_key=%s (VUOTO — slug mancante)",
                    comp.competitor_name, comp_key_val,
                )

    processed = 0
    errors = 0
    prices_found = 0
    for key in all_keys:
        try:
            snaps = await fetch_and_save_rates(db, key, check_in, check_out)
            processed += 1
            prices_found += len(snaps)
            if len(snaps) == 0:
                logger.warning(
                    "fetch_all_hotels_rates: 0 prezzi per slug=%s (%s→%s) — "
                    "verifica che lo slug Booking.com sia corretto e che l'hotel "
                    "abbia disponibilità per queste date.",
                    key, check_in, check_out,
                )
        except Exception as exc:
            logger.error("Failed to fetch rates for key=%s: %s", key, exc)
            errors += 1
        await asyncio.sleep(1)

    await db.commit()
    logger.info(
        "fetch_all_hotels_rates done: processed=%d errors=%d prices_found=%d",
        processed, errors, prices_found,
    )
    return processed, errors, prices_found
