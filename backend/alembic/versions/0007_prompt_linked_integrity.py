"""Enforce linked prompt ownership and integrity constraints

Revision ID: 0007_prompt_linked_integrity
Revises: 0006_model_tab_titles
Create Date: 2026-04-07 17:20:00.000000
"""

from alembic import op

revision = "0007_prompt_linked_integrity"
down_revision = "0006_model_tab_titles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Cleanup invalid links before adding strict constraints.
    op.execute(
        """
        UPDATE prompts
        SET linked_prompt_id = NULL
        WHERE linked_prompt_id = id
        """
    )
    op.execute(
        """
        UPDATE prompts p
        SET linked_prompt_id = NULL
        WHERE linked_prompt_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM prompts linked
            WHERE linked.id = p.linked_prompt_id
              AND linked.user_id = p.user_id
          )
        """
    )

    op.create_unique_constraint("uq_prompts_id_user_id", "prompts", ["id", "user_id"])
    op.create_check_constraint(
        "ck_prompts_linked_prompt_not_self",
        "prompts",
        "linked_prompt_id IS NULL OR linked_prompt_id <> id",
    )
    op.create_foreign_key(
        "fk_prompts_linked_prompt_owner",
        "prompts",
        "prompts",
        ["linked_prompt_id", "user_id"],
        ["id", "user_id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_prompts_user_linked_prompt_id",
        "prompts",
        ["user_id", "linked_prompt_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_prompts_user_linked_prompt_id", table_name="prompts")
    op.drop_constraint("fk_prompts_linked_prompt_owner", "prompts", type_="foreignkey")
    op.drop_constraint("ck_prompts_linked_prompt_not_self", "prompts", type_="check")
    op.drop_constraint("uq_prompts_id_user_id", "prompts", type_="unique")
