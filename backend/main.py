import os
from collections import Counter
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

from rules_engine import evaluate_student_progression, orchestrate_agent_35_workflow
from routers.integrations import router as integrations_router
from routers.dispatch import router as dispatch_router, trigger_execution_pipeline

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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Agent 35: Backlog Monitoring Orchestrator",
        "message": "Backend is running successfully. API endpoints are available at /api/"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "backlog-monitoring-agent-api"}

@app.get("/api/test-db")
def test_database():
    response = supabase.table("regulations").select("*").execute()
    return {"status": "success", "data": response.data}

@app.get("/api/dashboard")
def dashboard():
    """Return dashboard facts computed from the institution's current records."""
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
        "course_patterns": [
            {"course_code": course, "count": count}
            for course, count in course_counts.most_common()
        ],
    }

@app.get("/api/evaluate/{student_id}")
def evaluate_student(student_id: str):
    return evaluate_student_progression(supabase, student_id)

@app.get("/api/orchestrate/{student_id}")
def run_orchestration(student_id: str):
    return orchestrate_agent_35_workflow(supabase, student_id)

@app.post("/api/approve-intervention/{student_id}")
def approve_intervention(student_id: str, background_tasks: BackgroundTasks, mentor_id: str = "FACULTY_099"):
    if not mentor_id.strip():
        raise HTTPException(status_code=400, detail="mentor_id is required")
    try:
        try:
            # 1. Log the mentor's approval with their ID
            supabase.table("interventions").insert({
                "student_id": student_id,
                "risk_level": "HIGH",
                "recommended_action": "AI-Orchestrated Recovery Plan Approved",
                "human_approved": True,
                "mentor_id": mentor_id
            }).execute()
            
            # 2. Close the Feedback Loop: Update backlogs so they aren't flagged again
            supabase.table("backlogs").update({
                "status": "INTERVENTION_ACTIVE"
            }).eq("student_id", student_id).eq("status", "PENDING").execute()
        except Exception as db_error:
            raise HTTPException(
                status_code=502,
                detail="Intervention could not be persisted; no downstream work was started.",
            ) from db_error
        
        # 3. Generate payload and fire background dispatcher
        payload = orchestrate_agent_35_workflow(supabase, student_id)
        background_tasks.add_task(trigger_execution_pipeline, student_id, payload)
        
        return {"status": "success", "message": "Intervention deployed and feedback loop closed."}
    except Exception as e:
        print(f"Endpoint Error: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))