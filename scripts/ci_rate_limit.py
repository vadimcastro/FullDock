#!/usr/bin/env python3
import json
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def request_json(method: str, url: str, *, token: str | None = None, payload: dict | None = None) -> tuple[int, dict]:
    headers = {"Accept": "application/json"}
    data = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8")

    req = Request(url, headers=headers, data=data, method=method)
    try:
        with urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else {})
    except HTTPError as exc:
        raw = exc.read().decode("utf-8") if exc.fp else ""
        body = {}
        if raw:
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = {"raw": raw}
        return exc.code, body


def request_form(url: str, data: dict[str, str]) -> tuple[int, dict]:
    req = Request(
        url,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        data=urlencode(data).encode("utf-8"),
        method="POST",
    )
    try:
        with urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else {})
    except HTTPError as exc:
        raw = exc.read().decode("utf-8") if exc.fp else ""
        body = {}
        if raw:
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = {"raw": raw}
        return exc.code, body


def detail_code(body: dict) -> str:
    detail = body.get("detail")
    if isinstance(detail, dict):
        return str(detail.get("code") or "")
    return ""


def main() -> int:
    base = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
    max_attempts = int(sys.argv[2]) if len(sys.argv) > 2 else 320

    stamp = int(time.time())
    email = f"ci_rate_{stamp}@example.com"
    username = f"ci_rate_{stamp}"
    password = "RateSecret123!"

    register_status, _ = request_json(
        "POST",
        f"{base}/api/v1/auth/register",
        payload={"email": email, "password": password, "username": username},
    )
    require(register_status == 200, f"register_status={register_status}")

    login_status, login_body = request_form(
        f"{base}/api/v1/auth/login",
        {"username": email, "password": password},
    )
    require(login_status == 200, f"login_status={login_status}")
    token = str(login_body.get("access_token") or "")
    require(bool(token), "missing_access_token")

    last_status = 0
    last_body: dict = {}
    hit_rate_limit = False

    for idx in range(max_attempts):
        status, body = request_json(
            "POST",
            f"{base}/api/v1/settings/layout/model-tabs",
            token=token,
            payload={
                "order": ["claude", "gemini", "gpt", "grok", "custom-rate"],
                "enabled": ["claude", "gpt", "custom-rate"],
            },
        )
        last_status, last_body = status, body
        if status == 429:
            require(detail_code(body) == "WRITE_RATE_LIMITED", "rate_limit_code_mismatch")
            print(f"PASS rate_limit_hit attempt={idx + 1}")
            hit_rate_limit = True
            break
        require(status == 200, f"unexpected_status_before_limit={status}")

    require(hit_rate_limit, f"rate_limit_not_hit max_attempts={max_attempts} last_status={last_status} body={last_body}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
