"""Add per-model tab title settings

Revision ID: 0006_model_tab_titles
Revises: 0005_settings_ordering
Create Date: 2026-04-07 16:45:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0006_model_tab_titles"
down_revision = "0005_settings_ordering"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_settings",
        sa.Column(
            "model_tab_titles",
            sa.Text(),
            server_default='{"claude":"Claude","gemini":"Gemini","gpt":"GPT","grok":"Grok","custom":"Custom"}',
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("user_settings", "model_tab_titles")
