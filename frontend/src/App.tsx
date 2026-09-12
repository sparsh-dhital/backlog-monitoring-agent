import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrototypePage from "./pages/PrototypePage";
import { userRoles, type UserRole } from "./types/roles";
import { supabaseAuth } from "./supabaseClient";
import "./App.css";

const roleIds = new Set<UserRole>(userRoles.map((role) => role.id));

function clearLocalSession() {
  sessionStorage.removeItem("edurecover-role");
  sessionStorage.removeItem("edurecover-pending-role");
  sessionStorage.removeItem("edurecover-focus-student");
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
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="/prototype" element={<PrototypeRoute />} />
      <Route path="/dashboard/:role" element={<ProtectedDashboard />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
