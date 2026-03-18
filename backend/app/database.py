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
