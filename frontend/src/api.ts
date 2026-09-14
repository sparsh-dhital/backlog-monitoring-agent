import type {
  AlertFeed,
  BacklogRow,
  CourseRow,
  DashboardData,
  ExamRegistrationFeed,
  Identity,
  InterventionRow,
  OrchestrationData,
  ActivityEvent,
  StudentDirectory,
} from "./types/agent";
import { supabaseAuth } from "./supabaseClient";
import { devBearerToken, getDevSession } from "./devAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/** A stalled backend accepts the socket but never answers, so requests need
 *  their own deadline — otherwise the UI waits on a skeleton indefinitely.
 *  Kept generous enough to survive a Render free-tier cold start. */
const REQUEST_TIMEOUT_MS = 45000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const headers = new Headers(init?.headers);

  // import.meta.env.DEV is the literal `false` in a production build, so the
  // whole dev branch is statically eliminated there — the token-attach path
  // below cannot exist on a deployed site, not merely go unused.
  const devSession = import.meta.env.DEV ? getDevSession() : null;
  if (devSession) {
    headers.set("Authorization", `Bearer ${devBearerToken(devSession)}`);
  } else {
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (requestError) {
    if (
      requestError instanceof DOMException &&
      requestError.name === "AbortError"
    ) {
      throw new Error(
        `The backend at ${API_URL} did not respond within ${REQUEST_TIMEOUT_MS / 1000}s. It may be stalled — restart the API server.`,
        { cause: requestError },
      );
    }
    throw new Error(
      `Unable to reach the backend at ${API_URL}. Start the API server or set VITE_API_URL to its public URL.`,
      { cause: requestError },
    );
  } finally {
    window.clearTimeout(timeout);
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
  registrationPhone: (registrationNumber: string, role: "student" | "mentor") =>
    request<{ phone: string }>("/api/auth/registration-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_number: registrationNumber,
        role,
      }),
    }),
  me: () => request<Identity>("/api/me"),
  mySummary: () => request<OrchestrationData>("/api/me/summary"),
  students: (params: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status_filter", params.status);
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.pageSize ?? 20));
    return request<StudentDirectory>(`/api/students?${query.toString()}`);
  },
  backlogs: (studentId?: string) =>
    request<{ backlogs: BacklogRow[]; total: number }>(
      `/api/backlogs${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ""}`,
    ),
  createBacklog: (input: {
    course_code: string;
    attempts_made: number;
    status?: string;
    student_id?: string;
  }) =>
    request<{ backlog: BacklogRow | null }>("/api/backlogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  deleteBacklog: (id: string) =>
    request<{ deleted: string }>(`/api/backlogs/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  seedDemoBacklogs: (studentId?: string) =>
    request<{ created: number; skipped: number }>(
      `/api/backlogs/demo${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ""}`,
      { method: "POST" },
    ),
  clearDemoBacklogs: (studentId?: string) =>
    request<{ deleted: number }>(
      `/api/backlogs/demo${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ""}`,
      { method: "DELETE" },
    ),
  courses: () => request<{ courses: CourseRow[] }>("/api/courses"),
  alerts: () => request<AlertFeed>("/api/alerts"),
  interventions: () =>
    request<{ interventions: InterventionRow[]; total: number }>(
      "/api/interventions",
    ),
  examRegistrations: () =>
    request<ExamRegistrationFeed>("/api/exam-registrations"),
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
  approve: (studentId: string, mentorId: string) =>
    request<{ status: string }>(
      `/api/approve-intervention/${encodeURIComponent(studentId)}?mentor_id=${encodeURIComponent(mentorId)}`,
      { method: "POST" },
    ),
};

export { API_URL };
