"""Add per-model tab title settings

Revision ID: 0006_model_tab_titles
Revises: 0005_settings_ordering
Create Date: 2026-04-07 16:45:00.000000
"""

from alembic import op

revision = "0006_model_tab_titles"
down_revision = "0005_settings_ordering"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS model_tab_titles TEXT NOT NULL
        DEFAULT '{"claude":"Claude","gemini":"Gemini","gpt":"GPT","grok":"Grok"}'
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE user_settings DROP COLUMN IF EXISTS model_tab_titles")
