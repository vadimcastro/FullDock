"""Add model tab and prompt category ordering settings

Revision ID: 0005_settings_ordering
Revises: 0004_prompt_status_indexes
Create Date: 2026-04-07 16:10:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0005_settings_ordering"
down_revision = "0004_prompt_status_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_settings",
        sa.Column(
            "model_tab_order",
            sa.Text(),
            server_default='["claude","gemini","gpt","grok","custom"]',
            nullable=False,
        ),
    )
    op.add_column(
        "user_settings",
        sa.Column(
            "enabled_model_tabs",
            sa.Text(),
            server_default='["claude","gemini","gpt","grok"]',
            nullable=False,
        ),
    )
    op.add_column(
        "user_settings",
        sa.Column("custom_model_tab_title", sa.String(), server_default="Custom", nullable=False),
    )
    op.add_column(
        "user_settings",
        sa.Column(
            "prompt_category_order",
            sa.Text(),
            server_default='["on-deck","needs-edit","queued","forked","complete"]',
            nullable=False,
        ),
    )
    op.add_column(
        "user_settings",
        sa.Column(
            "enabled_prompt_categories",
            sa.Text(),
            server_default='["on-deck","needs-edit","queued","forked","complete"]',
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("user_settings", "enabled_prompt_categories")
    op.drop_column("user_settings", "prompt_category_order")
    op.drop_column("user_settings", "custom_model_tab_title")
    op.drop_column("user_settings", "enabled_model_tabs")
    op.drop_column("user_settings", "model_tab_order")
