import os
from dotenv import load_dotenv
from fastapi import APIRouter
from supabase import Client
from supabase import create_client

load_dotenv()
supabase: Client | None = None
if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_KEY"):
    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])

@router.get("/agent-34/results/{student_id}")
def get_agent_34_results(student_id: str):
    return fetch_agent_34_results(student_id, supabase)


def fetch_agent_34_results(student_id: str, client: Client | None = None):
    client = client or supabase
    if client is None:
        return {"student_id": student_id, "results": []}
    try:
        response = client.table("results").select("*").eq("student_id", student_id).execute()
        return {"student_id": student_id, "results": response.data or []}
    except Exception:
        return {"student_id": student_id, "results": []}

@router.get("/agent-30/supplementary/{student_id}")
def get_agent_30_supplementary(student_id: str):
    return fetch_agent_30_supplementary(student_id, supabase)


def fetch_agent_30_supplementary(student_id: str, client: Client | None = None):
    client = client or supabase
    if client is None:
        return {"student_id": student_id, "supplementary_exams": []}
    try:
        response = client.table("supplementary_exams").select("*").eq("student_id", student_id).execute()
        return {"student_id": student_id, "supplementary_exams": response.data or []}
    except Exception:
        return {"student_id": student_id, "supplementary_exams": []}