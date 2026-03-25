import uuid

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.models.alert import AlertLog, AlertRule
from app.schemas.alert import AlertLogOut, AlertRuleCreate, AlertRuleOut, AlertRuleUpdate

router = APIRouter()

VALID_RULE_TYPES = {"competitor_price_drop", "parity_issue", "undercut"}


@router.get("/rules", response_model=list[AlertRuleOut])
async def list_rules(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(AlertRule).where(AlertRule.user_id == current_user.id).order_by(AlertRule.created_at)
    )
    return result.scalars().all()


@router.post("/rules", response_model=AlertRuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(payload: AlertRuleCreate, current_user: CurrentUser, db: DB):
    if payload.rule_type not in VALID_RULE_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"rule_type must be one of: {', '.join(VALID_RULE_TYPES)}",
        )
    rule = AlertRule(
        user_id=current_user.id,
        rule_type=payload.rule_type,
        threshold_value=payload.threshold_value,
        notify_email=payload.notify_email,
        notify_whatsapp=payload.notify_whatsapp,
    )
    db.add(rule)
    await db.flush()
    return rule


@router.put("/rules/{rule_id}", response_model=AlertRuleOut)
async def update_rule(rule_id: uuid.UUID, payload: AlertRuleUpdate, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(AlertRule).where(AlertRule.id == rule_id, AlertRule.user_id == current_user.id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found.")

    if payload.rule_type is not None:
        if payload.rule_type not in VALID_RULE_TYPES:
            raise HTTPException(status_code=422, detail="Invalid rule_type.")
        rule.rule_type = payload.rule_type
    if payload.threshold_value is not None:
        rule.threshold_value = payload.threshold_value
    if payload.is_active is not None:
        rule.is_active = payload.is_active
    if payload.notify_email is not None:
        rule.notify_email = payload.notify_email
    if payload.notify_whatsapp is not None:
        rule.notify_whatsapp = payload.notify_whatsapp

    await db.flush()
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(AlertRule).where(AlertRule.id == rule_id, AlertRule.user_id == current_user.id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found.")
    await db.delete(rule)
    await db.flush()


@router.get("/log", response_model=list[AlertLogOut])
async def get_alert_log(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(AlertLog)
        .where(AlertLog.user_id == current_user.id)
        .order_by(AlertLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return result.scalars().all()


@router.put("/log/{log_id}/read", response_model=AlertLogOut)
async def mark_as_read(log_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(AlertLog).where(AlertLog.id == log_id, AlertLog.user_id == current_user.id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Alert log entry not found.")
    log.is_read = True
    await db.flush()
    return log
