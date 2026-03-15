"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-03-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    op.execute("CREATE TYPE plan_enum AS ENUM ('free', 'basic', 'pro')")
    op.execute("CREATE TYPE rule_type_enum AS ENUM ('competitor_price_drop', 'parity_issue', 'undercut')")
    op.execute("CREATE TYPE severity_enum AS ENUM ('info', 'warning', 'danger')")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("plan", sa.Enum("free", "basic", "pro", name="plan_enum"), nullable=False, server_default="free"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "hotels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("xotelo_hotel_key", sa.String(100), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("stars", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_hotels_user_id", "hotels", ["user_id"])

    op.create_table(
        "hotel_competitors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("hotel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False),
        sa.Column("competitor_name", sa.String(255), nullable=False),
        sa.Column("competitor_xotelo_key", sa.String(100), nullable=False),
        sa.Column("competitor_stars", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_hotel_competitors_hotel_id", "hotel_competitors", ["hotel_id"])

    op.create_table(
        "rate_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("hotel_xotelo_key", sa.String(100), nullable=False),
        sa.Column("ota_code", sa.String(50), nullable=False),
        sa.Column("ota_name", sa.String(100), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="EUR"),
        sa.Column("check_in_date", sa.Date(), nullable=False),
        sa.Column("check_out_date", sa.Date(), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_rate_snapshots_hotel_xotelo_key", "rate_snapshots", ["hotel_xotelo_key"])
    op.create_index("ix_rate_snapshots_fetched_at", "rate_snapshots", ["fetched_at"])

    op.create_table(
        "alert_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_type", sa.Enum("competitor_price_drop", "parity_issue", "undercut", name="rule_type_enum"), nullable=False),
        sa.Column("threshold_value", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("notify_email", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("notify_whatsapp", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_alert_rules_user_id", "alert_rules", ["user_id"])

    op.create_table(
        "alert_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("alert_rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", sa.Enum("info", "warning", "danger", name="severity_enum"), nullable=False, server_default="info"),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_alert_logs_user_id", "alert_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("alert_logs")
    op.drop_table("alert_rules")
    op.drop_table("rate_snapshots")
    op.drop_table("hotel_competitors")
    op.drop_table("hotels")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS severity_enum")
    op.execute("DROP TYPE IF EXISTS rule_type_enum")
    op.execute("DROP TYPE IF EXISTS plan_enum")
