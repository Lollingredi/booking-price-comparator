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

    # psycopg2 param non compreso da asyncpg → parametro corretto
    url = url.replace("sslmode=require", "ssl=require")

    # Compatibility shim: asyncpg < 0.29 non accetta il kwarg channel_binding
    # passato dalle versioni recenti di SQLAlchemy.
    try:
        import asyncpg as _asyncpg
        import inspect as _inspect
        _orig = _asyncpg.connect
        if "channel_binding" not in set(_inspect.signature(_orig).parameters):
            import functools
            @functools.wraps(_orig)
            async def _compat(*a, **kw):
                kw.pop("channel_binding", None)
                return await _orig(*a, **kw)
            _asyncpg.connect = _compat  # type: ignore[assignment]
    except Exception:
        pass  # asyncpg non installato o già patchato

    try:
        return create_async_engine(url, pool_pre_ping=True, pool_size=2, max_overflow=0)
    except Exception as exc:
        scheme = url.split("://")[0] if "://" in url else "?"
        logger.error(
            "Impossibile creare l'engine SQLAlchemy. Schema URL rilevato: '%s'.\n"
            "Assicurati che DATABASE_URL nel GitHub Secret sia nel formato:\n"
            "  postgres://utente:password@host/db\n"
            "oppure: postgresql+asyncpg://utente:password@host/db\n"
            "Se la password contiene caratteri speciali (@, #, %) devono essere URL-encoded.\n"
            "Errore tecnico: %s",
            scheme, exc,
        )
        sys.exit(1)


async def main() -> None:
    from app.services.rate_fetcher import fetch_all_hotels_rates
    from app.services.alert_engine import check_all_alerts

    engine = _make_engine()
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    today = date.today()
    total_processed = 0
    total_errors = 0
    total_prices = 0

    # ── 1. Scraping ────────────────────────────────────────────────────────────
    for offset in range(DAYS_AHEAD):
        check_in = today + timedelta(days=offset + 1)
        check_out = check_in + timedelta(days=1)
        logger.info("Scraping notte %s → %s (%d/%d)", check_in, check_out, offset + 1, DAYS_AHEAD)
        async with AsyncSessionLocal() as session:
            processed, errors, prices = await fetch_all_hotels_rates(session, check_in, check_out)
            total_processed += processed
            total_errors += errors
            total_prices += prices

    logger.info(
        "Scraping completato — processati: %d, errori: %d, prezzi salvati: %d",
        total_processed, total_errors, total_prices,
    )

    if total_prices == 0 and total_processed > 0:
        logger.error(
            "ATTENZIONE: %d hotel processati ma 0 prezzi trovati! "
            "Booking.com probabilmente blocca le richieste da GitHub Actions. "
            "Soluzione: aggiungi SCRAPER_PROXY nei GitHub Secrets "
            "(es. proxy residenziale Bright Data / Oxylabs).",
            total_processed,
        )

    # ── 2. Alerting ────────────────────────────────────────────────────────────
    check_in_alert = today + timedelta(days=1)  # valuta sulla prima notte futura
    logger.info("Valutazione alert rules per check_in=%s ...", check_in_alert)
    async with AsyncSessionLocal() as session:
        await check_all_alerts(session, check_in_alert)

    await engine.dispose()

    if total_errors or (total_prices == 0 and total_processed > 0):
        logger.warning(
            "Scraping terminato con problemi — errori: %d, prezzi: %d",
            total_errors, total_prices,
        )
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
