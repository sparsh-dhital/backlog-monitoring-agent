import os
from collections import Counter
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from io import BytesIO
from fastapi.responses import StreamingResponse
from gtts import gTTS
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal
from supabase import create_client, Client
from dotenv import load_dotenv

from rules_engine import evaluate_student_progression, orchestrate_agent_35_workflow
from ai_agent import interpret_voice_command, transcribe_audio, translate_remarks
from routers.integrations import router as integrations_router
from routers.dispatch import router as dispatch_router, trigger_execution_pipeline
from auth import (
    STAFF_ROLES,
    require_role,
    require_student,
    require_user,
    linked_student_id,
    user_role,
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
    role: Literal["student", "mentor", "hod", "exam", "placement"]


class BacklogInput(BaseModel):
    course_code: str
    attempts_made: int = 0
    status: Literal["PENDING", "CLEARED", "EXHAUSTED"] = "PENDING"
    # Staff may file against any student; a student's own id comes from the token.
    student_id: Optional[str] = None


# Demo rows are tagged by course prefix so they can be cleared in one call
# without touching anything a user entered for real.
DEMO_PREFIX = "DEMO-"
DEMO_SEED = [
    ("DEMO-CS102", 2),
    ("DEMO-MA101", 1),
    ("DEMO-DBMS1", 3),
]


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


@app.get("/api/dashboard")
def dashboard(user=Depends(require_user)):
    pending = _pending_backlogs()
    student_id = None
    if user_role(user) == "student":
        student_id = linked_student_id(user)
        if not student_id:
            raise HTTPException(
                status_code=409,
                detail="This student account is not linked to a student record.",
            )
        pending = [item for item in pending if item.get("student_id") == student_id]
    elif user_role(user) not in STAFF_ROLES:
        raise HTTPException(
            status_code=403,
            detail=f"This view requires one of: {', '.join(STAFF_ROLES)}.",
        )
    students = _student_rows(pending)
    course_counts = Counter(item.get("course_code", "Unknown") for item in pending)

    return {
        "student_id": student_id,
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


def _write_error(error: Exception, what: str) -> HTTPException:
    """Turn a Postgres RLS refusal into something the user can act on.

    The backend authenticates with the publishable key, so writes are subject
    to row-level security exactly as a browser client would be.
    """
    message = str(error).lower()
    if "row-level security" in message or "42501" in message:
        return HTTPException(
            status_code=403,
            detail=(
                f"The database rejected this write: row-level security has no "
                f"INSERT policy for the {what} table. Add a policy in Supabase "
                f"(or point the API at a service-role key) to enable it."
            ),
        )
    return HTTPException(status_code=502, detail=f"{what.capitalize()} could not be saved")


def _target_student(user, requested: Optional[str]) -> str:
    """Which student a write applies to.

    A student is pinned to their own record regardless of what the request
    body asks for; staff may name any student.
    """
    role = user_role(user)
    if role == "student":
        own = linked_student_id(user)
        if not own:
            raise HTTPException(
                status_code=409,
                detail="This student account is not linked to a student record.",
            )
        return own
    if role in STAFF_ROLES:
        target = (requested or "").strip()
        if not target:
            raise HTTPException(status_code=400, detail="student_id is required")
        return target
    raise HTTPException(status_code=403, detail="No role is assigned to this account.")


@app.get("/api/backlogs")
def list_backlogs(user=Depends(require_user), student_id: str = ""):
    """Rows the caller may manage: their own if a student, any if staff."""
    target = _target_student(user, student_id or None) if (
        user_role(user) == "student" or student_id
    ) else None
    try:
        query = supabase.table("backlogs").select("*")
        if target:
            query = query.eq("student_id", target)
        elif user_role(user) not in STAFF_ROLES:
            raise HTTPException(status_code=403, detail="Not permitted.")
        rows = query.execute().data or []
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=502, detail="Backlogs could not be loaded") from error
    rows.sort(key=lambda row: (row.get("course_code") or ""))
    return {"backlogs": rows, "total": len(rows)}


@app.post("/api/backlogs", status_code=201)
def create_backlog(payload: BacklogInput, user=Depends(require_user)):
    course_code = payload.course_code.strip().upper()
    if not course_code:
        raise HTTPException(status_code=400, detail="Course code is required")
    if payload.attempts_made < 0 or payload.attempts_made > 10:
        raise HTTPException(
            status_code=400, detail="Attempts made must be between 0 and 10"
        )

    target = _target_student(user, payload.student_id)
    try:
        existing = (
            supabase.table("backlogs")
            .select("id")
            .eq("student_id", target)
            .eq("course_code", course_code)
            .execute()
            .data
            or []
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"{course_code} is already recorded for {target}.",
            )
        created = (
            supabase.table("backlogs")
            .insert({
                "student_id": target,
                "course_code": course_code,
                "attempts_made": payload.attempts_made,
                "status": payload.status,
            })
            .execute()
            .data
            or []
        )
    except HTTPException:
        raise
    except Exception as error:
        raise _write_error(error, "backlogs") from error
    return {"backlog": created[0] if created else None}


@app.post("/api/backlogs/demo", status_code=201)
def seed_demo_backlogs(user=Depends(require_user), student_id: str = ""):
    """Insert a few clearly-labelled sample rows the caller can remove again."""
    target = _target_student(user, student_id or None)
    try:
        existing = {
            row["course_code"]
            for row in (
                supabase.table("backlogs")
                .select("course_code")
                .eq("student_id", target)
                .execute()
                .data
                or []
            )
        }
        rows = [
            {
                "student_id": target,
                "course_code": course,
                "attempts_made": attempts,
                "status": "PENDING",
            }
            for course, attempts in DEMO_SEED
            if course not in existing
        ]
        created = (
            supabase.table("backlogs").insert(rows).execute().data or [] if rows else []
        )
    except Exception as error:
        raise _write_error(error, "backlogs") from error
    return {"created": len(created), "skipped": len(DEMO_SEED) - len(created)}


@app.delete("/api/backlogs/demo")
def clear_demo_backlogs(user=Depends(require_user), student_id: str = ""):
    target = _target_student(user, student_id or None)
    try:
        removed = (
            supabase.table("backlogs")
            .delete()
            .eq("student_id", target)
            .like("course_code", f"{DEMO_PREFIX}%")
            .execute()
            .data
            or []
        )
    except Exception as error:
        raise HTTPException(status_code=502, detail="Sample rows could not be removed") from error
    return {"deleted": len(removed)}


@app.delete("/api/backlogs/{backlog_id}")
def delete_backlog(backlog_id: str, user=Depends(require_user)):
    try:
        found = (
            supabase.table("backlogs").select("*").eq("id", backlog_id).execute().data
            or []
        )
    except Exception as error:
        raise HTTPException(status_code=502, detail="Backlog could not be read") from error
    if not found:
        raise HTTPException(status_code=404, detail="That backlog no longer exists.")

    # A student may only delete rows on their own record.
    if user_role(user) == "student" and found[0].get("student_id") != linked_student_id(user):
        raise HTTPException(status_code=403, detail="That record belongs to another student.")

    try:
        supabase.table("backlogs").delete().eq("id", backlog_id).execute()
    except Exception as error:
        raise HTTPException(status_code=502, detail="Backlog could not be deleted") from error
    return {"deleted": backlog_id}


@app.get("/api/me")
def me(user=Depends(require_user)):
    """Identity the front end trusts for routing, instead of sessionStorage."""
    return {
        "email": user.get("email") if isinstance(user, dict) else getattr(user, "email", None),
        "role": user_role(user),
        "student_id": linked_student_id(user),
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


class AssistantTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class AssistantRequest(BaseModel):
    utterance: str = Field(max_length=500)
    role: Optional[Literal["student", "mentor", "hod", "exam", "placement"]] = None
    active_tab: str = "Dashboard"
    available_tabs: List[str] = Field(default_factory=list, max_length=30)
    visible_controls: List[str] = Field(default_factory=list, max_length=120)
    open_case: Optional[Dict[str, Any]] = None
    dark_mode: bool = False
    history: List[AssistantTurn] = Field(default_factory=list, max_length=12)


def _assistant_records(user) -> dict:
    """Live figures the assistant may quote, scoped the same way as /api/dashboard."""
    role = user_role(user)
    try:
        if role == "student":
            student_id = linked_student_id(user)
            if not student_id:
                return {}
            return {"own_record": evaluate_student_progression(supabase, student_id)}
        if role in STAFF_ROLES:
            pending = _pending_backlogs()
            students = _student_rows(pending)
            course_counts = Counter(item.get("course_code", "Unknown") for item in pending)
            return {
                "active_backlog_count": len(pending),
                "student_count": len(students),
                "critical_case_count": sum(row["status"] == "CRITICAL" for row in students),
                "intervention_count": len(_interventions()),
                "alerts": list_alerts()["alerts"],
                "students": students[:50],
                "course_patterns": [
                    {"course_code": course, "count": count}
                    for course, count in course_counts.most_common(10)
                ],
            }
    except Exception:
        return {"unavailable": "Live records could not be loaded right now."}
    return {}


@app.post("/api/assistant")
def voice_assistant(request: AssistantRequest, user=Depends(require_user)):
    """Understand a free-form voice or typed request and plan the dashboard actions for it."""
    utterance = request.utterance.strip()
    if not utterance:
        raise HTTPException(status_code=400, detail="utterance is required")
    screen = request.model_dump(exclude={"utterance", "history"})
    history = [turn.model_dump() for turn in request.history]
    try:
        return interpret_voice_command(utterance, screen, _assistant_records(user), history)
    except Exception as error:
        print(f"[WARNING] Voice assistant error: {error}")
        raise HTTPException(
            status_code=503, detail="The voice assistant AI is unavailable right now."
        ) from error


MAX_AUDIO_BYTES = 10 * 1024 * 1024


@app.post("/api/transcribe")
async def transcribe(request: Request, user=Depends(require_user)):
    """Turn one recorded voice request (webm/ogg/mp4/wav body) into text."""
    audio = await request.body()
    if not audio:
        raise HTTPException(status_code=400, detail="Audio is required")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="The recording is too long")
    content_type = request.headers.get("content-type", "audio/webm")
    try:
        text = await run_in_threadpool(transcribe_audio, audio, content_type)
    except Exception as error:
        print(f"[WARNING] Transcription error: {error}")
        raise HTTPException(
            status_code=503, detail="Speech transcription is unavailable right now."
        ) from error
    return {"text": text}

@app.get("/api/evaluate/{student_id}")
def evaluate_student(student_id: str, user=Depends(require_user)):
    """Rule-engine facts only (no AI call) - staff for anyone, a student for themselves."""
    role = user_role(user)
    if role not in STAFF_ROLES and not (
        role == "student" and linked_student_id(user) == student_id
    ):
        raise HTTPException(status_code=403, detail="You cannot access this student record.")
    return evaluate_student_progression(supabase, student_id)

@app.get("/api/orchestrate/{student_id}")
def run_orchestration(student_id: str, user=Depends(require_user)):
    role = user_role(user)
    if role not in STAFF_ROLES and not (
        role == "student" and linked_student_id(user) == student_id
    ):
        raise HTTPException(status_code=403, detail="You cannot access this student record.")
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
        # Record the approval as an intervention. Approval means "support is
        # under way", NOT "the backlog is gone" — a backlog is only cleared by
        # passing the exam. Deliberately do NOT touch backlogs.status here:
        #   * "INTERVENTION_ACTIVE" is outside the status domain
        #     (PENDING|CLEARED|EXHAUSTED) and there is no CHECK constraint to
        #     catch it, so the write would silently succeed;
        #   * every progression calc filters on status == "PENDING"
        #     (rules_engine.py, _pending_backlogs), so hiding the rows would
        #     drop active_backlog_count to 0 and flip the most at-risk student
        #     to promotion-eligible the instant a mentor approves help.
        # Intervention state lives in the interventions table, which is where
        # the dashboard already reads it from.
        supabase.table("interventions").insert({
            "student_id": student_id,
            "risk_level": "HIGH",
            "recommended_action": "AI-Orchestrated Recovery Plan Approved",
            "human_approved": True,
            "mentor_id": mentor_id,
        }).execute()

        payload = orchestrate_agent_35_workflow(supabase, student_id)
        background_tasks.add_task(trigger_execution_pipeline, student_id, payload)
        return {"status": "success", "message": "Intervention deployed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))