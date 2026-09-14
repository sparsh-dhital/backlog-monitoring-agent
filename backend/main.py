import os
from collections import Counter
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from io import BytesIO
from fastapi.responses import StreamingResponse
from gtts import gTTS
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Literal
from supabase import create_client, Client
from dotenv import load_dotenv

from rules_engine import evaluate_student_progression, orchestrate_agent_35_workflow
from ai_agent import translate_remarks
from routers.integrations import router as integrations_router
from routers.dispatch import router as dispatch_router, trigger_execution_pipeline
from auth import (
    STAFF_ROLES,
    require_role,
    require_student,
    require_user,
    user_role,
    user_student_id,
)

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
    role: Literal["student", "mentor"]


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

def _pending_backlogs() -> list[dict]:
    try:
        backlogs = supabase.table("backlogs").select("*").execute().data or []
    except Exception as error:
        raise HTTPException(status_code=502, detail="Backlog data could not be loaded") from error
    return [item for item in backlogs if item.get("status", "PENDING") == "PENDING"]


def _student_rows(pending: list[dict]) -> list[dict]:
    """One row per student carrying the signals every staff view needs."""
    student_ids = sorted({item.get("student_id") for item in pending if item.get("student_id")})
    rows = []
    for student_id in student_ids:
        records = [item for item in pending if item.get("student_id") == student_id]
        attempts = [item.get("attempts_made", 0) for item in records]
        highest = max(attempts, default=0)
        rows.append({
            "student_id": student_id,
            "active_backlog_count": len(records),
            "max_attempts_made": highest,
            "courses": sorted({item.get("course_code", "Unknown") for item in records}),
            "status": "CRITICAL" if highest >= 3 or len(records) >= 3 else "REVIEW",
        })
    return rows


def _interventions() -> list[dict]:
    try:
        return supabase.table("interventions").select("*").execute().data or []
    except Exception:
        return []


@app.get("/api/dashboard", dependencies=[Depends(require_role(*STAFF_ROLES))])
def dashboard():
    pending = _pending_backlogs()
    students = _student_rows(pending)
    course_counts = Counter(item.get("course_code", "Unknown") for item in pending)

    return {
        "student_count": len(students),
        "active_backlog_count": len(pending),
        "critical_case_count": sum(item["status"] == "CRITICAL" for item in students),
        "intervention_count": len(_interventions()),
        "students": [
            {key: value for key, value in row.items() if key != "courses"}
            for row in students
        ],
        "course_patterns": [
            {"course_code": course, "count": count}
            for course, count in course_counts.most_common()
        ],
    }


@app.get("/api/me")
def me(user=Depends(require_user)):
    """Identity the front end trusts for routing, instead of sessionStorage."""
    return {
        "email": getattr(user, "email", None),
        "role": user_role(user),
        "student_id": user_student_id(user),
    }


@app.get("/api/me/summary")
def my_summary(student_id: str = Depends(require_student)):
    """A student's own record — scoped by token, never by a client-supplied id."""
    return orchestrate_agent_35_workflow(supabase, student_id)


@app.get("/api/students", dependencies=[Depends(require_role(*STAFF_ROLES))])
def list_students(
    search: str = "",
    status_filter: str = "",
    page: int = 1,
    page_size: int = 20,
):
    rows = _student_rows(_pending_backlogs())

    term = search.strip().lower()
    if term:
        rows = [
            row for row in rows
            if term in row["student_id"].lower()
            or any(term in course.lower() for course in row["courses"])
        ]

    wanted = status_filter.strip().upper()
    if wanted in ("CRITICAL", "REVIEW"):
        rows = [row for row in rows if row["status"] == wanted]

    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    total = len(rows)
    start = (page - 1) * page_size

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "page_count": max(1, (total + page_size - 1) // page_size),
        "students": rows[start:start + page_size],
    }


