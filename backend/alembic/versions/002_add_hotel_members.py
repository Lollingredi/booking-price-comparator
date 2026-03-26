"""Add hotel_members table for team multi-user

Revision ID: 002
Revises: 001
Create Date: 2026-03-25

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # Create enum type if not exists
    member_role_enum = postgresql.ENUM("owner", "manager", "viewer", name="member_role_enum", create_type=False)
    member_role_enum.create(bind, checkfirst=True)

    rows = bind.execute(
        sa.text(
            "SELECT table_name FROM information_schema.tables"
            " WHERE table_schema = 'public'"
        )
    )
    existing = {row[0] for row in rows}

    if "hotel_members" not in existing:
        op.create_table(
            "hotel_members",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("hotel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("role", member_role_enum, nullable=False, server_default="viewer"),
            sa.Column("invited_email", sa.String(255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.UniqueConstraint("hotel_id", "user_id", name="uq_hotel_member"),
        )
        op.create_index("ix_hotel_members_hotel_id", "hotel_members", ["hotel_id"])
        op.create_index("ix_hotel_members_user_id", "hotel_members", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_hotel_members_user_id", "hotel_members")
    op.drop_index("ix_hotel_members_hotel_id", "hotel_members")
    op.drop_table("hotel_members")
    op.execute("DROP TYPE IF EXISTS member_role_enum")
