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
    """If the application tables exist but alembic_version is missing,
    stamp the DB at revision 001 so Alembic knows the schema is current.

    This handles the case where the schema was created outside of Alembic
    (e.g. a previous Render deploy ran before migrations were set up).
    """
    result = await connection.execute(text(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables"
        " WHERE table_schema='public' AND table_name='alembic_version')"
    ))
    if result.scalar():
        return  # alembic_version already exists, nothing to do

    result = await connection.execute(text(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables"
        " WHERE table_schema='public' AND table_name='users')"
    ))
    if not result.scalar():
        return  # tables don't exist yet, let normal migration create them

    # Tables exist but are untracked — create alembic_version and stamp 001.
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
