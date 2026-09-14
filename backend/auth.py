import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, status
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
_demo_roles = {"student", "mentor", "hod", "exam", "placement"}


def require_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_auth_scheme),
):
    demo_role = request.headers.get("X-Demo-Role")
    if demo_role and os.environ.get("DEMO_LOGIN_ENABLED", "false").lower() == "true":
        if demo_role not in _demo_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid demo role")
        return {"id": f"demo-{demo_role}", "role": demo_role, "demo": True}
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
