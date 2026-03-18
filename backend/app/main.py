from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.api import auth, hotels, rates, alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist (migrations handle prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="RateScope API",
    description="Rate shopping SaaS for Italian hoteliers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(hotels.router, prefix="/api/hotels", tags=["hotels"])
app.include_router(rates.router, prefix="/api/rates", tags=["rates"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ratescope-api"}
