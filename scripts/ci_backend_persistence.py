#!/usr/bin/env python3
import json
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Dict
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def request(
    base_url: str,
    method: str,
    path: str,
    *,
    token: str | None = None,
    json_body: Dict[str, Any] | None = None,
    form_body: Dict[str, str] | None = None,
) -> tuple[int, Dict[str, Any]]:
    url = f"{base_url.rstrip('/')}{path}"
    headers = {"Accept": "application/json"}
    data = None

    if token:
        headers["Authorization"] = f"Bearer {token}"
    if json_body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(json_body).encode("utf-8")
    elif form_body is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        data = urlencode(form_body).encode("utf-8")

    req = Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else {})
    except HTTPError as e:
        raw = e.read().decode("utf-8") if e.fp else ""
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw}
        return e.code, parsed
    except URLError as e:
        raise RuntimeError(f"request_failed {method} {path}: {e}") from e


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def wait_health(base_url: str, timeout_s: int = 90) -> None:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            status, _ = request(base_url, "GET", "/health")
            if status == 200:
                return
        except Exception:
            pass
        time.sleep(2)
    raise RuntimeError("health_check_failed")


def create_state(base_url: str, state_path: Path) -> None:
    wait_health(base_url)
    stamp = int(time.time())
    email = f"ci_persist_{stamp}@example.com"
    username = f"ci_persist_{stamp}"
    password = "Persist123!"
    prompt_id = str(uuid.uuid4())

    reg_status, reg_body = request(
        base_url,
        "POST",
        "/api/v1/auth/register",
        json_body={"email": email, "password": password, "username": username},
    )
    require(reg_status == 200 and reg_body.get("access_token"), f"register_failed={reg_status}")
    access = reg_body["access_token"]

    create_status, create_body = request(
        base_url,
        "POST",
        "/api/v1/prompts/",
        token=access,
        json_body={
            "id": prompt_id,
            "model_id": "gpt",
            "content": "persistence-check",
            "notes": "",
            "status": "queued",
            "order": 1,
        },
    )
    require(create_status == 200 and create_body.get("id") == prompt_id, f"prompt_create_failed={create_status}")

    state = {
        "email": email,
        "password": password,
        "prompt_id": prompt_id,
    }
    state_path.write_text(json.dumps(state), encoding="utf-8")
    print(f"PASS persistence_create prompt_id={prompt_id}")


def verify_state(base_url: str, state_path: Path) -> None:
    wait_health(base_url)
    state = json.loads(state_path.read_text(encoding="utf-8"))

    login_status, login_body = request(
        base_url,
        "POST",
        "/api/v1/auth/login",
        form_body={"username": state["email"], "password": state["password"]},
    )
    require(login_status == 200 and login_body.get("access_token"), f"login_failed={login_status}")
    access = login_body["access_token"]

    list_status, list_body = request(base_url, "GET", "/api/v1/prompts/", token=access)
    require(list_status == 200, f"prompt_list_failed={list_status}")
    found = any(str(item.get("id")) == state["prompt_id"] for item in list_body)
    require(found, "persistence_prompt_not_found_after_restart")
    print(f"PASS persistence_verify prompt_id={state['prompt_id']}")


def main() -> int:
    if len(sys.argv) < 4:
        print("usage: ci_backend_persistence.py <create|verify> <base_url> <state_file>")
        return 2

    mode = sys.argv[1].strip().lower()
    base_url = sys.argv[2].strip()
    state_path = Path(sys.argv[3]).resolve()

    if mode == "create":
        create_state(base_url, state_path)
        return 0
    if mode == "verify":
        verify_state(base_url, state_path)
        return 0

    print(f"unknown_mode={mode}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
