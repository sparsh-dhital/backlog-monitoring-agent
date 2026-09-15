import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Lenis from "lenis";
import { userRoles, type UserRole } from "./types/roles";
import { supabaseAuth } from "./supabaseClient";
import ThemeToggle from "./components/ThemeToggle";
import "./App.css";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PrototypePage = lazy(() => import("./pages/PrototypePage"));

const roleIds = new Set<UserRole>(userRoles.map((role) => role.id));

function clearLocalSession() {
  sessionStorage.removeItem("edurecover-role");
  sessionStorage.removeItem("edurecover-pending-role");
  sessionStorage.removeItem("edurecover-demo-role");
  sessionStorage.removeItem("edurecover-focus-student");
}

function SmoothScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== "/") return;
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
  }, [pathname]);

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

function SiteThemeToggle() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname.startsWith("/dashboard/")) return null;
  return (
    <ThemeToggle
      floating
      className={`theme-toggle-floating${pathname === "/auth" ? " theme-toggle-auth" : ""}`}
    />
  );
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
  const demoRole = sessionStorage.getItem("edurecover-demo-role");

  useEffect(() => {
    let active = true;
    supabaseAuth.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session && demoRole !== role) {
        clearLocalSession();
        navigate(`/auth?requiredRole=${role || "hod"}`, { replace: true });
        return;
      }
      setSessionChecked(true);
    });
    return () => {
      active = false;
    };
  }, [demoRole, navigate, role]);

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
  // ThemeProvider wraps the app in main.tsx; the loader shows only while a
  // route chunk is actually loading.
  return (
    <>
      <SmoothScroll />
      <SiteThemeToggle />
      <Suspense fallback={<SiteLoader />}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/prototype" element={<PrototypeRoute />} />
          <Route path="/dashboard/:role" element={<ProtectedDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
