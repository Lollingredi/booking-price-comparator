"""Standalone scraper — eseguito dal GitHub Actions cron job.

Scarica i prezzi per tutti gli hotel e i competitor registrati nel DB,
poi valuta le regole di alerting.

Variabili d'ambiente richieste:
    DATABASE_URL   — stringa di connessione PostgreSQL async
                     (es. postgresql+asyncpg://user:pass@host/db)
                     oppure postgres:// / postgresql:// (normalizzato automaticamente)

Variabili opzionali:
    SCRAPE_DAYS_AHEAD  — quante notti future scansionare (default: 7)
    SCRAPER_PROXY      — proxy HTTP/SOCKS5 per Playwright
                         (es. http://user:pass@host:port)

Uso:
    DATABASE_URL=... python backend/scripts/scrape_all.py
"""

import asyncio
import logging
import os
import sys
from datetime import date, timedelta
from pathlib import Path

# Rende importabili i moduli dell'app anche quando lo script è lanciato
# dalla root del repo o dalla cartella backend/scripts/.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

DAYS_AHEAD = int(os.getenv("SCRAPE_DAYS_AHEAD", "7"))


def _make_engine():
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        logger.error("DATABASE_URL non impostata — interrompo.")
        sys.exit(1)

    # Normalizza schemi non-asyncpg restituiti da Render/Heroku/Neon
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return create_async_engine(url, pool_pre_ping=True, pool_size=2, max_overflow=0)


async def main() -> None:
    from app.services.rate_fetcher import fetch_all_hotels_rates
    from app.services.alert_engine import check_all_alerts

    engine = _make_engine()
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    today = date.today()
    total_processed = 0
    total_errors = 0

    # ── 1. Scraping ────────────────────────────────────────────────────────────
    for offset in range(DAYS_AHEAD):
        check_in = today + timedelta(days=offset + 1)
        check_out = check_in + timedelta(days=1)
        logger.info("Scraping notte %s → %s (%d/%d)", check_in, check_out, offset + 1, DAYS_AHEAD)
        async with AsyncSessionLocal() as session:
            processed, errors = await fetch_all_hotels_rates(session, check_in, check_out)
            total_processed += processed
            total_errors += errors

    logger.info(
        "Scraping completato — processati: %d, errori: %d", total_processed, total_errors
    )

    # ── 2. Alerting ────────────────────────────────────────────────────────────
    check_in_alert = today + timedelta(days=1)  # valuta sulla prima notte futura
    logger.info("Valutazione alert rules per check_in=%s ...", check_in_alert)
    async with AsyncSessionLocal() as session:
        await check_all_alerts(session, check_in_alert)

    await engine.dispose()

    if total_errors:
        logger.warning("%d errori durante lo scraping — controlla i log sopra.", total_errors)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
