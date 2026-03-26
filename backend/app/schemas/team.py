import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class TeamMemberOut(BaseModel):
    id: uuid.UUID
    hotel_id: uuid.UUID
    user_id: uuid.UUID
    role: Literal["owner", "manager", "viewer"]
    invited_email: str | None
    created_at: datetime
    user_email: str | None = None
    user_name: str | None = None

    model_config = {"from_attributes": True}


class TeamInviteCreate(BaseModel):
    email: EmailStr
    role: Literal["manager", "viewer"] = "viewer"


class TeamMemberPatch(BaseModel):
    role: Literal["manager", "viewer"]
