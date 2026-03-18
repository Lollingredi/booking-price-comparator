from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Normalize DATABASE_URL for asyncpg:
#   postgres://  or  postgresql://  →  postgresql+asyncpg://
#   ?sslmode=require  →  ?ssl=require  (psycopg2 param not understood by asyncpg)
_db_url = settings.DATABASE_URL
if not _db_url or _db_url == "postgresql+asyncpg://user:pass@localhost:5432/ratescope":
    import sys
    print(
        "FATAL: DATABASE_URL is not set or still uses the default placeholder.\n"
        "Set the DATABASE_URL environment variable in your Render service dashboard.",
        file=sys.stderr,
    )
    sys.exit(1)
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgresql://") and "+asyncpg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
_db_url = _db_url.replace("sslmode=require", "ssl=require")

# Compatibility shim: asyncpg < 0.29 doesn't accept the channel_binding kwarg
# that newer SQLAlchemy passes. Patch connect() to silently drop unknown params.
import asyncpg as _asyncpg
import inspect as _inspect

_orig_connect = _asyncpg.connect
_supported_params = set(_inspect.signature(_orig_connect).parameters)
if "channel_binding" not in _supported_params:
    import functools

    @functools.wraps(_orig_connect)
    async def _compat_connect(*args, **kwargs):
        kwargs.pop("channel_binding", None)
        return await _orig_connect(*args, **kwargs)

    _asyncpg.connect = _compat_connect  # type: ignore[assignment]

engine = create_async_engine(
    _db_url,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
