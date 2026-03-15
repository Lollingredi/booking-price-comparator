import asyncio
import logging
from datetime import date, timedelta

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.periodic.fetch_all_rates", bind=True, max_retries=3)
def fetch_all_rates(self):
    """Fetch rates for all hotels and competitors. Runs every 6 hours."""
    async def _run():
        from app.database import AsyncSessionLocal
        from app.services.rate_fetcher import fetch_all_hotels_rates

        check_in = date.today()
        check_out = check_in + timedelta(days=1)

        async with AsyncSessionLocal() as db:
            try:
                processed, errors = await fetch_all_hotels_rates(db, check_in, check_out)
                logger.info(
                    "[fetch_all_rates] Done: processed=%d errors=%d check_in=%s",
                    processed,
                    errors,
                    check_in,
                )
                return {"processed": processed, "errors": errors}
            except Exception as exc:
                logger.error("[fetch_all_rates] Unexpected error: %s", exc)
                raise self.retry(exc=exc, countdown=60)

    return _run_async(_run())


@celery_app.task(name="app.tasks.periodic.check_alerts", bind=True, max_retries=3)
def check_alerts(self):
    """Evaluate alert rules for all users. Typically called after fetch_all_rates."""
    async def _run():
        from app.database import AsyncSessionLocal
        from app.services.alert_engine import check_all_alerts

        check_in = date.today()

        async with AsyncSessionLocal() as db:
            try:
                await check_all_alerts(db, check_in)
                logger.info("[check_alerts] Done for check_in=%s", check_in)
            except Exception as exc:
                logger.error("[check_alerts] Unexpected error: %s", exc)
                raise self.retry(exc=exc, countdown=60)

    return _run_async(_run())


# Chain: after fetch_all_rates succeeds, run check_alerts automatically
@celery_app.task(name="app.tasks.periodic.fetch_and_check")
def fetch_and_check():
    """Convenience task: fetch rates then check alerts."""
    from celery import chain
    chain(fetch_all_rates.s() | check_alerts.s()).delay()
