import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  Code2,
  Info,
  LayoutDashboard,
  LockKeyhole,
  Activity,
  UserRound,
  UsersRound,
} from "lucide-react";
import { supabaseAuth } from "../supabaseClient";
import { api } from "../api";
import {
  ALLOWED_EMAIL_DOMAIN,
  DOMAIN_RESTRICTION_MESSAGE,
  clearOtpSession,
  isAllowedInstitutionEmail,
  saveOtpSession,
} from "../shared/authSession";
import { userRoles, type UserRole } from "../types/roles";
import Brand from "../components/Brand";
import "../styles/auth.css";

const roleIcons = {
  person: UserRound,
  mentor: UsersRound,
  command: LayoutDashboard,
  exam: ClipboardCheck,
  placement: BriefcaseBusiness,
};

/** A dashboard that rejected an out-of-domain session sends the user back here. */
function initialAuthMessage() {
  const error = new URLSearchParams(window.location.search).get("error");
  return error === "domain_restricted" ? DOMAIN_RESTRICTION_MESSAGE : "";
}

export default function AuthPage({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: (role: UserRole) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMessage, setAuthMessage] = useState(initialAuthMessage);
  const [authenticating, setAuthenticating] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    let active = true;
    const resetCancelledOAuth = () => {
      setAuthenticating(false);
      setAuthMessage(
        "Login revoked or cancelled by the user. You can try again.",
      );
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resetCancelledOAuth();
    };

    window.addEventListener("pageshow", handlePageShow);
    const callbackParams = new URLSearchParams(window.location.search);
    const callbackHash = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const callbackError =
      callbackParams.get("error") || callbackHash.get("error");
    if (callbackError === "access_denied") {
      resetCancelledOAuth();
    }
    if (callbackError === "access_denied" || callbackError === "domain_restricted") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      // Every Supabase session here comes from GitHub or Microsoft 365 OAuth.
      if (!isAllowedInstitutionEmail(data.session.user.email)) {
        await supabaseAuth.auth.signOut();
        if (active) {
          setAuthMessage(DOMAIN_RESTRICTION_MESSAGE);
          setAuthenticating(false);
        }
        return;
      }
      const savedRole = sessionStorage.getItem(
        "edurecover-pending-role",
      ) as UserRole | null;
      const role =
        savedRole && userRoles.some((item) => item.id === savedRole)
          ? savedRole
          : selectedRole;
      if (role) {
        const pendingStudentId = sessionStorage.getItem(
          "edurecover-pending-student-id",
        );
        const existingStudentId = data.session.user.user_metadata?.student_id;
        const emailStudentId =
          role === "student"
            ? data.session.user.email?.split("@", 1)[0]?.trim().toUpperCase()
            : undefined;
        const { error: metadataError } = await supabaseAuth.auth.updateUser({
          data: {
            role,
            ...(role === "student"
              ? {
                  student_id:
                    pendingStudentId || existingStudentId || emailStudentId,
                }
              : {}),
          },
        });
        if (metadataError) {
          if (active) {
            setAuthMessage(metadataError.message);
            setAuthenticating(false);
          }
          return;
        }
        sessionStorage.removeItem("edurecover-pending-student-id");
        // One sign-in at a time: a stale demo role or code session would
        // otherwise be sent alongside this account's token.
        sessionStorage.removeItem("edurecover-demo-role");
        clearOtpSession();
        onContinue(role);
      }
    });
    return () => {
      active = false;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [onContinue, selectedRole]);

  const requestCode = async (role: UserRole, registration: string) => {
    const { expires_in } = await api.requestOtp(registration, role);
    setOtpSent(true);
    setAuthMessage(
      `A 6-digit code was generated. Find it in the backend terminal and enter it below. It expires in ${Math.max(1, Math.round(expires_in / 60))} minutes.`,
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole) {
      setAuthMessage("Select a workspace role before signing in.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const registration = registrationNumber.trim().toUpperCase();
    const otp = String(form.get("otp") || "").trim();
    if (!registration) {
      setAuthMessage("Enter your registration number.");
      return;
    }
    setAuthenticating(true);
    setAuthMessage("");
    try {
      if (!otpSent) {
        await requestCode(selectedRole, registration);
      } else {
        if (!/^\d{6}$/.test(otp)) {
          throw new Error("Enter the 6-digit code from the backend terminal.");
        }
        const session = await api.verifyOtp(registration, selectedRole, otp);
        // A code sign-in replaces any GitHub or Microsoft 365 session.
        const { data } = await supabaseAuth.auth.getSession();
        if (data.session) await supabaseAuth.auth.signOut();
        saveOtpSession({
          token: session.access_token,
          role: session.role,
          registrationNumber: session.registration_number,
          studentId: session.student_id,
          expiresAt: session.expires_at,
        });
        sessionStorage.removeItem("edurecover-demo-role");
        sessionStorage.setItem("edurecover-role", session.role);
        sessionStorage.removeItem("edurecover-pending-role");
        onContinue(session.role);
      }
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify the code. Please try again.",
      );
    } finally {
      setAuthenticating(false);
    }
  };

  const handleResend = async () => {
    const registration = registrationNumber.trim().toUpperCase();
    if (!selectedRole || !registration) return;
    setAuthenticating(true);
    setAuthMessage("");
    try {
      await requestCode(selectedRole, registration);
    } catch (error) {
      setAuthMessage(
        error instanceof Error ? error.message : "Unable to send a new code.",
      );
    } finally {
      setAuthenticating(false);
    }
  };

  const resetCode = () => {
    setOtpSent(false);
    setAuthMessage("");
  };

  const handleOAuthLogin = async (provider: "github" | "azure") => {
    if (!selectedRole) {
      setAuthMessage("Select a workspace role before signing in.");
      return;
    }
    setAuthenticating(true);
    setAuthMessage("");
    sessionStorage.setItem("edurecover-pending-role", selectedRole);
    if (selectedRole === "student" && registrationNumber.trim()) {
      sessionStorage.setItem(
        "edurecover-pending-student-id",
        registrationNumber.trim().toUpperCase(),
      );
    }
    const siteUrl =
      import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;
    try {
      const { error } = await supabaseAuth.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${siteUrl}/auth` },
      });
      if (error) throw error;
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? error.message
          : "Login revoked or cancelled by the user. You can try again.",
      );
      setAuthenticating(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setOtpSent(false);
    setRegistrationNumber("");
    setAuthMessage("");
  };

  const handleDemoLogin = () => {
    if (!selectedRole) {
      setAuthMessage("Select a role before using demo login.");
      return;
    }
    clearOtpSession();
    sessionStorage.setItem("edurecover-demo-role", selectedRole);
    sessionStorage.setItem("edurecover-role", selectedRole);
    sessionStorage.removeItem("edurecover-pending-role");
    onContinue(selectedRole);
  };

  return (
    <main className="auth-page">
      <div className="auth-atmosphere auth-atmosphere-one" />
      <div className="auth-atmosphere auth-atmosphere-two" />
      <header className="auth-nav">
        <button className="auth-back" onClick={onBack}>
          <ArrowLeft size={16} /> <span>Back to home</span>
        </button>
        <a className="brand" href="/" aria-label="EduRecover home">
          <Brand />
        </a>
        <span className="auth-nav-spacer" aria-hidden="true" />
      </header>

      <section className="auth-layout" id="auth-top">
        <div className="auth-story">
          <span className="auth-label">
            <Activity size={14} /> One platform. Every academic signal.
          </span>
          <h1>
            Your academic journey, <em>understood.</em>
          </h1>
          <p>
            Sign in to see the signal that matters to you, understand what it
            means, and take the next right action.
          </p>
          <div className="auth-proof-list">
            <div>
              <span>
                <Check size={14} />
              </span>
              <p>
                <strong>Context, not just alerts</strong>
                <small>Every recommendation comes with evidence.</small>
              </p>
            </div>
            <div>
              <span>
                <Check size={14} />
              </span>
              <p>
                <strong>People stay in control</strong>
                <small>Consequential decisions always require review.</small>
              </p>
            </div>
            <div>
              <span>
                <Check size={14} />
              </span>
              <p>
                <strong>One shared academic picture</strong>
                <small>Connect students, mentors, departments and cells.</small>
              </p>
            </div>
          </div>
          <div className="auth-campus-card">
            <div className="auth-campus-sky" />
            <div className="auth-campus-building">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="auth-campus-copy">
              <span>EduRecover platform</span>
              <strong>Detect earlier. Act together.</strong>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-heading">
            <span className="auth-kicker">Secure sign in</span>
            <h2>Continue where you left off.</h2>
            <p>
              Enter your registration number and we'll generate a one-time code
              to confirm it's you.
            </p>
          </div>
          {!selectedRole && (
            <p className="auth-role-prompt" role="status">
              <span className="auth-role-prompt-icon">
                <Info size={15} aria-hidden="true" />
              </span>
              <span className="auth-role-prompt-copy">
                <strong>Workspace selection required</strong>
                <small>Choose a role to continue to login.</small>
              </span>
            </p>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>
                {selectedRole
                  ? `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Registration Number`
                  : "Select a workspace role first"}
              </span>
              <div className="auth-input">
                <UserRound size={17} />
                <input
                  required
                  name="registrationNumber"
                  value={registrationNumber}
                  readOnly={otpSent}
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  onChange={(event) =>
                    setRegistrationNumber(event.target.value)
                  }
                  placeholder="Enter your registration number"
                />
              </div>
            </label>
            {otpSent && (
              <label>
                <span>One-time code</span>
                <div className="auth-input">
                  <LockKeyhole size={17} />
                  <input
                    required
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="Enter the 6-digit code"
                  />
                </div>
              </label>
            )}
            <button
              className="auth-submit"
              type="submit"
              disabled={authenticating || !selectedRole}
            >
              {authenticating
                ? "Connecting..."
                : otpSent
                  ? "Verify code"
                  : "Get OTP"}
              <ArrowRight size={17} />
            </button>
            {otpSent && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="min-h-[36px] px-1 font-semibold text-indigo-600 hover:underline disabled:opacity-50"
                  onClick={() => void handleResend()}
                  disabled={authenticating}
                >
                  Resend code
                </button>
                <button
                  type="button"
                  className="min-h-[36px] px-1 font-semibold text-slate-600 hover:underline disabled:opacity-50"
                  onClick={resetCode}
                  disabled={authenticating}
                >
                  Use a different number
                </button>
              </div>
            )}
          </form>
          {authMessage && (
            <p className="auth-feedback" role="status">
              {authMessage}
            </p>
          )}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <div className="auth-providers">
            <button
              type="button"
              onClick={() => void handleOAuthLogin("github")}
              disabled={authenticating || !selectedRole}
              title={`Use your @${ALLOWED_EMAIL_DOMAIN} GitHub account`}
            >
              <Code2 size={16} aria-hidden="true" />
              <span>GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => void handleOAuthLogin("azure")}
              disabled={authenticating || !selectedRole}
              title={`Use your @${ALLOWED_EMAIL_DOMAIN} Microsoft 365 account`}
            >
              <span className="provider-microsoft" aria-hidden="true">
                M
              </span>
              <span>Microsoft 365</span>
            </button>
          </div>
          <p className="auth-note">
            GitHub and Microsoft 365 sign-in is limited to @
            {ALLOWED_EMAIL_DOMAIN} accounts.
          </p>
          <div className="demo-heading">
            <div>
              <span>Workspace role</span>
              <small>Select the dashboard to open after authentication</small>
            </div>
          </div>
          <div className="role-selector">
            {userRoles.map((role) => {
              const Icon = roleIcons[role.icon];
              return (
                <button
                  type="button"
                  key={role.id}
                  className={selectedRole === role.id ? "selected" : ""}
                  onClick={() => handleRoleChange(role.id)}
                >
                  <span className="role-selector-icon">
                    <Icon size={17} />
                  </span>
                  <span>
                    <strong>{role.label}</strong>
                    <small>{role.detail}</small>
                  </span>
                  {selectedRole === role.id && (
                    <Check className="role-selected" size={15} />
                  )}
                </button>
              );
            })}
          </div>
          <button
            className="demo-submit"
            type="button"
            onClick={handleDemoLogin}
            disabled={authenticating || !selectedRole}
          >
            {selectedRole
              ? `Demo login as ${selectedRole.toUpperCase()}`
              : "Select a role for demo login"}
          </button>
          <p className="auth-note">
            By continuing, you agree to EduRecover's responsible practice and
            human oversight principles.
          </p>
        </div>
      </section>
    </main>
  );
}
