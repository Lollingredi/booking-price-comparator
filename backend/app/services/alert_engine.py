import html
import logging
import uuid
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import AlertRule, AlertLog, Hotel, HotelCompetitor, RateSnapshot

logger = logging.getLogger(__name__)


async def _get_latest_rates(
    db: AsyncSession,
    hotel_key: str,
    check_in: date,
) -> list[RateSnapshot]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=12)
    result = await db.execute(
        select(RateSnapshot)
        .where(
            RateSnapshot.hotel_booking_key == hotel_key,
            RateSnapshot.check_in_date == check_in,
            RateSnapshot.fetched_at >= cutoff,
        )
        .order_by(RateSnapshot.fetched_at.desc())
    )
    return list(result.scalars().all())


async def _create_alert_log(
    db: AsyncSession,
    user_id: uuid.UUID,
    rule: AlertRule,
    message: str,
    severity: str,
) -> None:
    log = AlertLog(
        user_id=user_id,
        alert_rule_id=rule.id,
        message=message,
        severity=severity,
    )
    db.add(log)
    logger.info("ALERT [%s] user=%s: %s", severity.upper(), user_id, message)


async def evaluate_alerts_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    hotel: Hotel,
    check_in: date,
) -> None:
    """Evaluate all active alert rules for a user and create AlertLog entries."""
    if not hotel.booking_key or not hotel.booking_key.strip():
        return

    rules_result = await db.execute(
        select(AlertRule).where(
            AlertRule.user_id == user_id,
            AlertRule.is_active == True,
        )
    )
    rules = rules_result.scalars().all()
    if not rules:
        return

    own_rates = await _get_latest_rates(db, hotel.booking_key, check_in)
    if not own_rates:
        return

    own_prices: dict[str, Decimal] = {r.ota_code: r.price for r in own_rates}
    own_min = min(own_prices.values()) if own_prices else None

    comps_result = await db.execute(
        select(HotelCompetitor).where(
            HotelCompetitor.hotel_id == hotel.id,
            HotelCompetitor.is_active == True,
        )
    )
    competitors = comps_result.scalars().all()

    comp_rates_map: dict[str, dict[str, Decimal]] = {}
    for comp in competitors:
        if comp.competitor_booking_key and comp.competitor_booking_key.strip():
            comp_rates = await _get_latest_rates(db, comp.competitor_booking_key, check_in)
            comp_rates_map[comp.competitor_booking_key] = {r.ota_code: r.price for r in comp_rates}

    for rule in rules:
        safe_hotel = html.escape(hotel.name)

        if rule.rule_type == "parity_issue" and len(own_prices) >= 2:
            max_p = max(own_prices.values())
            min_p = min(own_prices.values())
            diff = float(max_p - min_p)
            if diff >= float(rule.threshold_value):
                await _create_alert_log(
                    db, user_id, rule,
                    f"Parity issue: {safe_hotel} price spread is €{diff:.2f} across OTAs "
                    f"(max €{max_p:.2f}, min €{min_p:.2f})",
                    "warning",
                )

        elif rule.rule_type == "undercut" and own_min is not None:
            for comp in competitors:
                safe_comp = html.escape(comp.competitor_name)
                comp_prices = comp_rates_map.get(comp.competitor_booking_key, {})
                comp_min = min(comp_prices.values()) if comp_prices else None
                if comp_min is not None and comp_min < own_min:
                    diff = float(own_min - comp_min)
                    await _create_alert_log(
                        db, user_id, rule,
                        f"Undercut: {safe_comp} is €{diff:.2f} cheaper than {safe_hotel} "
                        f"(competitor min: €{comp_min:.2f}, your min: €{own_min:.2f})",
                        "danger",
                    )

        elif rule.rule_type == "competitor_price_drop":
            threshold_pct = float(rule.threshold_value) / 100
            for comp in competitors:
                safe_comp = html.escape(comp.competitor_name)
                comp_prices = comp_rates_map.get(comp.competitor_booking_key, {})
                comp_min = min(comp_prices.values()) if comp_prices else None
                if comp_min is not None and own_min is not None and float(own_min) != 0.0:
                    drop_ratio = (float(own_min) - float(comp_min)) / float(own_min)
                    if drop_ratio >= threshold_pct:
                        await _create_alert_log(
                            db, user_id, rule,
                            f"Price drop: {safe_comp} dropped {drop_ratio*100:.1f}% below {safe_hotel} "
                            f"(competitor: €{comp_min:.2f}, yours: €{own_min:.2f})",
                            "warning",
                        )


async def check_all_alerts(db: AsyncSession, check_in: date):
    """Run alert checks for all users with active rules."""
    hotels_result = await db.execute(select(Hotel))
    hotels = hotels_result.scalars().all()

    for hotel in hotels:
        await evaluate_alerts_for_user(db, hotel.user_id, hotel, check_in)

    await db.commit()
    logger.info("check_all_alerts completed for check_in=%s", check_in)
