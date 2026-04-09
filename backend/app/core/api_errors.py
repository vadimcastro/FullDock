from __future__ import annotations

from fastapi import HTTPException, status


def error_payload(code: str, message: str, request_id: str | None = None) -> dict[str, str]:
    payload: dict[str, str] = {"code": code, "message": message}
    if request_id:
        payload["request_id"] = request_id
    return payload


def bad_request(code: str, message: str, request_id: str | None = None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=error_payload(code=code, message=message, request_id=request_id),
    )


def unauthorized(code: str, message: str, request_id: str | None = None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=error_payload(code=code, message=message, request_id=request_id),
    )
