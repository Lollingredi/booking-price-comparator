import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AlertRuleCreate(BaseModel):
    rule_type: str
    threshold_value: Decimal
    notify_email: bool = True
    notify_whatsapp: bool = False


class AlertRuleUpdate(BaseModel):
    rule_type: str | None = None
    threshold_value: Decimal | None = None
    is_active: bool | None = None
    notify_email: bool | None = None
    notify_whatsapp: bool | None = None


class AlertRuleOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    rule_type: str
    threshold_value: Decimal
    is_active: bool
    notify_email: bool
    notify_whatsapp: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertLogOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    alert_rule_id: uuid.UUID
    message: str
    severity: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
