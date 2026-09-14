import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

load_dotenv(Path(__file__).with_name(".env"))

_auth_scheme = HTTPBearer(auto_error=False)
_supabase_url = os.environ.get("SUPABASE_URL")
_supabase_key = os.environ.get("SUPABASE_KEY")
_auth_client: Client | None = (
    create_client(_supabase_url, _supabase_key)
    if _supabase_url and _supabase_key
    else None
)
_demo_roles = {"student", "mentor", "hod", "exam", "placement"}

VALID_ROLES = ("student", "mentor", "hod", "exam", "placement")
STAFF_ROLES = ("mentor", "hod", "exam", "placement")

# ── Local development test login ────────────────────────────────────────────
# Off unless ALLOW_DEV_AUTH_BYPASS=true is present in backend/.env, which is
# gitignored and never deployed. Read once at import so a running server cannot
# be flipped open by a later environment change.
#
# It exists because the institutional flow (@vignan.ac.in OAuth, or
# registration + SMS OTP against a `profiles` table that does not yet exist)
# admits nobody on a developer machine. Never enable it on a deployed host:
# it accepts a self-asserted role with no proof of identity whatsoever.
_DEV_BYPASS = os.environ.get("ALLOW_DEV_AUTH_BYPASS", "").strip().lower() == "true"
_DEV_TOKEN_PREFIX = "dev:"

if _DEV_BYPASS:
    print(
        "[auth] ALLOW_DEV_AUTH_BYPASS=true — 'dev:<role>:<student_id>' bearer "
        "tokens are accepted WITHOUT identity verification. Local use only."
    )


class _DevUser:
    """Stands in for a Supabase user object, exposing only what the app reads."""

    def __init__(self, role: str, student_id: str | None):
        self.id = f"dev-{role}"
        self.email = f"dev-{role}@localhost.test"
        self.user_metadata = {"role": role}
        if student_id:
            self.user_metadata["student_id"] = student_id


def _dev_user_from_token(token: str) -> "_DevUser | None":
    """Parse 'dev:<role>:<student_id>'. Returns None if it is not one of ours."""
    if not _DEV_BYPASS or not token.startswith(_DEV_TOKEN_PREFIX):
        return None
    parts = token.split(":", 2)
    role = parts[1].strip().lower() if len(parts) > 1 else ""
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dev token role must be one of: {', '.join(VALID_ROLES)}.",
        )
    student_id = parts[2].strip() if len(parts) > 2 else ""
    return _DevUser(role, student_id or None)


def require_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_auth_scheme),
):
    demo_role = request.headers.get("X-Demo-Role")
    if demo_role and os.environ.get("DEMO_LOGIN_ENABLED", "false").lower() == "true":
        if demo_role not in _demo_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid demo role")
        return {
            "id": f"demo-{demo_role}",
            "role": demo_role,
            "student_id": "STU002" if demo_role == "student" else None,
            "demo": True,
        }
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # When the bypass is disabled this returns None and a 'dev:' token simply
    # falls through to Supabase, which rejects it like any other bad token.
    dev_user = _dev_user_from_token(credentials.credentials)
    if dev_user is not None:
        return dev_user
    if _auth_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured",
        )
    try:
        response = _auth_client.auth.get_user(credentials.credentials)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    if not response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return response.user


def user_role(user) -> str | None:
    """Role claim carried on the Supabase user's metadata."""
    metadata = user if isinstance(user, dict) else getattr(user, "user_metadata", None) or {}
    role = metadata.get("role")
    return role if role in VALID_ROLES else None


def user_student_id(user) -> str | None:
    """The student record this account belongs to, if any."""
    metadata = user if isinstance(user, dict) else getattr(user, "user_metadata", None) or {}
    value = metadata.get("student_id")
    return value.strip() if isinstance(value, str) and value.strip() else None


def user_email(user) -> str | None:
    """Return the authenticated email for OAuth/profile matching."""
    if isinstance(user, dict):
        value = user.get("email")
    else:
        value = getattr(user, "email", None)
    return value.strip().lower() if isinstance(value, str) and value.strip() else None


def linked_student_id(user) -> str | None:
    """Resolve a student metadata id, then fall back to the verified profile email."""
    direct = user_student_id(user)
    if direct or user_role(user) != "student":
        return direct
    email = user_email(user)
    if not email:
        return None
    if _auth_client is not None:
        try:
            result = (
                _auth_client.table(os.environ.get("REGISTRATION_TABLE", "profiles"))
                .select("registration_number")
                .eq("email", email)
                .eq("role", "student")
                .limit(1)
                .execute()
            )
            record = (result.data or [None])[0]
            registration_number = record.get("registration_number") if record else None
            if isinstance(registration_number, str) and registration_number.strip():
                return registration_number.strip()
        except Exception:
            pass
    return email.split("@", 1)[0].strip().upper()


def require_role(*allowed: str):
    """Dependency factory enforcing that the caller holds one of `allowed`.

    Authentication alone is not authorization: without this, every signed-in
    account could read every endpoint regardless of the role the UI shows.
    """

    def dependency(user=Depends(require_user)):
        role = user_role(user)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "No role is assigned to this account. "
                    "Sign up again or ask an administrator to set one."
                ),
            )
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This view requires one of: {', '.join(allowed)}.",
            )
        return user

    return dependency


def require_student(user=Depends(require_user)):
    """A student caller plus the student_id their account is bound to."""
    if user_role(user) != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This view is for student accounts.",
        )
    student_id = linked_student_id(user)
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This student account is not linked to a student record. "
                "Set a student ID on the account to continue."
            ),
        )
    return student_id
