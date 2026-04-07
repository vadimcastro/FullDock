"""Add model tab and prompt category ordering settings

Revision ID: 0005_settings_ordering
Revises: 0004_prompt_status_indexes
Create Date: 2026-04-07 16:10:00.000000
"""

from alembic import op

revision = "0005_settings_ordering"
down_revision = "0004_prompt_status_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS model_tab_order TEXT NOT NULL
        DEFAULT '["claude","gemini","gpt","grok"]'
        """
    )
    op.execute(
        """
        ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS enabled_model_tabs TEXT NOT NULL
        DEFAULT '["claude","gemini","gpt","grok"]'
        """
    )
    op.execute(
        """
        ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS custom_model_tab_title VARCHAR NOT NULL
        DEFAULT 'Custom'
        """
    )
    op.execute(
        """
        ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS prompt_category_order TEXT NOT NULL
        DEFAULT '["on-deck","needs-edit","queued","forked","complete"]'
        """
    )
    op.execute(
        """
        ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS enabled_prompt_categories TEXT NOT NULL
        DEFAULT '["on-deck","needs-edit","queued","forked","complete"]'
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE user_settings DROP COLUMN IF EXISTS enabled_prompt_categories")
    op.execute("ALTER TABLE user_settings DROP COLUMN IF EXISTS prompt_category_order")
    op.execute("ALTER TABLE user_settings DROP COLUMN IF EXISTS custom_model_tab_title")
    op.execute("ALTER TABLE user_settings DROP COLUMN IF EXISTS enabled_model_tabs")
    op.execute("ALTER TABLE user_settings DROP COLUMN IF EXISTS model_tab_order")
