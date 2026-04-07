#!/usr/bin/env python3
import json
import sys
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


@dataclass
class Resp:
    status: int
    body: Dict[str, Any]


class Client:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")
        self.no_redirect = build_opener(NoRedirect())

    def request(
        self,
        method: str,
        path: str,
        *,
        token: Optional[str] = None,
        json_body: Optional[Dict[str, Any]] = None,
        form_body: Optional[Dict[str, str]] = None,
        follow_redirects: bool = True,
    ) -> Resp:
        url = f"{self.base}{path}"
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
        opener = None if follow_redirects else self.no_redirect

        try:
            if opener is None:
                with urlopen(req, timeout=30) as resp:
                    raw = resp.read().decode("utf-8")
                    parsed = json.loads(raw) if raw else {}
                    return Resp(status=resp.status, body=parsed)
            with opener.open(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                parsed = json.loads(raw) if raw else {}
                return Resp(status=resp.status, body=parsed)
        except HTTPError as e:
            raw = e.read().decode("utf-8") if e.fp else ""
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {"raw": raw}
            return Resp(status=e.code, body=parsed)
        except URLError as e:
            raise RuntimeError(f"request_failed {method} {path}: {e}") from e


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def pass_line(name: str) -> None:
    print(f"PASS {name}")


def wait_health(client: Client, timeout_s: int = 90) -> None:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            resp = client.request("GET", "/health")
            if resp.status == 200:
                pass_line("health")
                return
        except Exception:
            pass
        time.sleep(2)
    raise RuntimeError("health_check_failed")


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
    client = Client(base)

    wait_health(client)

    stamp = int(time.time())
    email = f"ci_smoke_{stamp}@example.com"
    username = f"ci_smoke_{stamp}"
    password = "Secret123!"
    new_password = "NewSecret123!"
    prompt_id = str(uuid.uuid4())
    fork_prompt_id = str(uuid.uuid4())

    register = client.request(
        "POST",
        "/api/v1/auth/register",
        json_body={"email": email, "password": password, "username": username},
    )
    require(register.status == 200, f"register_status={register.status}")
    require(bool(register.body.get("access_token")), "register_access_missing")
    pass_line("register")

    login = client.request(
        "POST",
        "/api/v1/auth/login",
        form_body={"username": email, "password": password},
    )
    require(login.status == 200, f"login_status={login.status}")
    login_access = login.body.get("access_token")
    login_refresh = login.body.get("refresh_token")
    require(bool(login_access and login_refresh), "login_tokens_missing")
    pass_line("login")

    me = client.request("GET", "/api/v1/auth/me", token=login_access)
    require(me.status == 200, f"me_status={me.status}")
    require(me.body.get("email") == email, "me_email_mismatch")
    pass_line("auth_me")

    refresh = client.request(
        "POST",
        "/api/v1/auth/refresh",
        json_body={"refresh_token": login_refresh},
    )
    require(refresh.status == 200, f"refresh_status={refresh.status}")
    access = refresh.body.get("access_token")
    refreshed_refresh = refresh.body.get("refresh_token")
    require(bool(access and refreshed_refresh), "refresh_tokens_missing")
    pass_line("refresh")

    settings_get = client.request("GET", "/api/v1/settings/", token=access)
    require(settings_get.status == 200, f"settings_get_status={settings_get.status}")
    pass_line("settings_get")

    settings_post = client.request(
        "POST",
        "/api/v1/settings/",
        token=access,
        json_body={
            "theme": "dark",
            "accentColor": "gpt",
            "soundEffects": True,
            "notifications": False,
        },
    )
    require(settings_post.status == 200, f"settings_post_status={settings_post.status}")
    require(settings_post.body.get("theme") == "dark", "settings_theme_mismatch")
    pass_line("settings_post")

    prompt_create = client.request(
        "POST",
        "/api/v1/prompts/",
        token=access,
        json_body={
            "id": prompt_id,
            "model_id": "gpt",
            "title": "ci smoke title",
            "content": "ci smoke prompt",
            "notes": "",
            "status": "on-deck",
            "order": 0,
        },
    )
    require(prompt_create.status == 200, f"prompts_create_status={prompt_create.status}")
    require(prompt_create.body.get("id") == prompt_id, "prompts_create_id_mismatch")
    require(prompt_create.body.get("title") == "ci smoke title", "prompts_create_title_mismatch")
    pass_line("prompts_create")

    fork_create = client.request(
        "POST",
        "/api/v1/prompts/",
        token=access,
        json_body={
            "id": fork_prompt_id,
            "model_id": "gpt",
            "title": "ci smoke fork",
            "content": "ci smoke fork prompt",
            "notes": "",
            "status": "forked",
            "order": 1,
        },
    )
    require(fork_create.status == 200, f"fork_create_status={fork_create.status}")
    require(fork_create.body.get("id") == fork_prompt_id, "fork_create_id_mismatch")
    pass_line("fork_create")

    prompts_list = client.request("GET", "/api/v1/prompts/", token=access)
    require(prompts_list.status == 200, f"prompts_list_status={prompts_list.status}")
    found = any(str(item.get("id")) == prompt_id for item in prompts_list.body)
    require(found, "prompts_list_missing_created_prompt")
    created_item = next((item for item in prompts_list.body if str(item.get("id")) == prompt_id), {})
    require(created_item.get("title") == "ci smoke title", "prompts_list_title_mismatch")
    pass_line("prompts_list")

    transition_needs_edit = client.request(
        "POST",
        f"/api/v1/prompts/{prompt_id}/transition",
        token=access,
        json_body={"status": "needs-edit"},
    )
    require(transition_needs_edit.status == 200, f"transition_needs_edit_status={transition_needs_edit.status}")
    require(transition_needs_edit.body.get("status") == "needs-edit", "transition_needs_edit_status_mismatch")
    pass_line("prompts_transition_needs_edit")

    post_transition_list = client.request("GET", "/api/v1/prompts/", token=access)
    require(post_transition_list.status == 200, f"post_transition_list_status={post_transition_list.status}")
    fork_item = next((item for item in post_transition_list.body if str(item.get("id")) == fork_prompt_id), {})
    require(fork_item.get("status") == "on-deck", "fork_not_promoted_to_on_deck")
    pass_line("fork_promoted_from_needs_edit")

    transition_back_on_deck = client.request(
        "POST",
        f"/api/v1/prompts/{prompt_id}/transition",
        token=access,
        json_body={"status": "on-deck"},
    )
    require(transition_back_on_deck.status == 200, f"transition_back_on_deck_status={transition_back_on_deck.status}")
    require(transition_back_on_deck.body.get("status") == "on-deck", "transition_back_on_deck_status_mismatch")
    pass_line("prompts_transition_back_on_deck")

    list_after_back = client.request("GET", "/api/v1/prompts/", token=access)
    require(list_after_back.status == 200, f"list_after_back_status={list_after_back.status}")
    fork_after_back = next((item for item in list_after_back.body if str(item.get("id")) == fork_prompt_id), {})
    require(fork_after_back.get("status") == "queued", "fork_not_demoted_when_original_back_on_deck")
    pass_line("fork_demoted_on_back_on_deck")

    transition_complete = client.request(
        "POST",
        f"/api/v1/prompts/{prompt_id}/transition",
        token=access,
        json_body={"status": "complete"},
    )
    require(transition_complete.status == 200, f"transition_complete_status={transition_complete.status}")
    require(transition_complete.body.get("status") == "complete", "transition_complete_status_mismatch")
    pass_line("prompts_transition_complete")

    list_after_complete = client.request("GET", "/api/v1/prompts/", token=access)
    require(list_after_complete.status == 200, f"list_after_complete_status={list_after_complete.status}")
    fork_after_complete = next((item for item in list_after_complete.body if str(item.get("id")) == fork_prompt_id), {})
    require(fork_after_complete.get("status") == "on-deck", "fork_not_promoted_after_complete")
    pass_line("fork_promoted_after_complete")

    invalid_status = client.request(
        "POST",
        f"/api/v1/prompts/{prompt_id}/transition",
        token=access,
        json_body={"status": "completed"},
    )
    require(invalid_status.status == 422, f"invalid_status_expected_422_got={invalid_status.status}")
    pass_line("invalid_status_rejected")

    prompts_delete = client.request("DELETE", f"/api/v1/prompts/{prompt_id}", token=access)
    require(prompts_delete.status == 200, f"prompts_delete_status={prompts_delete.status}")
    pass_line("prompts_delete")

    fork_delete = client.request("DELETE", f"/api/v1/prompts/{fork_prompt_id}", token=access)
    require(fork_delete.status == 200, f"fork_delete_status={fork_delete.status}")
    pass_line("fork_delete")

    logout = client.request(
        "POST",
        "/api/v1/auth/logout",
        json_body={"refresh_token": refreshed_refresh},
    )
    require(logout.status == 200 and logout.body.get("status") == "ok", f"logout_failed={logout.status}")
    pass_line("logout")

    logout_all = client.request("POST", "/api/v1/auth/logout-all", token=access)
    require(logout_all.status == 200 and logout_all.body.get("status") == "ok", f"logout_all_failed={logout_all.status}")
    pass_line("logout_all")

    oauth_google = client.request("GET", "/api/v1/oauth/google", follow_redirects=False)
    require(oauth_google.status in (307, 400), f"oauth_google_status={oauth_google.status}")
    pass_line(f"oauth_google_get({oauth_google.status})")

    oauth_github = client.request("GET", "/api/v1/oauth/github", follow_redirects=False)
    require(oauth_github.status in (307, 400), f"oauth_github_status={oauth_github.status}")
    pass_line(f"oauth_github_get({oauth_github.status})")

    reset_req = client.request(
        "POST",
        "/api/v1/auth/reset-password-request",
        json_body={"email": email},
    )
    require(reset_req.status == 200, f"reset_request_status={reset_req.status}")
    reset_token = reset_req.body.get("reset_token")
    require(bool(reset_token), "reset_token_missing_non_production")
    pass_line("reset_request")

    reset_confirm = client.request(
        "POST",
        "/api/v1/auth/reset-password-confirm",
        json_body={"token": reset_token, "new_password": new_password},
    )
    require(reset_confirm.status == 200 and reset_confirm.body.get("status") == "ok", f"reset_confirm_failed={reset_confirm.status}")
    pass_line("reset_confirm")

    old_login = client.request(
        "POST",
        "/api/v1/auth/login",
        form_body={"username": email, "password": password},
    )
    require(old_login.status == 401, f"old_password_expected_401_got={old_login.status}")
    pass_line("old_password_rejected")

    new_login = client.request(
        "POST",
        "/api/v1/auth/login",
        form_body={"username": email, "password": new_password},
    )
    require(new_login.status == 200 and bool(new_login.body.get("access_token")), f"new_password_login_status={new_login.status}")
    pass_line("new_password_login")

    print(f"SMOKE_EMAIL={email}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
