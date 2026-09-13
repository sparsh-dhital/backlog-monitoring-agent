import type {
  DashboardData,
  OrchestrationData,
  ActivityEvent,
} from "./types/agent";
import { supabaseAuth } from "./supabaseClient";

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
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      `Unable to reach the backend at ${API_URL}. Start the API server or set VITE_API_URL to its public URL.`,
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
