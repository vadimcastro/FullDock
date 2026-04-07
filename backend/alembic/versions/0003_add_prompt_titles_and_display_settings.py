"""Add prompt titles and display settings

Revision ID: 0003_prompt_titles_settings
Revises: 0002_add_prompts_and_settings
Create Date: 2026-04-07 09:40:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_prompt_titles_settings"
down_revision = "0002_add_prompts_and_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "prompts",
        sa.Column("title", sa.String(), server_default="", nullable=False),
    )

    op.add_column(
        "user_settings",
        sa.Column("font_scale", sa.Integer(), server_default="100", nullable=False),
    )
    op.add_column(
        "user_settings",
        sa.Column("show_prompt_titles", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("user_settings", "show_prompt_titles")
    op.drop_column("user_settings", "font_scale")
    op.drop_column("prompts", "title")
