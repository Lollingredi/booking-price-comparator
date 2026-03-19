import asyncio
import os
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Load .env file so DATABASE_URL is available
load_dotenv()

# Import all models so Alembic can detect them
from app.database import Base
import app.models  # noqa: F401 — registers models on Base.metadata

config = context.config

# Override sqlalchemy.url from environment variable if set
db_url = os.getenv("DATABASE_URL")
if db_url:
    # Normalize to asyncpg dialect (Neon/Render/Heroku ship postgres:// or postgresql://)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # asyncpg uses ssl=require, not psycopg2's sslmode=require
    db_url = db_url.replace("sslmode=require", "ssl=require")
    config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def _auto_stamp_if_untracked(connection) -> None:
    """If ALL application tables exist but alembic_version is missing or empty,
    stamp the DB at revision 001 so Alembic knows the schema is current.

    If only SOME tables exist (partial schema), do NOT stamp — let the migration
    run so the idempotent guards in 001_initial_schema.py create the missing ones.
    """
    result = await connection.execute(text(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables"
        " WHERE table_schema='public' AND table_name='alembic_version')"
    ))
    has_version_table = result.scalar()

    if has_version_table:
        result = await connection.execute(text("SELECT COUNT(*) FROM alembic_version"))
        if result.scalar() > 0:
            return  # tracking is in place, nothing to do

    # Check if ALL tables from migration 001 are present.
    # Only stamp when the full schema exists; if any table is missing let the
    # migration run — the idempotent CREATE TABLE guards will skip existing ones
    # and create the missing ones.
    expected = {"users", "hotels", "hotel_competitors", "rate_snapshots", "alert_rules", "alert_logs"}
    result = await connection.execute(text(
        "SELECT table_name FROM information_schema.tables"
        " WHERE table_schema='public' AND table_name = ANY(:names)"
    ), {"names": list(expected)})
    existing = {row[0] for row in result}

    if existing != expected:
        return  # partial schema — let the migration fill in the gaps

    # All tables exist but are untracked — stamp 001.
    if not has_version_table:
        await connection.execute(text(
            "CREATE TABLE alembic_version"
            " (version_num VARCHAR(32) NOT NULL,"
            " CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"
        ))
    await connection.execute(text(
        "INSERT INTO alembic_version (version_num) VALUES ('001')"
    ))
    await connection.commit()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await _auto_stamp_if_untracked(connection)
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
