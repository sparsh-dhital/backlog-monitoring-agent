import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

load_dotenv()

_auth_scheme = HTTPBearer(auto_error=False)
_supabase_url = os.environ.get("SUPABASE_URL")
_supabase_key = os.environ.get("SUPABASE_KEY")
_auth_client: Client | None = (
    create_client(_supabase_url, _supabase_key)
    if _supabase_url and _supabase_key
    else None
)


def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_auth_scheme),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
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


VALID_ROLES = ("student", "mentor", "hod", "exam", "placement")
STAFF_ROLES = ("mentor", "hod", "exam", "placement")


def user_role(user) -> str | None:
    """Role claim carried on the Supabase user's metadata."""
    metadata = getattr(user, "user_metadata", None) or {}
    role = metadata.get("role")
    return role if role in VALID_ROLES else None


def user_student_id(user) -> str | None:
    """The student record this account belongs to, if any."""
    metadata = getattr(user, "user_metadata", None) or {}
    value = metadata.get("student_id")
    return value.strip() if isinstance(value, str) and value.strip() else None


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
    student_id = user_student_id(user)
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This student account is not linked to a student record. "
                "Set a student ID on the account to continue."
            ),
        )
    return student_id
