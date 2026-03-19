"""Fix a corrupted / mismatched migration state before running alembic upgrade head.

Handles two cases:
  A) alembic_version has '001' but the schema is incomplete (hotels missing).
     → Delete the stale stamp so the migration re-runs.

  B) users.id is not of type uuid (old integer-PK schema that predates the
     current migration).  hotels cannot be created because the FK type would
     mismatch.
     → Drop all application tables + custom enum types + alembic_version so
       the migration can build the full schema from scratch.

Uses asyncpg directly (no SQLAlchemy) to avoid dialect-version issues.
"""
import asyncio
import os
import re


def _asyncpg_dsn(url: str) -> str:
    url = re.sub(r"^postgresql\+asyncpg://", "postgresql://", url)
    url = re.sub(r"^postgres://", "postgresql://", url)
    return url


async def fix() -> None:
    raw = os.environ.get("DATABASE_URL")
    if not raw:
        print("DATABASE_URL not set — nothing to fix")
        return

    import asyncpg

    conn = await asyncpg.connect(_asyncpg_dsn(raw))
    try:
        await _fix(conn)
    finally:
        await conn.close()


async def _fix(conn) -> None:
    # ── Case B: users exists but with wrong column type ────────────────────
    users_exists = await conn.fetchval(
        "SELECT COUNT(*) FROM information_schema.tables"
        " WHERE table_schema='public' AND table_name='users'"
    )
    if users_exists:
        id_type = await conn.fetchval(
            "SELECT data_type FROM information_schema.columns"
            " WHERE table_schema='public' AND table_name='users' AND column_name='id'"
        )
        if id_type and id_type.lower() != "uuid":
            print(
                f"users.id has type '{id_type}' (expected uuid) — "
                "dropping all application tables for a clean migration"
            )
            await _drop_all(conn)
            return

    # ── Case A: stale alembic stamp (001 recorded but hotels missing) ──────
    version_exists = await conn.fetchval(
        "SELECT COUNT(*) FROM information_schema.tables"
        " WHERE table_schema='public' AND table_name='alembic_version'"
    )
    if not version_exists:
        print("No alembic_version table — nothing to fix")
        return

    stamped = await conn.fetchval("SELECT COUNT(*) FROM alembic_version")
    if not stamped:
        print("alembic_version is empty — nothing to fix")
        return

    hotels_exists = await conn.fetchval(
        "SELECT COUNT(*) FROM information_schema.tables"
        " WHERE table_schema='public' AND table_name='hotels'"
    )
    if hotels_exists:
        print("Schema looks complete — nothing to fix")
        return

    await conn.execute("DELETE FROM alembic_version")
    print("Cleared stale migration stamp — alembic upgrade head will re-run 001")


async def _drop_all(conn) -> None:
    """Drop all application objects so the migration starts from scratch."""
    # Tables in dependency order (children first)
    tables = [
        "alert_logs",
        "alert_rules",
        "hotel_competitors",
        "rate_snapshots",
        "hotels",
        "users",
        "alembic_version",
    ]
    for tbl in tables:
        await conn.execute(f'DROP TABLE IF EXISTS "{tbl}" CASCADE')
        print(f"  dropped table {tbl}")

    # Custom enum types
    for enum in ("plan_enum", "rule_type_enum", "severity_enum"):
        await conn.execute(f"DROP TYPE IF EXISTS {enum} CASCADE")
        print(f"  dropped type {enum}")

    print("Full schema reset complete — alembic upgrade head will create everything")


asyncio.run(fix())
