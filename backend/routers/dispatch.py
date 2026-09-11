import time
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/dispatch", tags=["Agent Dispatch"])

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
    print(f"\n--- INITIATING DOWNSTREAM PIPELINE FOR {student_id} ---")
    
    # In a real app, you would make HTTP requests to other microservices here
    downstream_agents = ["AGENT_12_COMM", "AGENT_14_REMEDIAL", "AGENT_45_SCHEDULE"]
    
    for agent in downstream_agents:
        simulate_downstream_agent(agent, orchestration_payload)
        
    print(f"--- PIPELINE DEPLOYED FOR {student_id} ---\n")