@app.get("/api/courses", dependencies=[Depends(require_role(*STAFF_ROLES))])
def list_courses():
    pending = _pending_backlogs()
    by_course: dict[str, list[dict]] = {}
    for item in pending:
        by_course.setdefault(item.get("course_code", "Unknown"), []).append(item)

    courses = []
    for course_code, records in by_course.items():
        attempts = [item.get("attempts_made", 0) for item in records]
        average = sum(attempts) / len(attempts) if attempts else 0
        courses.append({
            "course_code": course_code,
            "student_count": len({item.get("student_id") for item in records}),
            "backlog_count": len(records),
            "average_attempts": round(average, 1),
            "max_attempts_made": max(attempts, default=0),
            "pressure": (
                "HIGH" if average >= 2.5 or len(records) >= 5
                else "WATCH" if average >= 1.8 or len(records) >= 3
                else "STABLE"
            ),
        })
    courses.sort(key=lambda row: (-row["backlog_count"], row["course_code"]))
    return {"courses": courses}


@app.get("/api/alerts", dependencies=[Depends(require_user)])
def list_alerts():
    """Signals derived from live records — the bell badge and Alerts tab."""
    pending = _pending_backlogs()
    students = _student_rows(pending)
    alerts = []

    exhausted = [row for row in students if row["max_attempts_made"] >= 3]
    if exhausted:
        alerts.append({
            "id": "attempts-exhausted",
            "severity": "CRITICAL",
            "title": "Attempts exhausted",
            "detail": f"{len(exhausted)} student(s) at or past the attempt limit",
            "student_ids": [row["student_id"] for row in exhausted],
        })

    near_limit = [row for row in students if row["max_attempts_made"] == 2]
    if near_limit:
        alerts.append({
            "id": "attempts-near-limit",
            "severity": "WARNING",
            "title": "One attempt remaining",
            "detail": f"{len(near_limit)} student(s) on their final attempt",
            "student_ids": [row["student_id"] for row in near_limit],
        })

    over_promotion = [row for row in students if row["active_backlog_count"] > 4]
    if over_promotion:
        alerts.append({
            "id": "promotion-risk",
            "severity": "CRITICAL",
            "title": "Promotion blocked",
            "detail": f"{len(over_promotion)} student(s) above the backlog limit",
            "student_ids": [row["student_id"] for row in over_promotion],
        })

    return {"alerts": alerts, "unread_count": len(alerts)}


@app.get("/api/interventions", dependencies=[Depends(require_role(*STAFF_ROLES))])
def list_interventions():
    records = _interventions()
    records.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
    return {"interventions": records, "total": len(records)}


@app.get("/api/exam-registrations", dependencies=[Depends(require_role("exam", "hod"))])
def list_exam_registrations():
    try:
        rows = supabase.table("exam_registrations").select("*").execute().data or []
    except Exception as error:
        raise HTTPException(
            status_code=502, detail="Exam registration data could not be loaded"
        ) from error
    return {
        "registrations": rows,
        "eligible_count": sum(r.get("eligibility_status") == "ELIGIBLE" for r in rows),
        "fee_pending_count": sum(not r.get("fee_cleared") for r in rows),
        "total": len(rows),
    }

class TranslationRequest(BaseModel):
    text: str
    target_language: str

@app.post("/api/translate", dependencies=[Depends(require_user)])
def translate_agent_remarks(request: TranslationRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    return {"text": translate_remarks(request.text, request.target_language)}

@app.post("/api/tts/hindi", dependencies=[Depends(require_user)])
def hindi_speech(request: TranslationRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        audio = BytesIO()
        gTTS(text=request.text, lang="hi", tld="co.in", slow=False).write_to_fp(audio)
        audio.seek(0)
        return StreamingResponse(audio, media_type="audio/mpeg")
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Hindi speech unavailable: {error}")

@app.get("/api/evaluate/{student_id}", dependencies=[Depends(require_role(*STAFF_ROLES))])
def evaluate_student(student_id: str):
    return evaluate_student_progression(supabase, student_id)

@app.get("/api/orchestrate/{student_id}", dependencies=[Depends(require_role(*STAFF_ROLES))])
def run_orchestration(student_id: str):
    return orchestrate_agent_35_workflow(supabase, student_id)

@app.post("/api/orchestrate/{student_id}", dependencies=[Depends(require_role(*STAFF_ROLES))])
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

@app.post(
    "/api/approve-intervention/{student_id}",
    dependencies=[Depends(require_role("mentor", "hod"))],
)
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