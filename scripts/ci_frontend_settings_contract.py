#!/usr/bin/env python3
from pathlib import Path


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> int:
    root = Path(__file__).resolve().parents[1]

    preferences = (root / "frontend/src/components/preferences-view.tsx").read_text(encoding="utf-8")
    use_settings = (root / "frontend/src/hooks/use-settings.tsx").read_text(encoding="utf-8")
    cloud_sync = (root / "frontend/src/components/cloud-sync.tsx").read_text(encoding="utf-8")

    require("onCommit" in preferences, "missing_preferences_onCommit_handlers")
    require("onDragEnd" in preferences, "missing_reorder_drag_end_commit")
    require("reorderModelTabs" in preferences, "missing_model_tabs_reorder_usage")
    require("reorderPromptCategories" in preferences, "missing_prompt_categories_reorder_usage")
    require("updateModelTabTitle" in preferences, "missing_model_tab_title_commit_usage")

    require("queueSettingsSync" in use_settings, "missing_debounced_settings_sync")
    require("/api/v1/settings/layout/model-tabs" in use_settings, "missing_layout_tabs_endpoint_usage")
    require("/api/v1/settings/layout/prompt-categories" in use_settings, "missing_layout_categories_endpoint_usage")
    require("/api/v1/settings/layout/model-tab-title" in use_settings, "missing_layout_title_endpoint_usage")

    require("errorCode" in cloud_sync, "missing_cloud_sync_error_code_rendering")
    require("requestId" in cloud_sync, "missing_cloud_sync_request_id_rendering")

    print("PASS frontend_settings_contract")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
