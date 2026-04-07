"""Harden prompt status values and query indexes

Revision ID: 0004_prompt_status_indexes
Revises: 0003_prompt_titles_settings
Create Date: 2026-04-07 13:10:00.000000
"""

from alembic import op

revision = "0004_prompt_status_indexes"
down_revision = "0003_prompt_titles_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Normalize historical drift before enforcing status constraint.
    op.execute(
        """
        UPDATE prompts
        SET status = 'complete'
        WHERE status = 'completed'
        """
    )
    op.execute(
        """
        UPDATE prompts
        SET status = 'queued'
        WHERE status NOT IN ('queued', 'on-deck', 'needs-edit', 'forked', 'complete')
           OR status IS NULL
        """
    )

    op.create_check_constraint(
        "ck_prompts_status_valid",
        "prompts",
        "status IN ('queued', 'on-deck', 'needs-edit', 'forked', 'complete')",
    )

    op.create_index("ix_prompts_user_id", "prompts", ["user_id"], unique=False)
    op.create_index(
        "ix_prompts_user_model_order",
        "prompts",
        ["user_id", "model_id", "order"],
        unique=False,
    )
    op.create_index(
        "ix_prompts_user_model_status",
        "prompts",
        ["user_id", "model_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_prompts_user_model_status", table_name="prompts")
    op.drop_index("ix_prompts_user_model_order", table_name="prompts")
    op.drop_index("ix_prompts_user_id", table_name="prompts")
    op.drop_constraint("ck_prompts_status_valid", "prompts", type_="check")
