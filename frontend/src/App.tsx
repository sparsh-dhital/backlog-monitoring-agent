import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Lenis from "lenis";
import { Moon, Sun } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrototypePage from "./pages/PrototypePage";
import { userRoles, type UserRole } from "./types/roles";
import { supabaseAuth } from "./supabaseClient";
import { ThemeProvider } from "./theme";
import { useTheme } from "./theme-context";
import "./App.css";

const roleIds = new Set<UserRole>(userRoles.map((role) => role.id));

function clearLocalSession() {
  sessionStorage.removeItem("edurecover-role");
  sessionStorage.removeItem("edurecover-pending-role");
  sessionStorage.removeItem("edurecover-focus-student");
}

function SmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      allowNestedScroll: true,
      lerp: 0.075,
      smoothWheel: true,
      syncTouch: false,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}

function SiteLoader() {
  return (
    <div className="site-loader" role="status" aria-label="Loading EduRecover">
      <div className="site-loader-glow site-loader-glow-one" />
      <div className="site-loader-glow site-loader-glow-two" />
      <div className="site-loader-mark">
        <span />
        <span />
        <span />
      </div>
      <div className="site-loader-copy">
        <strong>EduRecover</strong>
        <span>Preparing your academic signal</span>
      </div>
      <div className="site-loader-line" aria-hidden="true">
        <i />
      </div>
    </div>
  );
}

function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={
        floating ? "theme-toggle theme-toggle-floating" : "theme-toggle"
      }
    >
      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      <span>{darkMode ? "Light" : "Dark"}</span>
    </button>
  );
}

function SiteThemeToggle() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname.startsWith("/dashboard/")) return null;
  return <ThemeToggle floating />;
}

function AuthRoute() {
  const navigate = useNavigate();
  return (
    <AuthPage
      onBack={() => navigate("/")}
      onContinue={(role) => {
        sessionStorage.setItem("edurecover-role", role);
        sessionStorage.removeItem("edurecover-pending-role");
        navigate(`/dashboard/${role}`);
      }}
    />
  );
}

function LandingRoute() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onEnter={() => navigate("/auth")}
      onPrototype={() => navigate("/prototype")}
    />
  );
}

function PrototypeRoute() {
  const navigate = useNavigate();
  return <PrototypePage mode="prototype" onBack={() => navigate("/")} />;
}

function ProtectedDashboard() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const sessionRole = sessionStorage.getItem(
    "edurecover-role",
  ) as UserRole | null;

  useEffect(() => {
    let active = true;
    supabaseAuth.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        clearLocalSession();
        navigate(`/auth?requiredRole=${role || "hod"}`, { replace: true });
        return;
      }
      setSessionChecked(true);
    });
    return () => {
      active = false;
    };
  }, [navigate, role]);

  if (!role || !roleIds.has(role as UserRole)) return <NotFoundPage />;
  if (sessionRole !== role)
    return <Navigate replace to={`/auth?requiredRole=${role}`} />;
  if (!sessionChecked) return null;

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut();
    clearLocalSession();
    navigate("/auth", { replace: true });
  };

  return (
    <PrototypePage
      mode="dashboard"
      role={role as UserRole}
      onBack={() => void handleLogout()}
      onSwitchRole={(nextRole) => {
        sessionStorage.setItem("edurecover-role", nextRole);
        navigate(`/dashboard/${nextRole}`);
      }}
    />
  );
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 760);
    return () => window.clearTimeout(timer);
  }, []);

  if (isBooting) return <SiteLoader />;

  return (
    <ThemeProvider>
      <SmoothScroll />
      <SiteThemeToggle />
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/prototype" element={<PrototypeRoute />} />
        <Route path="/dashboard/:role" element={<ProtectedDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
