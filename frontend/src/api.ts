import type {
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
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 10000);
  const {
    data: { session },
  } = await Promise.race([
    supabaseAuth.auth.getSession(),
    new Promise<never>((_, reject) =>
      window.setTimeout(
        () => reject(new Error("The session lookup took too long.")),
        10000,
      ),
    ),
  ]);
  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  const demoRole = sessionStorage.getItem("edurecover-demo-role");
  if (demoRole) headers.set("X-Demo-Role", demoRole);
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: init?.signal ?? controller.signal,
    });
  } catch {
    if (init?.signal?.aborted) throw new Error("The request was cancelled.");
    if (timedOut) {
      throw new Error(
        "The backend took too long to respond. Please try again.",
      );
    }
    throw new Error(
      `Unable to reach the backend at ${API_URL}. Start the API server or set VITE_API_URL to its public URL.`,
    );
  } finally {
    window.clearTimeout(timeoutId);
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
  approve: (studentId: string, mentorId: string) =>
    request<{ status: string }>(
      `/api/approve-intervention/${encodeURIComponent(studentId)}?mentor_id=${encodeURIComponent(mentorId)}`,
      { method: "POST" },
    ),
};

export { API_URL };
