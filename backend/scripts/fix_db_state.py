"""Fix a corrupted migration state.

If alembic_version contains '001' but the 'hotels' table does not exist,
a previous run stamped the revision before the migration completed.
Deleting the row lets `alembic upgrade head` re-run migration 001; the
idempotent CREATE TABLE guards inside the migration will skip any tables
that already exist and create the missing ones.
"""
import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


def _normalise_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url.replace("sslmode=require", "ssl=require")


async def fix() -> None:
    raw = os.environ.get("DATABASE_URL")
    if not raw:
        print("DATABASE_URL not set — nothing to fix")
        return

    engine = create_async_engine(_normalise_url(raw))
    try:
        async with engine.begin() as conn:
            # Does alembic_version exist?
            r = await conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables"
                " WHERE table_schema='public' AND table_name='alembic_version'"
            ))
            if not r.scalar():
                print("No alembic_version table — nothing to fix")
                return

            # Does it have a row?
            r = await conn.execute(text("SELECT COUNT(*) FROM alembic_version"))
            if not r.scalar():
                print("alembic_version is empty — nothing to fix")
                return

            # Is the schema actually complete?
            r = await conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables"
                " WHERE table_schema='public' AND table_name='hotels'"
            ))
            if r.scalar():
                print("Schema looks complete — nothing to fix")
                return

            # Stale stamp: 001 is recorded but hotels is missing.
            await conn.execute(text("DELETE FROM alembic_version"))
            print("Cleared stale migration stamp — alembic upgrade head will re-run 001")
    finally:
        await engine.dispose()


asyncio.run(fix())
