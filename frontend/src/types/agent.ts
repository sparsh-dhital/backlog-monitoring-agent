export interface BacklogDetail {
  id: string;
  course_code: string;
  attempts_made: number;
  status: string;
}

export interface OrchestrationData {
  agent_id: string;
  target_student_id: string;
  deterministic_evaluation: {
    student_id: string;
    active_backlog_count: number;
    max_allowed_backlogs: number;
    promotion_status: string;
    attempt_pressure: string;
    backlog_details: BacklogDetail[];
  };
  ai_orchestration: {
    recoverability_segment: string;
    reasoning: string;
    recommended_actions: string[];
    human_approval_required: boolean;
  };
}
