import type { UserRole } from "./types/roles";

/**
 * Local-development test login.
 *
 * The merged institutional auth flow only admits @vignan.ac.in OAuth accounts
 * or registration-number + SMS OTP (which needs a `profiles` table that does
 * not exist yet). That leaves no way to open a role dashboard on a dev machine.
 *
 * This module provides a deliberate, visible stand-in for that case. It is
 * fenced two ways and both must hold before anything is honoured:
 *
 *   1. `import.meta.env.DEV` — true only under `npm run dev`. A production
 *      build (`npm run build`) compiles these checks out, so the control
 *      cannot render and the header cannot be attached on a deployed site.
 *   2. The API refuses the token unless ALLOW_DEV_AUTH_BYPASS=true is set in
 *      backend/.env, which is gitignored and never shipped to Render.
 *
 * It is not a backdoor: it grants nothing that the operator of the machine
 * cannot already do by editing the database directly, and it is inert the
 * moment either fence is absent.
 */

const STORAGE_KEY = "edurecover-dev-auth";

export interface DevSession {
  role: UserRole;
  studentId: string;
}

/** True only in a `vite dev` process. */
export function isDevAuthAvailable(): boolean {
  return Boolean(import.meta.env.DEV);
}

export function getDevSession(): DevSession | null {
  if (!isDevAuthAvailable()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DevSession>;
    if (!parsed?.role) return null;
    return { role: parsed.role, studentId: parsed.studentId ?? "" };
  } catch {
    return null;
  }
}

export function setDevSession(session: DevSession): void {
  if (!isDevAuthAvailable()) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearDevSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
}

/**
 * The bearer value the API recognises. Mirrors the parser in backend/auth.py,
 * which only accepts it when ALLOW_DEV_AUTH_BYPASS=true.
 */
export function devBearerToken(session: DevSession): string {
  return `dev:${session.role}:${session.studentId}`;
}
