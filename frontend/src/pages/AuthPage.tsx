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
    supabaseAuth.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
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
    setAuthenticating(true);
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const result =
      mode === "signin"
        ? await supabaseAuth.auth.signInWithPassword({ email, password })
        : await supabaseAuth.auth.signUp({ email, password });
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
    sessionStorage.setItem("edurecover-role", selectedRole);
    sessionStorage.removeItem("edurecover-pending-role");
    onContinue(selectedRole);
    setAuthenticating(false);
  };

  const handleGitHubLogin = async () => {
    setAuthenticating(true);
    setAuthMessage("");
    sessionStorage.setItem("edurecover-pending-role", selectedRole);
    // Use VITE_SITE_URL when set (allows dev vs prod separation).
    // In dev: set VITE_SITE_URL=http://localhost:5174 in .env.development
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
            By continuing, you agree to EduRecover's responsible AI and human
            oversight principles.
          </p>
        </div>
      </section>
    </main>
  );
}
