import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  Code2,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { supabaseAuth } from "../supabaseClient";
import { api } from "../api";
import { isDevAuthAvailable, setDevSession } from "../devAuth";
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

export default function AuthPage({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: (role: UserRole) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>("hod");
  const [authMessage, setAuthMessage] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"account" | "registration">(
    "account",
  );
  const [registrationPhone, setRegistrationPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devRole, setDevRole] = useState<UserRole>("student");
  const [devStudentId, setDevStudentId] = useState("STU002");

  /** Dev-only: skip Supabase entirely and open the chosen role's dashboard. */
  const handleDevLogin = () => {
    if (!isDevAuthAvailable()) return;
    const studentId = devStudentId.trim().toUpperCase();
    if (devRole === "student" && !studentId) {
      setAuthMessage("Enter a student ID that exists in the backlogs table.");
      return;
    }
    setDevSession({ role: devRole, studentId });
    sessionStorage.setItem("edurecover-role", devRole);
    sessionStorage.removeItem("edurecover-pending-role");
    onContinue(devRole);
  };

  const registrationRole =
    selectedRole === "student" || selectedRole === "mentor"
      ? selectedRole
      : null;
  const isAllowedInstitutionEmail = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    return normalizedEmail.endsWith("@vignan.ac.in");
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabaseAuth.auth.getSession();
      if (!active || !data.session) return;

      // Domain constraint runs before anything else: an account outside the
      // institution is signed straight back out.
      const provider = data.session.user.app_metadata?.provider;
      const isInstitutionOAuth = provider === "github" || provider === "azure";
      if (
        isInstitutionOAuth &&
        !isAllowedInstitutionEmail(data.session.user.email || "")
      ) {
        await supabaseAuth.auth.signOut();
        if (active) {
          setAuthMessage(
            "Login is restricted to @vignan.ac.in accounts. Use your Vignan Microsoft 365 or GitHub account.",
          );
          setAuthenticating(false);
        }
        return;
      }

      const savedRole = sessionStorage.getItem(
        "edurecover-pending-role",
      ) as UserRole | null;
      const existingRole = data.session.user.user_metadata?.role as
        | UserRole
        | undefined;

      // OAuth sign-in carries no metadata, so an account returning from the
      // provider would have no role and be refused by every API route.
      // Stamp the role it signed up with the first time it lands here.
      let effectiveRole =
        existingRole && userRoles.some((role) => role.id === existingRole)
          ? existingRole
          : savedRole && userRoles.some((role) => role.id === savedRole)
            ? savedRole
            : selectedRole;

      if (!existingRole) {
        const { error } = await supabaseAuth.auth.updateUser({
          data: { role: effectiveRole },
        });
        if (error) {
          if (!active) return;
          setAuthMessage(
            `Signed in, but the account role could not be saved: ${error.message}`,
          );
          return;
        }
        // Refresh the token so the new claim reaches the API immediately.
        await supabaseAuth.auth.refreshSession();
      }

      if (!active) return;
      if (effectiveRole === "student") {
        const { data: refreshed } = await supabaseAuth.auth.getUser();
        if (!refreshed.user?.user_metadata?.student_id) {
          setAuthMessage(
            "This account has no student ID linked. Ask an administrator to set one, or sign up with a student ID.",
          );
          effectiveRole = "student";
        }
      }

      sessionStorage.setItem("edurecover-role", effectiveRole);
      sessionStorage.removeItem("edurecover-pending-role");
      onContinue(effectiveRole);
    })();
    return () => {
      active = false;
    };
  }, [onContinue, selectedRole]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginMethod === "registration") {
      if (!registrationRole) {
        setAuthMessage(
          "Registration login is available for students and teachers only.",
        );
        return;
      }
      const form = new FormData(event.currentTarget);
      const registrationNumber = String(
        form.get("registrationNumber") || "",
      ).trim();
      const otp = String(form.get("otp") || "").trim();
      setAuthenticating(true);
      setAuthMessage("");
      try {
        if (!otpSent) {
          const { phone } = await api.registrationPhone(
            registrationNumber,
            registrationRole,
          );
          const { error } = await supabaseAuth.auth.signInWithOtp({
            phone,
            options: { channel: "sms" },
          });
          if (error) throw error;
          setRegistrationPhone(phone);
          setOtpSent(true);
          setAuthMessage(
            "A verification code was sent to your registered phone.",
          );
        } else {
          const { data, error } = await supabaseAuth.auth.verifyOtp({
            phone: registrationPhone,
            token: otp,
            type: "sms",
          });
          if (error) throw error;
          if (!data.session)
            throw new Error("Verification did not create a session.");

          // Carry the role on the account so the API can authorize it, and
          // for a student use the registration number as the record link.
          if (!data.session.user.user_metadata?.role) {
            const { error: claimError } = await supabaseAuth.auth.updateUser({
              data: {
                role: registrationRole,
                ...(registrationRole === "student"
                  ? { student_id: registrationNumber.toUpperCase() }
                  : {}),
              },
            });
            if (claimError) throw claimError;
            // Refresh so the new claim is in the very next request's token.
            await supabaseAuth.auth.refreshSession();
          }

          sessionStorage.setItem("edurecover-role", registrationRole);
          sessionStorage.removeItem("edurecover-pending-role");
          onContinue(registrationRole);
        }
      } catch (error) {
        setAuthMessage(
          error instanceof Error
            ? error.message
            : "Unable to send the verification code.",
        );
      } finally {
        setAuthenticating(false);
      }
      return;
    }
    setAuthenticating(true);
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    if (!isAllowedInstitutionEmail(email)) {
      setAuthMessage(
        "Login is restricted to @vignan.ac.in accounts. Use your Vignan Microsoft 365 or GitHub account.",
      );
      setAuthenticating(false);
      return;
    }
    setAuthMessage(
      "Vignan accounts must continue with Microsoft 365 or GitHub login.",
    );
    setAuthenticating(false);
  };

  const handleOAuthLogin = async (provider: "github" | "azure") => {
    setAuthenticating(true);
    setAuthMessage("");
    sessionStorage.setItem("edurecover-pending-role", selectedRole);
    // Use VITE_SITE_URL when set (allows dev vs prod separation).
    // In dev: set VITE_SITE_URL=http://localhost:5173 in .env.development
    // In prod: set VITE_SITE_URL=https://your-domain.com in .env.production
    // Also add both URLs to Supabase Dashboard → Auth → URL Configuration → Redirect URLs
    const siteUrl =
      import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;
    const { error } = await supabaseAuth.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl}/auth` },
    });
    if (error) {
      setAuthMessage(error.message);
      setAuthenticating(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role !== "student" && role !== "mentor") {
      setLoginMethod("account");
      setOtpSent(false);
    }
  };

  const handlePasswordRecovery = async () => {
    const email = window.prompt("Enter your account email");
    if (!email?.trim()) return;
    setAuthenticating(true);
    setAuthMessage("");
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/auth` },
    );
    setAuthMessage(
      error
        ? error.message
        : "Password reset instructions have been sent to your email.",
    );
    setAuthenticating(false);
  };

  return (
    <main className="auth-page">
      <div className="auth-atmosphere auth-atmosphere-one" />
      <div className="auth-atmosphere auth-atmosphere-two" />
      <header className="auth-nav">
        <button className="auth-back" onClick={onBack}>
          <ArrowLeft size={17} /> Back to website
        </button>
        <a className="brand" href="#auth-top">
          <Brand />
        </a>
        <span className="auth-secure">
          <ShieldCheck size={15} /> Secure institution access
        </span>
      </header>

      <section className="auth-layout" id="auth-top">
        <div className="auth-story">
          <span className="auth-label">
            <Sparkles size={14} /> One platform. Every academic signal.
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
          <div className="auth-tabs">
            <button
              className={mode === "signin" ? "active" : ""}
              onClick={() => {
                setMode("signin");
                setLoginMethod("account");
                setOtpSent(false);
                setAuthMessage("");
              }}
            >
              Sign in
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setLoginMethod("account");
                setOtpSent(false);
                setAuthMessage("");
              }}
            >
              Sign up
            </button>
          </div>
          <div className="auth-heading">
            <span className="auth-kicker">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </span>
            <h2>
              {mode === "signin"
                ? "Continue where you left off."
                : "Bring your institution together."}
            </h2>
            <p>
              {mode === "signin"
                ? "Use your institutional credentials to access your workspace."
                : "Start with your institutional email. You can invite your team later."}
            </p>
          </div>
          {mode === "signin" && (
            <div
              className="auth-login-methods"
              role="tablist"
              aria-label="Login method"
            >
              <button
                type="button"
                className={loginMethod === "account" ? "active" : ""}
                onClick={() => {
                  setLoginMethod("account");
                  setOtpSent(false);
                  setAuthMessage("");
                }}
              >
                Email and password
              </button>
              <button
                type="button"
                className={loginMethod === "registration" ? "active" : ""}
                onClick={() => {
                  setLoginMethod("registration");
                  setAuthMessage("");
                }}
                disabled={!registrationRole}
              >
                Student / teacher SMS
              </button>
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            {loginMethod === "registration" && mode === "signin" ? (
              <>
                <label>
                  <span>
                    {selectedRole === "mentor" ? "Teacher" : "Student"}{" "}
                    registration number
                  </span>
                  <div className="auth-input">
                    <UserRound size={17} />
                    <input
                      required
                      name="registrationNumber"
                      placeholder="Enter your registration number"
                    />
                  </div>
                </label>
                {otpSent && (
                  <label>
                    <span>SMS verification code</span>
                    <div className="auth-input">
                      <LockKeyhole size={17} />
                      <input
                        required
                        name="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter the 6-digit code"
                      />
                    </div>
                  </label>
                )}
              </>
            ) : (
              <>
                <label>
                  <span>Institutional email or ID</span>
                  <div className="auth-input">
                    <Mail size={17} />
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="you@university.edu"
                    />
                  </div>
                </label>
                <label>
                  <span>Password</span>
                  <div className="auth-input">
                    <LockKeyhole size={17} />
                    <input
                      required
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                    />
                  </div>
                </label>
              </>
            )}
            <div className="auth-form-meta">
              <label className="remember">
                <input type="checkbox" /> <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => void handlePasswordRecovery()}
                disabled={authenticating}
              >
                Forgot password?
              </button>
            </div>
            <button
              className="auth-submit"
              type="submit"
              disabled={authenticating}
            >
              {authenticating
                ? "Connecting..."
                : mode === "signin" && loginMethod === "registration"
                  ? otpSent
                    ? "Verify SMS code"
                    : "Send SMS code"
                  : mode === "signin"
                    ? "Sign in to workspace"
                    : "Create account"}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <div className="auth-providers">
            <button
              type="button"
              onClick={() => void handleOAuthLogin("github")}
              disabled={authenticating}
              title="Only @vignan.ac.in accounts can use GitHub login"
            >
              <Code2 size={16} aria-hidden="true" />
              <span>GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => void handleOAuthLogin("azure")}
              disabled={authenticating}
              title="Only @vignan.ac.in accounts can use Microsoft 365 login"
            >
              <span className="provider-microsoft" aria-hidden="true">
                M
              </span>
              <span>Microsoft 365</span>
            </button>
          </div>
          {import.meta.env.DEV && isDevAuthAvailable() && (
            <div className="auth-devbox">
              <p className="auth-devbox-title">
                <ShieldCheck size={14} aria-hidden="true" />
                Local development test login
              </p>
              <p className="auth-devbox-note">
                Institutional sign-in needs an @vignan.ac.in account or the
                missing <code>profiles</code> table, so neither works here. This
                shortcut exists only under <code>npm run dev</code> and only
                while <code>ALLOW_DEV_AUTH_BYPASS=true</code> is set in
                <code> backend/.env</code>. It is absent from production builds.
              </p>
              <div className="auth-devbox-row">
                <select
                  value={devRole}
                  onChange={(event) =>
                    setDevRole(event.target.value as UserRole)
                  }
                  aria-label="Test login role"
                >
                  {userRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {devRole === "student" && (
                  <input
                    value={devStudentId}
                    onChange={(event) => setDevStudentId(event.target.value)}
                    placeholder="Student ID (e.g. STU002)"
                    aria-label="Test login student ID"
                  />
                )}
                <button type="button" onClick={handleDevLogin}>
                  Open dashboard
                </button>
              </div>
            </div>
          )}
          {authMessage && (
            <p className="auth-feedback" role="status">
              {authMessage}
            </p>
          )}
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
          <p className="auth-note">
            By continuing, you agree to EduRecover's responsible practice and
            human oversight principles.
          </p>
        </div>
      </section>
    </main>
  );
}
