import type {
  DashboardData,
  OrchestrationData,
  ActivityEvent,
} from "./types/agent";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error(
      `Unable to reach the backend at ${API_URL}. Start the API server or set VITE_API_URL to its public URL.`,
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(body?.detail || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export const api = {
  dashboard: () => request<DashboardData>("/api/dashboard"),
  orchestration: (studentId: string) =>
    request<OrchestrationData>(
      `/api/orchestrate/${encodeURIComponent(studentId)}`,
    ),
  activity: (studentId: string) =>
    request<{ events: ActivityEvent[] }>(
      `/api/dispatch/activity/${encodeURIComponent(studentId)}`,
    ),
  approve: (studentId: string, mentorId: string) =>
    request<{ status: string }>(
      `/api/approve-intervention/${encodeURIComponent(studentId)}?mentor_id=${encodeURIComponent(mentorId)}`,
      { method: "POST" },
    ),
};

export { API_URL };
