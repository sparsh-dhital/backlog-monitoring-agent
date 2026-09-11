export interface BacklogDetail {
  id: string;
  course_code: string;
  attempts_made: number;
  attempts_remaining?: number;
  status: string;
}

export interface OrchestrationData {
  agent_id: string;
  target_student_id: string;
  deterministic_evaluation: {
    student_id: string;
    active_backlog_count: number;
    max_allowed_backlogs: number;
    max_attempts?: number;
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
  integration_feeds?: {
    agent_34_results: {
      student_id: string;
      results: Array<{
        course_code: string;
        term: string;
        result: string;
      }>;
    };
    agent_30_supplementary: {
      student_id: string;
      supplementary_exams: Array<{
        course_code: string;
        supplementary_available: boolean;
        fee_cleared: boolean;
        attendance_eligible: boolean;
      }>;
    };
  };
}

export interface ActivityEvent {
  event_id: string;
  request_id: string;
  student_id: string;
  agent_id: string;
  status: string;
  message: string;
  created_at: string;
}
