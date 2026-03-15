import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.config import settings
from app.models.user import User
from app.schemas.user import Token, TokenRefresh, UserCreate, UserLogin, UserOut

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _make_tokens(user_id: uuid.UUID) -> Token:
    access = _create_token(
        {"sub": str(user_id), "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh = _create_token(
        {"sub": str(user_id), "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return Token(access_token=access, refresh_token=refresh)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: DB):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=_hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.flush()
    return _make_tokens(user.id)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: DB):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not _verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    return _make_tokens(user.id)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: TokenRefresh, db: DB):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
    )
    try:
        data = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if data.get("type") != "refresh":
            raise credentials_exception
        user_id = uuid.UUID(data["sub"])
    except (JWTError, ValueError, KeyError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise credentials_exception

    return _make_tokens(user.id)


@router.get("/me", response_model=UserOut)
async def me(current_user: CurrentUser):
    return current_user
