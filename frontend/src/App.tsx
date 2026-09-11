import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrototypePage from "./pages/PrototypePage";
import { userRoles, type UserRole } from "./types/roles";
import "./App.css";

const roleIds = new Set<UserRole>(userRoles.map((role) => role.id));

function AuthRoute() {
  const navigate = useNavigate();
  return (
    <AuthPage
      onBack={() => navigate("/")}
      onContinue={(role) => {
        sessionStorage.setItem("edurecover-role", role);
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
  return <PrototypePage role="hod" onBack={() => navigate("/")} />;
}

function ProtectedDashboard() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const sessionRole = sessionStorage.getItem(
    "edurecover-role",
  ) as UserRole | null;

  if (!role || !roleIds.has(role as UserRole)) return <NotFoundPage />;
  if (sessionRole !== role)
    return <Navigate replace to={`/auth?requiredRole=${role}`} />;
  return <PrototypePage role={role as UserRole} onBack={() => navigate("/")} />;
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
