from fastapi import HTTPException
from supabase import Client
from routers.integrations import fetch_agent_34_results, fetch_agent_30_supplementary
from ai_agent import run_agent_35_orchestration

def evaluate_student_progression(supabase: Client, student_id: str):
    backlogs_res = supabase.table("backlogs").select("*").eq("student_id", student_id).eq("status", "PENDING").execute()
    backlogs = backlogs_res.data
    backlog_count = len(backlogs)

    batch_year = 2023 

    reg_res = supabase.table("regulations").select("*").eq("batch_year", batch_year).execute()
    if not reg_res.data:
        raise HTTPException(status_code=404, detail="Regulation not found for batch")
    
    regulation = reg_res.data[0]
    max_allowed_backlogs = regulation["max_backlogs_for_promotion"]
    max_attempts = regulation["max_attempts"]

    attempt_pressure = "LOW"
    for b in backlogs:
        if b["attempts_made"] >= max_attempts:
            attempt_pressure = "CRITICAL"
        elif b["attempts_made"] == max_attempts - 1 and attempt_pressure != "CRITICAL":
            attempt_pressure = "HIGH"

    is_eligible = backlog_count <= max_allowed_backlogs

    backlog_details = [
        {
            **backlog,
            "attempts_remaining": max(0, max_attempts - backlog["attempts_made"]),
        }
        for backlog in backlogs
    ]

    return {
        "student_id": student_id,
        "active_backlog_count": backlog_count,
        "max_allowed_backlogs": max_allowed_backlogs,
        "promotion_status": "ELIGIBLE" if is_eligible else "REVIEW_REQUIRED",
        "attempt_pressure": attempt_pressure,
        "backlog_details": backlog_details,
        "max_attempts": max_attempts,
    }

def orchestrate_agent_35_workflow(supabase: Client, student_id: str):
    eval_data = evaluate_student_progression(supabase, student_id)
    agent_34_payload = fetch_agent_34_results(student_id, supabase)
    agent_30_payload = fetch_agent_30_supplementary(student_id, supabase)
    ai_insights = run_agent_35_orchestration(eval_data, agent_34_payload, agent_30_payload)
    
    complete_assessment = {
        "agent_id": "AGENT_35",
        "target_student_id": student_id,
        "deterministic_evaluation": eval_data,
        "integration_feeds": {
            "agent_34_results": agent_34_payload,
            "agent_30_supplementary": agent_30_payload
        },
        "ai_orchestration": ai_insights
    }
    
    return complete_assessment