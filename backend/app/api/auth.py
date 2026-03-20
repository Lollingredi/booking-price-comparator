import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.config import settings
from app.models.user import User
from app.schemas.user import Token, TokenRefresh, UserCreate, UserLogin, UserOut, UserUpdate

router = APIRouter()


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


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
    await db.commit()
    await db.refresh(user)
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


@router.patch("/me", response_model=UserOut)
async def update_me(payload: UserUpdate, current_user: CurrentUser, db: DB):
    """Update profile name, email, or password. Email/password changes require current_password."""
    needs_password = payload.email is not None or payload.new_password is not None
    if needs_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="current_password richiesta per modificare email o password.")
        if not _verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Password attuale non corretta.")

    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()

    if payload.full_name is not None:
        user.full_name = payload.full_name

    if payload.email is not None:
        dup = await db.execute(select(User).where(User.email == payload.email, User.id != user.id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email già in uso da un altro account.")
        user.email = payload.email

    if payload.new_password is not None:
        if len(payload.new_password) < 8:
            raise HTTPException(status_code=400, detail="La nuova password deve essere di almeno 8 caratteri.")
        user.hashed_password = _hash_password(payload.new_password)

    await db.commit()
    await db.refresh(user)
    return user
