"""Fix a corrupted migration state.

If alembic_version contains '001' but the 'hotels' table does not exist,
a previous run stamped the revision before the migration completed.
Deleting the row lets `alembic upgrade head` re-run migration 001; the
idempotent CREATE TABLE guards inside the migration will skip any tables
that already exist and create the missing ones.

Uses asyncpg directly (no SQLAlchemy) to avoid dialect-version
compatibility issues (e.g. 'channel_binding' kwarg conflicts).
"""
import asyncio
import os
import re


def _asyncpg_dsn(url: str) -> str:
    """Convert any postgresql:// variant to a plain DSN that asyncpg accepts."""
    url = re.sub(r"^postgresql\+asyncpg://", "postgresql://", url)
    url = re.sub(r"^postgres://", "postgresql://", url)
    # asyncpg accepts sslmode=require in the DSN
    return url


async def fix() -> None:
    raw = os.environ.get("DATABASE_URL")
    if not raw:
        print("DATABASE_URL not set — nothing to fix")
        return

    import asyncpg  # imported here so missing dep gives a clear error

    conn = await asyncpg.connect(_asyncpg_dsn(raw))
    try:
        # Does alembic_version exist?
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM information_schema.tables"
            " WHERE table_schema='public' AND table_name='alembic_version'"
        )
        if not count:
            print("No alembic_version table — nothing to fix")
            return

        # Does it have a row?
        count = await conn.fetchval("SELECT COUNT(*) FROM alembic_version")
        if not count:
            print("alembic_version is empty — nothing to fix")
            return

        # Is hotels already present? (schema complete)
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM information_schema.tables"
            " WHERE table_schema='public' AND table_name='hotels'"
        )
        if count:
            print("Schema looks complete — nothing to fix")
            return

        # Stale stamp: 001 recorded but hotels is missing — clear it.
        await conn.execute("DELETE FROM alembic_version")
        print("Cleared stale migration stamp — alembic upgrade head will re-run 001")
    finally:
        await conn.close()


asyncio.run(fix())
