import type {
  AssistantReply,
  AssistantRequest,
  DashboardData,
  OrchestrationData,
  ActivityEvent,
  BacklogRow,
} from "./types/agent";
import { supabaseAuth } from "./supabaseClient";
import type { UserRole } from "./types/roles";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const {
    data: { session },
  } = await supabaseAuth.auth.getSession();
  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  const demoRole = sessionStorage.getItem("edurecover-demo-role");
  if (demoRole) headers.set("X-Demo-Role", demoRole);
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      import.meta.env.DEV
        ? `Unable to reach the backend at ${API_URL}. Run "npm run dev" from the project root to start the frontend and backend together.`
        : `Unable to reach the backend at ${API_URL}. Start the API server or set VITE_API_URL to its public URL.`,
    );
  }
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("application/json")) {
    const body = contentType.includes("application/json")
      ? ((await response.json().catch(() => null)) as {
          detail?: string;
        } | null)
      : null;
    if (body?.detail) throw new Error(body.detail);
    throw new Error(
      response.ok
        ? `The API URL ${API_URL} returned HTML instead of JSON. Deploy the FastAPI backend separately and set VITE_API_URL to that backend URL.`
        : `API request failed with status ${response.status}. Check the backend deployment at ${API_URL}.`,
    );
  }
  return (await response.json()) as T;
}

export const api = {
  registrationPhone: (registrationNumber: string, role: UserRole) =>
    request<{ phone: string }>("/api/auth/registration-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_number: registrationNumber,
        role,
      }),
    }),
  dashboard: () => request<DashboardData>("/api/dashboard"),
  orchestration: (studentId: string, customFeeds?: Record<string, unknown>) => {
    const path = `/api/orchestrate/${encodeURIComponent(studentId)}`;
    if (customFeeds) {
      return request<OrchestrationData>(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customFeeds),
      });
    }
    return request<OrchestrationData>(path);
  },
  evaluation: (studentId: string) =>
    request<OrchestrationData["deterministic_evaluation"]>(
      `/api/evaluate/${encodeURIComponent(studentId)}`,
    ),
  activity: (studentId: string) =>
    request<{ events: ActivityEvent[] }>(
      `/api/dispatch/activity/${encodeURIComponent(studentId)}`,
    ),
  backlogs: (studentId?: string) => {
    const query = studentId
      ? `?student_id=${encodeURIComponent(studentId)}`
      : "";
    return request<{ backlogs: BacklogRow[]; total: number }>(
      `/api/backlogs${query}`,
    );
  },
  createBacklog: (payload: {
    course_code: string;
    attempts_made: number;
    status: "PENDING" | "CLEARED" | "EXHAUSTED";
    student_id?: string;
  }) =>
    request<{ backlog: BacklogRow | null }>("/api/backlogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteBacklog: (backlogId: string) =>
    request<{ deleted: string }>(
      `/api/backlogs/${encodeURIComponent(backlogId)}`,
      { method: "DELETE" },
    ),
  seedDemoBacklogs: (studentId?: string) => {
    const query = studentId
      ? `?student_id=${encodeURIComponent(studentId)}`
      : "";
    return request<{ created: number; skipped: number }>(
      `/api/backlogs/demo${query}`,
      { method: "POST" },
    );
  },
  clearDemoBacklogs: (studentId?: string) => {
    const query = studentId
      ? `?student_id=${encodeURIComponent(studentId)}`
      : "";
    return request<{ deleted: number }>(`/api/backlogs/demo${query}`, {
      method: "DELETE",
    });
  },
  transcribe: (audio: Blob) =>
    request<{ text: string }>("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": audio.type || "audio/webm" },
      body: audio,
    }),
  assistant: (payload: AssistantRequest) =>
    request<AssistantReply>("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  approve: (studentId: string, mentorId: string) =>
    request<{ status: string }>(
      `/api/approve-intervention/${encodeURIComponent(studentId)}?mentor_id=${encodeURIComponent(mentorId)}`,
      { method: "POST" },
    ),
};

export { API_URL };
