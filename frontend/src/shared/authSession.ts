import type { UserRole } from "../types/roles";

/** GitHub and Microsoft 365 sign-in is limited to this institution domain.
    The backend enforces the same rule; this copy only gives early feedback. */
export const ALLOWED_EMAIL_DOMAIN = String(
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || "vignan.ac.in",
)
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

export const DOMAIN_RESTRICTION_MESSAGE = `Sign-in is limited to @${ALLOWED_EMAIL_DOMAIN} accounts. Use your institution GitHub or Microsoft 365 account.`;

export function isAllowedInstitutionEmail(email: string | null | undefined) {
  const parts = (email ?? "").trim().toLowerCase().split("@");
  return parts.length === 2 && parts[0] !== "" && parts[1] === ALLOWED_EMAIL_DOMAIN;
}

/* ── Registration-number sessions ─────────────────────────────────────────
   After a one-time code is verified the API issues its own bearer token.
   It lives in sessionStorage alongside the rest of the tab's sign-in state. */

const OTP_SESSION_KEY = "edurecover-otp-session";

export type OtpSession = {
  token: string;
  role: UserRole;
  registrationNumber: string;
  studentId: string | null;
  /** Unix seconds. */
  expiresAt: number;
};

export function readOtpSession(): OtpSession | null {
  try {
    const raw = sessionStorage.getItem(OTP_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<OtpSession>;
    if (
      typeof session.token === "string" &&
      typeof session.expiresAt === "number" &&
      session.expiresAt * 1000 > Date.now()
    ) {
      return session as OtpSession;
    }
    sessionStorage.removeItem(OTP_SESSION_KEY);
  } catch {
    // Storage unavailable or unreadable: treat as signed out.
  }
  return null;
}

export function saveOtpSession(session: OtpSession) {
  try {
    sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the sign-in cannot persist past this page.
  }
}

export function clearOtpSession() {
  try {
    sessionStorage.removeItem(OTP_SESSION_KEY);
  } catch {
    // Storage unavailable.
  }
}
