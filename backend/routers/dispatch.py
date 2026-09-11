import time
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/dispatch", tags=["Agent Dispatch"])
activity_store: Dict[str, list[dict[str, Any]]] = {}

def record_activity(student_id: str, agent_id: str, status: str, message: str, request_id: str):
    activity_store.setdefault(student_id, []).append({
        "event_id": str(uuid4()),
        "request_id": request_id,
        "student_id": student_id,
        "agent_id": agent_id,
        "status": status,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

@router.get("/activity/{student_id}")
def get_activity(student_id: str):
    return {"student_id": student_id, "events": activity_store.get(student_id, [])}

def simulate_downstream_agent(agent_id: str, payload: Dict[Any, Any]):
    """Simulates a webhook call to an external downstream agent."""
    time.sleep(1) # Simulate network latency
    print(f"[{agent_id}] Received orchestration contract for {payload['target_student_id']}")
    
    if agent_id == "AGENT_12_COMM":
        print(f"[{agent_id}] Action: Sending formal intervention email to student.")
    elif agent_id == "AGENT_45_SCHEDULE":
        print(f"[{agent_id}] Action: Booking faculty counseling slot.")

def trigger_execution_pipeline(student_id: str, orchestration_payload: dict):
    """Background task function to fire all relevant agents."""
    request_id = str(uuid4())
    record_activity(student_id, "AGENT_35", "STARTED", "Approved recovery plan dispatched.", request_id)
    print(f"\n--- INITIATING DOWNSTREAM PIPELINE FOR {student_id} ---")
    
    # In a real app, you would make HTTP requests to other microservices here
    downstream_agents = ["AGENT_12_COMM", "AGENT_14_REMEDIAL", "AGENT_45_SCHEDULE"]
    
    for agent in downstream_agents:
        record_activity(student_id, agent, "STARTED", "Downstream action started.", request_id)
        simulate_downstream_agent(agent, orchestration_payload)
        record_activity(student_id, agent, "COMPLETED", "Downstream action completed.", request_id)
        
    record_activity(student_id, "AGENT_35", "COMPLETED", "Intervention pipeline fully deployed.", request_id)
    print(f"--- PIPELINE DEPLOYED FOR {student_id} ---\n")