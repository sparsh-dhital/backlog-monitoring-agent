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
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [registrationPhone, setRegistrationPhone] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const isAllowedInstitutionEmail = (email: string) =>
    email.trim().toLowerCase().endsWith("@vignan.ac.in");

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
      window.history.replaceState({}, document.title, window.location.pathname);
    }

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
            "Login is restricted to @vignan.ac.in accounts for GitHub and Microsoft 365.",
          );
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
        onContinue(role);
      }
    });
    return () => {
      active = false;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [onContinue, selectedRole]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole) {
      setAuthMessage("Select a workspace role before signing in.");
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
          selectedRole,
        );
        const { error } = await supabaseAuth.auth.signInWithOtp({
          phone,
          options: { channel: "sms" },
        });
        if (error) throw error;
        setRegistrationPhone(phone);
        setOtpSent(true);
        setAuthMessage("OTP sent to your registered mobile number.");
      } else {
        const { data, error } = await supabaseAuth.auth.verifyOtp({
          phone: registrationPhone,
          token: otp,
          type: "sms",
        });
        if (error) throw error;
        if (!data.session)
          throw new Error("Verification did not create a session.");
        const { error: metadataError } = await supabaseAuth.auth.updateUser({
          data: {
            role: selectedRole,
            ...(selectedRole === "student"
              ? { student_id: registrationNumber }
              : {}),
          },
        });
        if (metadataError) throw metadataError;
        sessionStorage.removeItem("edurecover-demo-role");
        sessionStorage.setItem("edurecover-role", selectedRole);
        sessionStorage.removeItem("edurecover-pending-role");
        onContinue(selectedRole);
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
    const siteUrl = window.location.origin;
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
    setRegistrationPhone("");
    setRegistrationNumber("");
    setAuthMessage("");
  };

  const handleDemoLogin = () => {
    if (!selectedRole) {
      setAuthMessage("Select a workspace role before using demo login.");
      return;
    }
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
              Enter your registration number and get an OTP sent to your
              registered mobile number.
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
                  onChange={(event) =>
                    setRegistrationNumber(event.target.value)
                  }
                  placeholder="Enter your registration number"
                />
              </div>
            </label>
            {otpSent && (
              <label>
                <span>OTP verification code</span>
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
            <button
              className="auth-submit"
              type="submit"
              disabled={authenticating || !selectedRole}
            >
              {authenticating
                ? "Connecting..."
                : otpSent
                  ? "Verify OTP"
                  : "Get OTP"}
              <ArrowRight size={17} />
            </button>
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
              title="Use your @vignan.ac.in GitHub account"
            >
              <Code2 size={16} aria-hidden="true" />
              <span>GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => void handleOAuthLogin("azure")}
              disabled={authenticating || !selectedRole}
              title="Use your @vignan.ac.in Microsoft 365 account"
            >
              <span className="provider-microsoft" aria-hidden="true">
                M
              </span>
              <span>Microsoft 365</span>
            </button>
          </div>
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
