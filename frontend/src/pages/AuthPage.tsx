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
  Activity,
  UserRound,
  UsersRound,
} from "lucide-react";
import { supabaseAuth } from "../supabaseClient";
import { api } from "../api";
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
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
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
      onContinue(
        savedRole && userRoles.some((role) => role.id === savedRole)
          ? savedRole
          : selectedRole,
      );
    });
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
