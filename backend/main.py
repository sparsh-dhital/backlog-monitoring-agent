import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

from rules_engine import evaluate_student_progression, orchestrate_agent_35_workflow
from routers.integrations import router as integrations_router
from routers.dispatch import trigger_execution_pipeline

load_dotenv()

app = FastAPI(title="Agent 35 Backlog Monitoring Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app.include_router(integrations_router)

@app.get("/api/test-db")
def test_database():
    response = supabase.table("regulations").select("*").execute()
    return {"status": "success", "data": response.data}

@app.get("/api/evaluate/{student_id}")
def evaluate_student(student_id: str):
    return evaluate_student_progression(supabase, student_id)

@app.get("/api/orchestrate/{student_id}")
def run_orchestration(student_id: str):
    return orchestrate_agent_35_workflow(supabase, student_id)

@app.post("/api/approve-intervention/{student_id}")
def approve_intervention(student_id: str, background_tasks: BackgroundTasks):
    try:
        # Wrap the Supabase insert in its own try block
        try:
            supabase.table("interventions").insert({
                "student_id": student_id,
                "risk_level": "HIGH",
                "recommended_action": "AI-Orchestrated Recovery Plan Approved",
                "human_approved": True
            }).execute()
        except Exception as db_error:
            print(f"⚠️ Warning: Could not log to Supabase 'interventions' table. Proceeding with dispatch. Error: {db_error}")
        
        # 2. Generate payload for downstream agents
        payload = orchestrate_agent_35_workflow(supabase, student_id)
        
        # 3. Fire background dispatcher
        background_tasks.add_task(trigger_execution_pipeline, student_id, payload)
        
        return {"status": "success", "message": "Intervention deployed successfully."}
    except Exception as e:
        # This will only fire if there's a critical error outside the DB layer
        print(f"Endpoint Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))