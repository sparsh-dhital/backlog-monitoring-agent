import type { UserRole } from "./roles";

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

export interface DashboardStudent {
  student_id: string;
  active_backlog_count: number;
  max_attempts_made: number;
  status: string;
}

export interface DashboardData {
  student_id?: string | null;
  student_count: number;
  active_backlog_count: number;
  critical_case_count: number;
  intervention_count: number;
  students: DashboardStudent[];
  course_patterns: Array<{ course_code: string; count: number }>;
}

export interface BacklogRow {
  id: string;
  student_id: string;
  course_code: string;
  attempts_made: number;
  status: string;
}

export interface Identity {
  email: string | null;
  role: string | null;
  student_id: string | null;
}

export interface DirectoryStudent extends DashboardStudent {
  courses: string[];
}

export interface StudentDirectory {
  total: number;
  page: number;
  page_size: number;
  page_count: number;
  students: DirectoryStudent[];
}

export interface CourseRow {
  course_code: string;
  student_count: number;
  backlog_count: number;
  average_attempts: number;
  max_attempts_made: number;
  pressure: "HIGH" | "WATCH" | "STABLE";
}

export interface AlertRow {
  id: string;
  severity: "CRITICAL" | "WARNING";
  title: string;
  detail: string;
  student_ids: string[];
}

export interface AlertFeed {
  alerts: AlertRow[];
  unread_count: number;
}

export interface InterventionRow {
  id?: string;
  student_id: string;
  risk_level?: string;
  recommended_action?: string;
  human_approved?: boolean;
  mentor_id?: string;
  created_at?: string;
}

export interface ExamRegistrationRow {
  id?: string;
  student_id: string;
  course_code: string;
  fee_cleared?: boolean;
  eligibility_status?: string;
}

export interface ExamRegistrationFeed {
  registrations: ExamRegistrationRow[];
  eligible_count: number;
  fee_pending_count: number;
  total: number;
}

export type AssistantAction =
  | { type: "navigate"; tab: string }
  | { type: "open_student"; student_id: string }
  | { type: "close_student" }
  | { type: "theme"; mode: "dark" | "light" | "toggle" }
  | { type: "scroll"; direction: "up" | "down" | "top" | "bottom" }
  | { type: "switch_role"; role: UserRole }
  | { type: "click"; label: string }
  | { type: "export_report"; format: "json" | "csv" | "txt" }
  | { type: "approve_intervention" }
  | { type: "logout" };

export interface AssistantTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantRequest {
  utterance: string;
  role: UserRole;
  active_tab: string;
  available_tabs: string[];
  visible_controls: string[];
  open_case: Record<string, unknown> | null;
  dark_mode: boolean;
  history: AssistantTurn[];
}

export interface AssistantReply {
  reply: string;
  actions: AssistantAction[];
}
