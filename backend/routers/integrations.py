from fastapi import APIRouter
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])

results_data = [
    {"student_id": "STU001", "course_code": "CS101", "term": "2023-ODD", "result": "PASS"},
    {"student_id": "STU002", "course_code": "CS102", "term": "2023-ODD", "result": "FAIL"},
    {"student_id": "STU003", "course_code": "MA101", "term": "2023-ODD", "result": "FAIL"},
    {"student_id": "STU003", "course_code": "DBMS1", "term": "2023-EVEN", "result": "FAIL"},
    {"student_id": "STU004", "course_code": "EE101", "term": "2023-ODD", "result": "FAIL"}
]
results_df = pd.DataFrame(results_data)

supp_data = [
    {"student_id": "STU002", "course_code": "CS102", "supplementary_available": True, "fee_cleared": True, "attendance_eligible": True},
    {"student_id": "STU003", "course_code": "MA101", "supplementary_available": True, "fee_cleared": False, "attendance_eligible": True},
    {"student_id": "STU004", "course_code": "EE101", "supplementary_available": False, "fee_cleared": True, "attendance_eligible": False}
]
supp_df = pd.DataFrame(supp_data)

@router.get("/agent-34/results/{student_id}")
def get_agent_34_results(student_id: str):
    student_results = results_df[results_df["student_id"] == student_id]
    if student_results.empty:
        return {"student_id": student_id, "results": []}
    return {"student_id": student_id, "results": student_results.to_dict(orient="records")}

@router.get("/agent-30/supplementary/{student_id}")
def get_agent_30_supplementary(student_id: str):
    student_supp = supp_df[supp_df["student_id"] == student_id]
    if student_supp.empty:
        return {"student_id": student_id, "supplementary_exams": []}
    return {"student_id": student_id, "supplementary_exams": student_supp.to_dict(orient="records")}