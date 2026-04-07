#!/usr/bin/env python3
import os
import sys
from typing import Iterable

import psycopg2


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def fetch_set(cur, query: str, params: Iterable[object] = ()) -> set[str]:
    cur.execute(query, tuple(params))
    return {str(row[0]) for row in cur.fetchall()}


def main() -> int:
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres"),
        dbname=os.getenv("POSTGRES_DB", "ondeck"),
    )
    try:
        with conn.cursor() as cur:
            columns = fetch_set(
                cur,
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'prompts'
                """,
            )
            for name in ("title", "status", "order", "linked_prompt_id", "user_id", "model_id"):
                require(name in columns, f"missing_prompts_column={name}")

            user_setting_columns = fetch_set(
                cur,
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'user_settings'
                """,
            )
            for name in (
                "model_tab_order",
                "enabled_model_tabs",
                "custom_model_tab_title",
                "prompt_category_order",
                "enabled_prompt_categories",
                "model_tab_titles",
            ):
                require(name in user_setting_columns, f"missing_user_settings_column={name}")

            constraints = fetch_set(
                cur,
                """
                SELECT conname
                FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                JOIN pg_namespace n ON t.relnamespace = n.oid
                WHERE n.nspname = 'public' AND t.relname = 'prompts'
                """,
            )
            require("ck_prompts_status_valid" in constraints, "missing_constraint=ck_prompts_status_valid")

            indexes = fetch_set(
                cur,
                """
                SELECT indexname
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'prompts'
                """,
            )
            for index in (
                "ix_prompts_user_id",
                "ix_prompts_user_model_order",
                "ix_prompts_user_model_status",
            ):
                require(index in indexes, f"missing_index={index}")

            cur.execute("SELECT version_num FROM alembic_version")
            version = str(cur.fetchone()[0])
            require(version == "0006_model_tab_titles", f"unexpected_alembic_head={version}")

        print("PASS prompt_schema")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
