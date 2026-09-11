import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue(selectedRole);
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
                <input required type="text" placeholder="you@university.edu" />
              </div>
            </label>
            <label>
              <span>Password</span>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input
                  required
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
                onClick={() =>
                  setAuthMessage(
                    "Password recovery will be handled by your institution administrator.",
                  )
                }
              >
                Forgot password?
              </button>
            </div>
            <button className="auth-submit" type="submit">
              {mode === "signin" ? "Sign in to workspace" : "Create account"}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <div className="auth-providers">
            <button
              type="button"
              onClick={() =>
                setAuthMessage(
                  "Google sign-in is available in the institution deployment.",
                )
              }
            >
              <span className="provider-google">G</span> Google
            </button>
            <button
              type="button"
              onClick={() =>
                setAuthMessage(
                  "Microsoft sign-in is available in the institution deployment.",
                )
              }
            >
              <span className="provider-ms">▦</span> Microsoft
            </button>
          </div>
          {authMessage && (
            <p className="auth-feedback" role="status">
              {authMessage}
            </p>
          )}
          <div className="demo-heading">
            <div>
              <span>Demo mode</span>
              <small>Choose a role to explore the product</small>
            </div>
            <GraduationCap size={20} />
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
          <button
            className="demo-submit"
            type="button"
            onClick={() => onContinue(selectedRole)}
          >
            Enter {userRoles.find((role) => role.id === selectedRole)?.label}{" "}
            demo
            <ArrowRight size={16} />
          </button>
          <p className="auth-note">
            By continuing, you agree to EduRecover's responsible AI and human
            oversight principles.
          </p>
        </div>
      </section>
    </main>
  );
}
