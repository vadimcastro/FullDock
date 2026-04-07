"""Add prompts and user settings tables

Revision ID: 0002_add_prompts_and_settings
Revises: 0001_add_oauth_accounts
Create Date: 2026-04-06 01:10:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_add_prompts_and_settings"
down_revision = "0001_add_oauth_accounts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create prompts table
    op.create_table(
        "prompts",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("model_id", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), server_default="", nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("linked_prompt_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=True),
    )
    op.create_index(op.f("ix_prompts_id"), "prompts", ["id"], unique=False)
    op.create_index(op.f("ix_prompts_model_id"), "prompts", ["model_id"], unique=False)
    op.create_index(op.f("ix_prompts_status"), "prompts", ["status"], unique=False)

    # Create user_settings table
    op.create_table(
        "user_settings",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("theme", sa.String(), server_default="dark", nullable=False),
        sa.Column("accent_color", sa.String(), server_default="teal", nullable=False),
        sa.Column("notifications", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("sound_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("auto_save", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("user_settings")
    op.drop_index(op.f("ix_prompts_status"), table_name="prompts")
    op.drop_index(op.f("ix_prompts_model_id"), table_name="prompts")
    op.drop_index(op.f("ix_prompts_id"), table_name="prompts")
    op.drop_table("prompts")
