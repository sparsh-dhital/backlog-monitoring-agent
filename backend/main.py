import os
from collections import Counter
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Literal
from supabase import create_client, Client
from dotenv import load_dotenv

from rules_engine import evaluate_student_progression, orchestrate_agent_35_workflow
from routers.integrations import router as integrations_router
from routers.dispatch import router as dispatch_router, trigger_execution_pipeline
from auth import require_user

load_dotenv()

app = FastAPI(title="Agent 35 Backlog Monitoring Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://localhost:5175",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
if not url or not key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured")
supabase: Client = create_client(url, key)

app.include_router(integrations_router)
app.include_router(dispatch_router)

# Pydantic Model for External Feeds
class CustomFeeds(BaseModel):
    agent_34_results: Optional[Dict[str, Any]] = None
    agent_30_supplementary: Optional[Dict[str, Any]] = None


class RegistrationLookup(BaseModel):
    registration_number: str
    role: Literal["student", "mentor", "hod", "exam", "placement"]


@app.post("/api/auth/registration-phone")
def registration_phone(payload: RegistrationLookup):
    """Resolve a registration number to its stored phone for Supabase SMS OTP."""
    registration_number = payload.registration_number.strip()
    if not registration_number:
        raise HTTPException(status_code=400, detail="Registration number is required")

    try:
        result = (
            supabase.table(os.environ.get("REGISTRATION_TABLE", "profiles"))
            .select("phone")
            .eq("registration_number", registration_number)
            .eq("role", payload.role)
            .limit(1)
            .execute()
        )
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Registration lookup is not configured. Check the profiles table.",
        ) from error

    record = (result.data or [None])[0]
    phone = record.get("phone") if record else None
    if not phone:
        raise HTTPException(
            status_code=404,
            detail="No registered phone number was found for that account.",
        )
    return {"phone": phone}

@app.get("/")
def read_root():
    return {"status": "online", "service": "Agent 35: Backlog Monitoring Orchestrator"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/dashboard", dependencies=[Depends(require_user)])
def dashboard():
    try:
        backlogs = supabase.table("backlogs").select("*").execute().data or []
    except Exception as error:
        raise HTTPException(status_code=502, detail="Backlog data could not be loaded") from error

    pending_backlogs = [item for item in backlogs if item.get("status", "PENDING") == "PENDING"]
    student_ids = sorted({item.get("student_id") for item in pending_backlogs if item.get("student_id")})
    course_counts = Counter(item.get("course_code", "Unknown") for item in pending_backlogs)
    students = []
    for student_id in student_ids:
        records = [item for item in pending_backlogs if item.get("student_id") == student_id]
        attempts = [item.get("attempts_made", 0) for item in records]
        students.append({
            "student_id": student_id,
            "active_backlog_count": len(records),
            "max_attempts_made": max(attempts, default=0),
            "status": "CRITICAL" if max(attempts, default=0) >= 3 or len(records) >= 3 else "REVIEW",
        })

    try:
        interventions = supabase.table("interventions").select("*").execute().data or []
    except Exception:
        interventions = []

    return {
        "student_count": len(student_ids),
        "active_backlog_count": len(pending_backlogs),
        "critical_case_count": sum(item["status"] == "CRITICAL" for item in students),
        "intervention_count": len(interventions),
        "students": students,
        "course_patterns": [{"course_code": course, "count": count} for course, count in course_counts.most_common()],
    }

@app.get("/api/orchestrate/{student_id}", dependencies=[Depends(require_user)])
def run_orchestration(student_id: str):
    return orchestrate_agent_35_workflow(supabase, student_id)

@app.post("/api/orchestrate/{student_id}", dependencies=[Depends(require_user)])
def run_orchestration_custom(student_id: str, feeds: Optional[CustomFeeds] = None):
    """Saves external agent JSON directly into Supabase, then runs orchestration normally."""
    if feeds:
        try:
            # Save Agent 34 (Results) to Supabase
            if feeds.agent_34_results and "results" in feeds.agent_34_results:
                supabase.table("results").delete().eq("student_id", student_id).execute() # Clear old
                results_data = feeds.agent_34_results["results"]
                db_results = [
                    {"student_id": student_id, "course_code": r.get("course_code"), "term": r.get("term"), "result": r.get("result")} 
                    for r in results_data
                ]
                if db_results:
                    supabase.table("results").insert(db_results).execute()

            # Save Agent 30 (Supplementary) to Supabase
            if feeds.agent_30_supplementary and "supplementary_exams" in feeds.agent_30_supplementary:
                supabase.table("exam_registrations").delete().eq("student_id", student_id).execute() # Clear old
                supp_data = feeds.agent_30_supplementary["supplementary_exams"]
                db_exams = [
                    {
                        "student_id": student_id, 
                        "course_code": e.get("course_code"), 
                        "fee_cleared": e.get("fee_cleared", False),
                        "eligibility_status": "ELIGIBLE" if e.get("supplementary_available") else "DEBARRED"
                    } 
                    for e in supp_data
                ]
                if db_exams:
                    supabase.table("exam_registrations").insert(db_exams).execute()
        except Exception as e:
            print(f"Failed saving external JSON to Supabase: {e}")

    # Now run workflow strictly off Supabase data
    return orchestrate_agent_35_workflow(supabase, student_id)

@app.post("/api/approve-intervention/{student_id}", dependencies=[Depends(require_user)])
def approve_intervention(student_id: str, background_tasks: BackgroundTasks, mentor_id: str = "FACULTY_099"):
    if not mentor_id.strip():
        raise HTTPException(status_code=400, detail="mentor_id is required")
    try:
        supabase.table("interventions").insert({
            "student_id": student_id, "risk_level": "HIGH", "recommended_action": "AI-Orchestrated Recovery Plan Approved",
            "human_approved": True, "mentor_id": mentor_id
        }).execute()
        
        supabase.table("backlogs").update({"status": "INTERVENTION_ACTIVE"}).eq("student_id", student_id).eq("status", "PENDING").execute()
        
        payload = orchestrate_agent_35_workflow(supabase, student_id)
        background_tasks.add_task(trigger_execution_pipeline, student_id, payload)
        return {"status": "success", "message": "Intervention deployed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))