"""Registration-number sign-in with a one-time code.

POST /api/auth/request-otp generates a random 6-digit code and prints it to the
backend terminal (no SMS gateway is wired up yet). POST /api/auth/verify-otp
checks it and returns a signed session token that require_user accepts.

Codes live in memory: single use, five-minute expiry, five guesses, a short
cooldown between requests, and all of them are dropped when the server restarts.
"""

import hmac
import re
import secrets
import threading
import time
from dataclasses import dataclass
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from auth import find_registration, issue_session_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_TTL_SECONDS = 5 * 60
RESEND_COOLDOWN_SECONDS = 30
MAX_ATTEMPTS = 5

_REGISTRATION_PATTERN = re.compile(r"[A-Z0-9][A-Z0-9/-]{2,31}")


class OtpRequest(BaseModel):
    registration_number: str
    role: Literal["student", "mentor", "hod", "exam", "placement"]


class OtpVerify(OtpRequest):
    otp: str


@dataclass
class _PendingCode:
    code: str
    issued_at: float
    expires_at: float
    attempts: int = 0


# Keyed by (registration number, role). Endpoints run in a thread pool.
_pending: dict[tuple[str, str], _PendingCode] = {}
_lock = threading.Lock()


def _normalize(registration_number: str) -> str:
    value = registration_number.strip().upper()
    if not _REGISTRATION_PATTERN.fullmatch(value):
        raise HTTPException(
            status_code=400,
            detail="Enter a valid registration number (letters, digits, '-' or '/').",
        )
    return value


@router.post("/request-otp")
def request_otp(payload: OtpRequest):
    registration_number = _normalize(payload.registration_number)
    registered = find_registration(registration_number, payload.role)
    if registered is False:
        raise HTTPException(
            status_code=404,
            detail="No account with that registration number was found for this role.",
        )

    key = (registration_number, payload.role)
    now = time.monotonic()
    with _lock:
        for stale in [item for item, pending in _pending.items() if pending.expires_at <= now]:
            del _pending[stale]
        existing = _pending.get(key)
        if existing and now - existing.issued_at < RESEND_COOLDOWN_SECONDS:
            wait = int(RESEND_COOLDOWN_SECONDS - (now - existing.issued_at)) + 1
            raise HTTPException(
                status_code=429,
                detail=f"A code was just generated. Wait {wait} seconds before requesting another.",
                headers={"Retry-After": str(wait)},
            )
        code = f"{secrets.randbelow(1_000_000):06d}"
        _pending[key] = _PendingCode(code=code, issued_at=now, expires_at=now + OTP_TTL_SECONDS)

    rule = "=" * 56
    lines = [
        "",
        rule,
        "  EduRecover sign-in code",
        f"  Registration: {registration_number}    Role: {payload.role}",
        f"  Code: {code}    (expires in {OTP_TTL_SECONDS // 60} minutes)",
    ]
    if registered is None:
        lines.append("  Note: no registration table, so the number was not checked.")
    lines += [rule, ""]
    print("\n".join(lines), flush=True)

    return {
        "sent": True,
        "expires_in": OTP_TTL_SECONDS,
        "resend_in": RESEND_COOLDOWN_SECONDS,
    }


@router.post("/verify-otp")
def verify_otp(payload: OtpVerify):
    registration_number = _normalize(payload.registration_number)
    key = (registration_number, payload.role)
    now = time.monotonic()
    with _lock:
        pending = _pending.get(key)
        if pending is None or pending.expires_at <= now:
            _pending.pop(key, None)
            raise HTTPException(
                status_code=400,
                detail="This code has expired or was never requested. Request a new code.",
            )
        pending.attempts += 1
        if not hmac.compare_digest(payload.otp.strip().encode(), pending.code.encode()):
            remaining = MAX_ATTEMPTS - pending.attempts
            if remaining <= 0:
                del _pending[key]
                raise HTTPException(
                    status_code=429,
                    detail="Too many incorrect attempts. Request a new code.",
                )
            raise HTTPException(
                status_code=401,
                detail=f"Incorrect code. {remaining} attempt{'' if remaining == 1 else 's'} left.",
            )
        # Single use: a verified code cannot be replayed.
        del _pending[key]

    token, expires_at = issue_session_token(registration_number, payload.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_at": expires_at,
        "role": payload.role,
        "registration_number": registration_number,
        "student_id": registration_number if payload.role == "student" else None,
    }
