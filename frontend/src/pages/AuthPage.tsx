import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { supabaseAuth } from "../supabaseClient";
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

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabaseAuth.auth.getSession();
      if (!active || !data.session) return;

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
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const studentId = String(form.get("student_id") || "")
      .trim()
      .toUpperCase();

    // A student account is useless without the record it points at, so the
    // link is required up front rather than discovered as an empty dashboard.
    if (mode === "signup" && selectedRole === "student" && !studentId) {
      setAuthMessage("Enter the student ID this account belongs to.");
      return;
    }

    setAuthenticating(true);
    setAuthMessage("");
    const result =
      mode === "signin"
        ? await supabaseAuth.auth.signInWithPassword({ email, password })
        : await supabaseAuth.auth.signUp({
            email,
            password,
            // The role travels with the account, so the API can authorize it.
            options: {
              data: {
                role: selectedRole,
                ...(selectedRole === "student"
                  ? { student_id: studentId }
                  : {}),
              },
            },
          });
    if (result.error) {
      setAuthMessage(result.error.message);
      setAuthenticating(false);
      return;
    }
    if (!result.data.session) {
      setAuthMessage(
        "Check your email to confirm your account before signing in.",
      );
      setAuthenticating(false);
      return;
    }

    // Trust the role stored on the account, never the picker — the picker is
    // only a signup-time choice, and sessionStorage is user-editable.
    const accountRole = result.data.user?.user_metadata?.role as
      | UserRole
      | undefined;
    const effectiveRole =
      accountRole && userRoles.some((role) => role.id === accountRole)
        ? accountRole
        : selectedRole;

    if (mode === "signin" && accountRole && accountRole !== selectedRole) {
      setAuthMessage(
        `This account is registered as ${
          userRoles.find((role) => role.id === accountRole)?.label ??
          accountRole
        }. Opening that workspace.`,
      );
    }

    // Accounts created before roles existed carry no claim, so the API would
    // refuse them. Adopt the selected role once, then refresh so the new claim
    // is in the token the very next request uses.
    if (!accountRole) {
      const { error: claimError } = await supabaseAuth.auth.updateUser({
        data: {
          role: effectiveRole,
          ...(effectiveRole === "student" && studentId
            ? { student_id: studentId }
            : {}),
        },
      });
      if (claimError) {
        setAuthMessage(
          `Signed in, but the account role could not be saved: ${claimError.message}`,
        );
        setAuthenticating(false);
        return;
      }
      await supabaseAuth.auth.refreshSession();
    }

    sessionStorage.setItem("edurecover-role", effectiveRole);
    sessionStorage.removeItem("edurecover-pending-role");
    onContinue(effectiveRole);
    setAuthenticating(false);
  };

  const handleGitHubLogin = async () => {
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
      provider: "github",
      options: { redirectTo: `${siteUrl}/auth` },
    });
    if (error) {
      setAuthMessage(error.message);
      setAuthenticating(false);
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
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
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
          <form className="auth-form" onSubmit={handleSubmit}>
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
            {selectedRole === "student" && (
              <label>
                <span>
                  Your student ID
                  {mode === "signin" && (
                    <small> — only needed if not already linked</small>
                  )}
                </span>
                <div className="auth-input">
                  <UserRound size={17} />
                  <input
                    required={mode === "signup"}
                    name="student_id"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. STU002"
                  />
                </div>
              </label>
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
              onClick={() => void handleGitHubLogin()}
              disabled={authenticating}
            >
              <span className="provider-github">GH</span> GitHub
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
                  onClick={() => setSelectedRole(role.id)}
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
