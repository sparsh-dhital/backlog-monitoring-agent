import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  CircleUserRound,
  ClipboardCheck,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Gauge,
  Home,
  LineChart,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Settings,
  Sparkles,
  Users,
  UsersRound,
  X,
  UploadCloud,
} from "lucide-react";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import Brand from "./components/Brand";
import type {
  ActivityEvent,
  DashboardData,
  OrchestrationData,
} from "./types/agent";
import { userRoles, type UserRole } from "./types/roles";
import { api } from "./api";
import { StatCard, StatusBadge } from "./components/WorkspacePrimitives";
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

// ----------------------------------------------------
// Core Dashboard/Prototype Components
// ----------------------------------------------------

const dashboardByRole = {
  student: {
    title: "My Academic Recovery",
    greeting: "Good morning, Rahul.",
    description:
      "Here is what needs your attention, and the next step that keeps your degree on track.",
    metrics: [
      ["Active backlogs", "3", "Across two semesters"],
      ["Attempts remaining", "2", "Regulation checked"],
      ["At risk", "1", "Needs a decision"],
      ["Recovery progress", "78%", "Up 12% this term"],
    ],
  },
  mentor: {
    title: "My Students",
    greeting: "Good morning, mentor.",
    description:
      "A focused queue of students who need a conversation, an intervention, or a little more context.",
    metrics: [
      ["Students", "42", "Your current group"],
      ["Need attention", "8", "Priority queue"],
      ["Repeated failures", "5", "Patterns detected"],
      ["Backlogs cleared", "12", "This term"],
    ],
  },
  hod: {
    title: "Academic Command Center",
    greeting: "Good morning, HOD.",
    description:
      "See the department-wide picture, then open the cases behind the trend before they become harder to recover.",
    metrics: [
      ["Active backlogs", "214", "12% less last term"],
      ["Students affected", "87", "8% less last term"],
      ["Duration risk", "13", "Needs attention"],
      ["Critical cases", "9", "Review required"],
    ],
  },
  exam: {
    title: "Examination Operations",
    greeting: "Good morning, examination cell.",
    description:
      "Keep supplementary registration, eligibility, fee clearance and attempts together in one operational view.",
    metrics: [
      ["Eligible", "84", "Ready to register"],
      ["Pending fee", "13", "Needs follow-up"],
      ["Condonation", "4", "Under review"],
      ["Detained", "2", "Requires action"],
    ],
  },
  placement: {
    title: "Placement Readiness",
    greeting: "Good morning, placement cell.",
    description:
      "See which students are ready, which are recovering, and which backlog is blocking the next opportunity.",
    metrics: [
      ["Placement eligible", "438", "Current cohort"],
      ["Backlog constrained", "31", "Needs recovery"],
      ["Recovering", "18", "Intervention active"],
      ["Ready after clearance", "12", "Near-term wins"],
    ],
  },
} as const;

const dashboardNavigation = {
  student: [
    ["Dashboard", Home],
    ["My backlogs", Archive],
    ["Recovery plan", Sparkles],
    ["Exams", ClipboardCheck],
    ["Progress", LineChart],
    ["Notifications", Bell],
  ],
  mentor: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Interventions", Sparkles],
    ["Patterns", BarChart3],
    ["Alerts", Bell],
    ["Reports", FileText],
  ],
  hod: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Backlogs", Archive],
    ["Patterns", BarChart3],
    ["Interventions", Sparkles],
    ["Examinations", ClipboardCheck],
    ["Alerts", Bell],
    ["Reports", FileText],
  ],
  exam: [
    ["Dashboard", Home],
    ["Registrations", ClipboardCheck],
    ["Eligibility", ShieldCheck],
    ["Fee clearance", FileText],
    ["Alerts", Bell],
    ["Reports", LineChart],
  ],
  placement: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Readiness", BriefcaseBusiness],
    ["Backlog constraints", Archive],
    ["Alerts", Bell],
    ["Reports", LineChart],
  ],
} as const;

function DashboardSidebar({
  role,
  activeTab,
  onSelect,
  onLogout,
}: {
  role: UserRole;
  activeTab: string;
  onSelect: (tab: string) => void;
  onLogout: () => void;
}) {
  const roleLabel = userRoles.find((item) => item.id === role)?.label;

  return (
    <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
      <div className="sidebar-top">
        <Brand />
        <span className="sidebar-role">{roleLabel}</span>
      </div>
      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Workspace</span>
        {dashboardNavigation[role].map(([label, Icon]) => (
          <button
            className={`sidebar-link ${activeTab === label ? "active" : ""}`}
            key={label}
            type="button"
            aria-current={activeTab === label ? "page" : undefined}
            onClick={() => onSelect(label)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {label === "Alerts" && <b>3</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          className={`sidebar-link ${activeTab === "Settings" ? "active" : ""}`}
          type="button"
          onClick={() => onSelect("Settings")}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button
          className="sidebar-link sidebar-logout"
          type="button"
          onClick={onLogout}
        >
          <ArrowLeft size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function DashboardTopbar({ role }: { role: UserRole }) {
  const roleLabel = userRoles.find((item) => item.id === role)?.label;
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  useEffect(() => {
    let active = true;
    supabaseAuth.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      const metadata = data.user.user_metadata ?? {};
      const name =
        metadata.full_name ||
        metadata.name ||
        data.user.email?.split("@")[0] ||
        "Authenticated user";
      setProfileName(String(name));
      setProfileEmail(data.user.email || "");
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-3 bg-slate-100/70 border border-slate-200/60 rounded-full px-4 py-2 w-96 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
        <Search size={16} className="text-slate-400" />
        <input
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
          placeholder="Search students, courses, or IDs..."
        />
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="w-px h-8 bg-slate-200"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all">
            <CircleUserRound size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{profileName || roleLabel}</span>
            <span className="text-[11px] text-slate-500 font-medium">{profileEmail || `${roleLabel} · EduRecover`}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

const journeySteps = [
  ["hod", "HOD identifies", "Department signal", "Students"],
  ["mentor", "Mentor supports", "Recovery plan", "Interventions"],
  ["exam", "Exam validates", "Eligibility + attempt", "Registrations"],
  ["placement", "Placement monitors", "Readiness constraint", "Readiness"],
  ["student", "Student recovers", "Next action", "Recovery plan"],
] as const;

function RecoveryJourney({
  role,
  onSwitchRole,
  onSelectTab,
}: {
  role: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onSelectTab: (tab: string) => void;
}) {
  return (
    <section className="recovery-journey">
      <div className="journey-heading">
        <div>
          <span className="workspace-kicker">
            <i /> One connected case
          </span>
          <h2>From signal to recovery</h2>
          <p>
            Each team sees the same student story from its own point of view.
          </p>
        </div>
        <span className="journey-status">
          <i /> Shared case context
        </span>
      </div>
      <div className="journey-steps">
        {journeySteps.map(([stepRole, title, detail, tab], index) => (
          <button
            key={stepRole}
            className={`journey-step ${role === stepRole ? "current" : ""}`}
            type="button"
            onClick={() => {
              if (role === stepRole) onSelectTab(tab);
              else onSwitchRole(stepRole);
            }}
          >
            <span className="journey-number">0{index + 1}</span>
            <span className="journey-step-copy">
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
    </section>
  );
}

function HodCommandCenter({
  onSelectStudent,
  dashboard,
}: {
  onSelectStudent: (studentId: string) => void;
  dashboard: DashboardData;
}) {
  return (
    <section className="hod-command-center">
      <div className="hod-section-heading">
        <div>
          <span className="workspace-kicker">
            <BarChart3 size={13} /> Department signal map
          </span>
          <h2>What needs attention now</h2>
        </div>
        <span className="hod-sync-label">
          <i /> Live academic view
        </span>
      </div>
      <div className="hod-insights-grid">
        <article className="hod-panel semester-panel">
          <div className="hod-panel-heading">
            <div>
              <span>Trend</span>
              <h3>Backlogs by semester</h3>
            </div>
            <ArrowUpRight size={16} />
          </div>
          <div className="semester-chart">
            {dashboard.course_patterns.slice(0, 6).map((pattern, index) => (
              <div className="chart-column" key={index}>
                <div
                  className="chart-bar"
                  style={{ height: `${Math.min(100, pattern.count * 10)}%` }}
                />
                <span>{pattern.course_code}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="hod-panel pattern-panel">
          <div className="hod-panel-heading">
            <div>
              <span>Pattern detection</span>
              <h3>Failure patterns by course</h3>
            </div>
            <Sparkles size={16} />
          </div>
          <div className="course-bars">
            {dashboard.course_patterns.map((pattern) => (
              <div className="course-bar-row" key={pattern.course_code}>
                <span>{pattern.course_code}</span>
                <div>
                  <i
                    style={{ width: `${Math.min(100, pattern.count * 10)}%` }}
                  />
                </div>
                <strong>{pattern.count}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="hod-panel recovery-panel">
          <div className="hod-panel-heading">
            <div>
              <span>Assessment</span>
              <h3>Recoverability</h3>
            </div>
            <Gauge size={16} />
          </div>
          <div className="recovery-ring">
            <strong>{dashboard.active_backlog_count}</strong>
            <small>Total</small>
          </div>
          <div className="recovery-legend">
            <span>
              <i className="routine" /> Routine 54%
            </span>
            <span>
              <i className="structured" /> Structured 32%
            </span>
            <span>
              <i className="intensive" /> Intensive 14%
            </span>
          </div>
        </article>
      </div>
      <div className="hod-lower-grid">
        <article className="hod-panel attention-panel">
          <div className="hod-panel-heading">
            <div>
              <span>Priority queue</span>
              <h3>Requires HOD attention</h3>
            </div>
            <CircleAlert size={16} />
          </div>
          <div className="hod-case-list">
            {dashboard.students.map((item) => (
              <button
                key={item.student_id}
                onClick={() => onSelectStudent(item.student_id)}
              >
                <span
                  className={`case-icon ${item.status === "CRITICAL" ? "danger" : "warning"}`}
                >
                  <CircleAlert size={15} />
                </span>
                <span className="case-copy">
                  <strong>{item.student_id}</strong>
                  <small>
                    {item.active_backlog_count} active backlogs ·{" "}
                    {item.status.toLowerCase()}
                  </small>
                </span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </article>
        <article className="hod-panel alert-panel">
          <div className="hod-panel-heading">
            <div>
              <span>Recent alerts</span>
              <h3>Signals worth reviewing</h3>
            </div>
            <Users size={16} />
          </div>
          <div className="alert-list">
            <p>
              <b className="danger-dot" />
              <span>
                <strong>Attempt pressure</strong> 14 students have one attempt
                remaining.
              </span>
              <small>2h ago</small>
            </p>
            <p>
              <b className="warning-dot" />
              <span>
                <strong>Duration risk</strong> 6 students are nearing maximum
                duration.
              </span>
              <small>5h ago</small>
            </p>
            <p>
              <b className="success-dot" />
              <span>
                <strong>Recovery milestone</strong> 12 backlogs cleared this
                term.
              </span>
              <small>Today</small>
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

const tabContent = {
  Students: {
    eyebrow: "Student directory",
    title: "Students needing context",
    description:
      "Move from department signals to the student record behind the signal.",
    rows: [
      ["Rahul Sharma", "CSE · 2026", "3 active backlogs", "Critical"],
      ["Priya Rao", "CSE · 2026", "2 active backlogs", "Review"],
      ["Kiran Das", "IT · 2026", "1 active backlog", "Recovering"],
      ["Ananya Singh", "CSE · 2025", "2 active backlogs", "Duration risk"],
    ],
  },
  Backlogs: {
    eyebrow: "Arrear register",
    title: "Backlog portfolio",
    description:
      "Understand volume, repeated failures, and the cases closest to a missed recovery window.",
    rows: [
      [
        "Data Structures",
        "41 students",
        "3.2 average attempts",
        "High pressure",
      ],
      ["DBMS", "52 students", "2.1 average attempts", "Watch"],
      ["Mathematics", "68 students", "1.8 average attempts", "Monitor"],
      ["Operating Systems", "29 students", "1.6 average attempts", "Stable"],
    ],
  },
  Patterns: {
    eyebrow: "Academic intelligence",
    title: "Patterns worth acting on",
    description:
      "Agent 35 surfaces recurring failure and duration signals for human review.",
    rows: [
      [
        "Repeated core-course failure",
        "23 students",
        "Data Structures + DBMS",
        "Escalate",
      ],
      ["Attempt pressure", "14 students", "One attempt remaining", "Urgent"],
      ["Duration pressure", "13 students", "Two semesters remaining", "Review"],
      [
        "Recovery momentum",
        "12 students",
        "Backlogs cleared this term",
        "Positive",
      ],
    ],
  },
  Interventions: {
    eyebrow: "Human decisions",
    title: "Intervention queue",
    description:
      "Review recommendations, assign ownership, and track whether support is working.",
    rows: [
      ["Rahul Sharma", "Structured remedial", "Mentor sign-off", "Pending"],
      ["Kiran Das", "Mentor meeting", "In progress", "Active"],
      ["Priya Rao", "Supplementary registration", "Exam cell", "Ready"],
    ],
  },
  Examinations: {
    eyebrow: "Examination operations",
    title: "Eligibility and attempts",
    description:
      "Keep registration, fee clearance, and regulation checks in one operational view.",
    rows: [
      ["Eligible to register", "84 students", "Next supplementary", "Ready"],
      ["Pending fee clearance", "13 students", "Payment follow-up", "Action"],
      ["Condonation review", "4 students", "HOD decision", "Review"],
      ["Detained / debarred", "3 students", "Regulation check", "Restricted"],
    ],
  },
  Alerts: {
    eyebrow: "Signals and notifications",
    title: "Recent alerts",
    description:
      "A focused stream of changes that may require a decision or a student conversation.",
    rows: [
      ["Attempt pressure", "14 students", "One attempt remaining", "2h ago"],
      ["Duration risk", "6 students", "Near maximum duration", "5h ago"],
      ["Recovery milestone", "12 students", "Backlog cleared", "Today"],
    ],
  },
  Reports: {
    eyebrow: "Evidence package",
    title: "Academic reports",
    description:
      "Export a clear record of facts, calculations, recommendations, and outcomes.",
    rows: [
      [
        "Department recovery report",
        "August 2026",
        "214 active backlogs",
        "Export",
      ],
      [
        "Intervention effectiveness",
        "Term to date",
        "72% clearance rate",
        "Export",
      ],
      [
        "Regulation compliance",
        "Academic Regulation 2025",
        "All cohorts",
        "Export",
      ],
    ],
  },
  "My backlogs": {
    eyebrow: "My academic record",
    title: "Active backlogs",
    description:
      "See each course, attempt, and the next action available to you.",
    rows: [
      ["Data Structures", "2 attempts", "One attempt remaining", "Urgent"],
      ["DBMS", "1 attempt", "Supplementary eligible", "Ready"],
      ["Mathematics", "1 attempt", "Recovery plan active", "In progress"],
    ],
  },
  "Recovery plan": {
    eyebrow: "Recommended next steps",
    title: "My recovery plan",
    description:
      "A clear sequence of actions built from your academic record and regulation checks.",
    rows: [
      ["Register for supplementary exam", "18 Sept", "Data Structures", "Next"],
      ["Attend remedial class", "This week", "Core programming", "Scheduled"],
      ["Meet your mentor", "20 Sept", "Review progress", "Pending"],
    ],
  },
  Exams: {
    eyebrow: "Exam opportunities",
    title: "Supplementary exams",
    description:
      "Track eligibility, registration windows, and fee clearance for your next attempt.",
    rows: [
      ["Data Structures", "Attempt 3", "Registration open", "Eligible"],
      ["DBMS", "Attempt 2", "Fee paid", "Registered"],
      ["Mathematics", "Attempt 2", "Window opens soon", "Watch"],
    ],
  },
  Progress: {
    eyebrow: "Recovery journey",
    title: "Progress over time",
    description:
      "Follow your backlog movement, completed interventions, and upcoming milestones.",
    rows: [
      ["Backlog clearance", "78%", "Up 12% this term", "Positive"],
      ["Mentor actions", "4 of 5", "One meeting pending", "Active"],
      ["Next milestone", "1 course", "Clear before placement review", "Focus"],
    ],
  },
  Notifications: {
    eyebrow: "Your notifications",
    title: "Recent updates",
    description:
      "Important changes from examinations, mentors, and your recovery plan.",
    rows: [
      [
        "Supplementary registration",
        "Exam cell",
        "Registration window is open",
        "New",
      ],
      ["Mentor follow-up", "Prof. S. Dhital", "Meeting requested", "Action"],
      ["Recovery milestone", "Agent 35", "Plan updated with evidence", "Read"],
    ],
  },
  Registrations: {
    eyebrow: "Registration desk",
    title: "Supplementary registrations",
    description:
      "Monitor registration status, attempt number, fees, and exceptions across the cohort.",
    rows: [
      ["Rahul Sharma", "Data Structures", "Attempt 3", "Paid"],
      ["Priya Rao", "DBMS", "Attempt 2", "Pending fee"],
      ["Kiran Das", "Mathematics", "Attempt 2", "Eligible"],
    ],
  },
  Eligibility: {
    eyebrow: "Regulation checks",
    title: "Eligibility review",
    description:
      "See which students satisfy the current regulation and which cases require review.",
    rows: [
      ["Eligible", "84 students", "All criteria met", "Ready"],
      ["Review required", "4 students", "Condonation needed", "Review"],
      ["Restricted", "3 students", "Detained or debarred", "Action"],
    ],
  },
  "Fee clearance": {
    eyebrow: "Finance checkpoint",
    title: "Fee clearance",
    description:
      "Keep registration decisions aligned with payment status and the next exam window.",
    rows: [
      ["Paid", "71 students", "Registration can proceed", "Clear"],
      ["Pending", "13 students", "Reminder required", "Action"],
      ["Exception", "2 students", "Manual review", "Review"],
    ],
  },
  Readiness: {
    eyebrow: "Placement readiness",
    title: "Student readiness",
    description:
      "Understand how backlog status affects placement preparation and opportunity access.",
    rows: [
      ["Ready", "438 students", "No blocking backlog", "Eligible"],
      ["Recovering", "18 students", "Intervention active", "Track"],
      ["Constrained", "31 students", "Backlog affects opportunities", "Review"],
    ],
  },
  "Backlog constraints": {
    eyebrow: "Placement constraints",
    title: "Backlog-constrained students",
    description:
      "Coordinate recovery visibility with placement timelines without making placement decisions automatically.",
    rows: [
      ["DBMS clearance", "12 students", "Next hiring window", "Priority"],
      ["Duration pressure", "8 students", "Final placement cycle", "Urgent"],
      ["Recovery active", "11 students", "Mentor follow-up", "Track"],
    ],
  },
} as const;

function DashboardTabView({
  role,
  activeTab,
  onSelectStudent,
  dashboard,
}: {
  role: UserRole;
  activeTab: string;
  onSelectStudent: (studentId: string) => void;
  dashboard: DashboardData | null;
}) {
  const content = tabContent[activeTab as keyof typeof tabContent];
  if (!content) {
    return (
      <section className="dashboard-tab-view">
        <div className="tab-empty-state">
          <Settings size={22} />
          <h2>Workspace settings</h2>
          <p>
            Profile, notification, and institution preferences will live here.
          </p>
        </div>
      </section>
    );
  }

  const canOpenStudent = activeTab === "Students";
  const liveRows = dashboard
    ? activeTab === "Students"
      ? dashboard.students.map((student) => [
          student.student_id,
          `${student.active_backlog_count} active backlogs`,
          `${student.max_attempts_made} maximum attempts made`,
          student.status,
        ])
      : activeTab === "Backlogs"
        ? dashboard.course_patterns.map((pattern) => [
            pattern.course_code,
            `${pattern.count} records`,
            "Current pending backlog volume",
            "Live",
          ])
        : []
    : [];
  return (
    <section className="dashboard-tab-view">
      <div className="tab-view-heading">
        <div>
          <span className="workspace-kicker">
            <i /> {content.eyebrow}
          </span>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
        </div>
        <StatusBadge tone="success">Data synced</StatusBadge>
      </div>
      <div className="tab-summary-row">
        <div>
          <span>Scope</span>
          <strong>
            {role === "hod" ? "Department-wide" : dashboardByRole[role].title}
          </strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>Just now</strong>
        </div>
        <div>
          <span>Owner</span>
          <strong>Academic operations</strong>
        </div>
      </div>
      <div className="tab-table" role="table" aria-label={content.title}>
        <div className="tab-table-header" role="row">
          <span>Signal</span>
          <span>Scope</span>
          <span>Context</span>
          <span>Status</span>
        </div>
        {liveRows.length === 0 ? (
          <div className="tab-empty-state">
            <Activity size={22} />
            <h3>No live records available</h3>
            <p>
              This view will populate when the connected institution system
              provides data.
            </p>
          </div>
        ) : (
          liveRows.map(([signal, scope, context, status]) => (
            <button
              className="tab-table-row"
              key={`${signal}-${scope}`}
              type="button"
              onClick={() => canOpenStudent && onSelectStudent(signal)}
              disabled={!canOpenStudent}
            >
              <strong>{signal}</strong>
              <span>{scope}</span>
              <span>{context}</span>
              <StatusBadge
                tone={
                  status === "Critical" || status === "Urgent"
                    ? "danger"
                    : status === "Positive" || status === "Active"
                      ? "success"
                      : "warning"
                }
              >
                {status}
              </StatusBadge>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function RoleHomeView({
  role,
  onSelectTab,
}: {
  role: UserRole;
  onSelectTab: (tab: string) => void;
}) {
  const dashboard = dashboardByRole[role];
  const nextActions = {
    student: [
      ["Register for the next supplementary attempt", "Exams"],
      ["Review your Data Structures recovery plan", "Recovery plan"],
      ["Confirm your mentor meeting", "Notifications"],
    ],
    mentor: [
      ["Review the 8 students needing attention", "Students"],
      ["Prepare the next mentor conversation", "Interventions"],
      ["Track active interventions", "Reports"],
    ],
    exam: [
      ["Follow up on pending fee clearance", "Fee clearance"],
      ["Review condonation cases", "Eligibility"],
      ["Open the next supplementary window", "Registrations"],
    ],
    placement: [
      ["Review backlog-constrained students", "Backlog constraints"],
      ["Track recovery milestones", "Readiness"],
      ["Prepare placement readiness report", "Reports"],
    ],
    hod: [],
  }[role];
  return (
    <section className="role-home-view">
      <div className="role-home-heading">
        <div>
          <span className="workspace-kicker">
            <i /> Workspace overview
          </span>
          <h2>Your next decisions</h2>
          <p>
            Keep the most important academic work visible without opening the
            Agent 35 console.
          </p>
        </div>
        <StatusBadge tone="success">Synced just now</StatusBadge>
      </div>
      <div className="role-home-grid">
        <article className="role-home-progress">
          <span className="home-card-label">Current signal</span>
          <strong>{dashboard.metrics[0][1]}</strong>
          <h3>{dashboard.metrics[0][0]}</h3>
          <p>{dashboard.metrics[0][2]}</p>
          <div className="home-progress-track">
            <i style={{ width: role === "student" ? "78%" : "64%" }} />
          </div>
        </article>
        <article className="role-home-actions">
          <span className="home-card-label">Recommended actions</span>
          {nextActions.map(([action, tab], index) => (
            <button key={action} type="button" onClick={() => onSelectTab(tab)}>
              <b>0{index + 1}</b>
              <span>{action}</span>
              <ArrowUpRight size={14} />
            </button>
          ))}
        </article>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// Main PrototypePage Component
// ----------------------------------------------------

export function PrototypePage({
  role = "hod",
  mode = "dashboard",
  onBack,
  onSwitchRole,
}: {
  role?: UserRole;
  mode?: "prototype" | "dashboard";
  onBack: () => void;
  onSwitchRole?: (role: UserRole) => void;
}) {
  const [studentId, setStudentId] = useState(
    () => sessionStorage.getItem("edurecover-focus-student") || "",
  );
  const [mentorId, setMentorId] = useState("FACULTY_099");
  const [data, setData] = useState<OrchestrationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(
    mode === "dashboard",
  );
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [customFeeds, setCustomFeeds] = useState<any>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    if (mode !== "dashboard") return;
    let active = true;
    api
      .dashboard()
      .then((payload) => {
        if (!active) return;
        setDashboardData(payload);
        setStudentId(
          (current) => current || payload.students[0]?.student_id || "",
        );
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load dashboard data",
          );
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  const refreshActivity = useCallback(async (targetId: string) => {
    try {
      const payload = await api.activity(targetId);
      setActivityEvents(payload.events);
    } catch {
      setActivityEvents([]);
    }
  }, []);

  const fetchOrchestration = useCallback(
    async (targetId: string) => {
      const requestId = ++requestSequence.current;
      sessionStorage.setItem("edurecover-focus-student", targetId);
      setLoading(true);
      setError("");
      setApproved(false);
      setDispatchLogs([]);
      setActivityEvents([]);
      try {
        const payload = await api.orchestration(targetId, customFeeds);
        if (requestId !== requestSequence.current) return;
        setData(payload);
        void refreshActivity(targetId);
      } catch (requestError) {
        if (requestId !== requestSequence.current) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "An unexpected error occurred",
        );
      } finally {
        if (requestId === requestSequence.current) setLoading(false);
      }
    },
    [refreshActivity, customFeeds],
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setCustomFeeds(json);
        alert(
          "External JSON loaded! Click 'Run orchestrator' to save to the database and generate a plan.",
        );
      } catch (err) {
        alert("Invalid JSON file. Please ensure it is correctly formatted.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!showScanner) return;
    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      {
        fps: 15,
        qrbox: { width: 340, height: 110 },
        rememberLastUsedCamera: true,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
      },
      false,
    );
    scanner.render(
      (decodedText) => {
        scanner.clear().catch(() => undefined);
        setShowScanner(false);
        const scannedId = decodedText.trim().toUpperCase();
        setStudentId(scannedId);
        void fetchOrchestration(scannedId);
      },
      () => undefined,
    );
    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [fetchOrchestration, showScanner]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispatchLogs]);

  const handleApprove = async () => {
    setApproving(true);
    setError("");
    try {
      await api.approve(studentId, mentorId);
      setApproved(true);
      setShowApprovalConfirm(false);
      const logs = [
        `[SYSTEM] Initiating downstream pipeline for ${studentId}...`,
        `[SYSTEM] Authorized by mentor ID: ${mentorId}`,
        `[COMM_MODULE] Formal intervention notice queued.`,
        `[REMEDIAL_MODULE] Student support module notified.`,
        `[SCHEDULER_MODULE] Faculty counseling slot requested.`,
        `[SYSTEM] Backlog status mutated to INTERVENTION_ACTIVE.`,
        `[SYSTEM] Pipeline fully deployed and synced.`,
      ];
      logs.forEach((log, index) =>
        setTimeout(
          () => setDispatchLogs((current) => [...current, log]),
          (index + 1) * 550,
        ),
      );
      window.setTimeout(() => void refreshActivity(studentId), 1800);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to approve intervention",
      );
    } finally {
      setApproving(false);
    }
  };

  const exportData = (format: "json" | "csv" | "txt") => {
    if (!data) return;
    const {
      deterministic_evaluation: evaluation,
      ai_orchestration: recommendation,
    } = data;
    const content =
      format === "json"
        ? JSON.stringify(data, null, 2)
        : format === "csv"
          ? `Course Code,Attempts Made,Status\n${evaluation.backlog_details.map((item) => `${item.course_code},${item.attempts_made},${item.status}`).join("\n")}`
          : `EDURECOVER ACADEMIC RECOVERY REPORT\n\nStudent: ${data.target_student_id}\nActive backlogs: ${evaluation.active_backlog_count}\nPromotion status: ${evaluation.promotion_status}\nRecovery segment: ${recommendation.recoverability_segment}\n\nReasoning\n${recommendation.reasoning}\n\nRecommended actions\n${recommendation.recommended_actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}`;
    const blob = new Blob([content], {
      type:
        format === "json"
          ? "application/json"
          : format === "csv"
            ? "text/csv"
            : "text/plain",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `EduRecover_${data.target_student_id}.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const evaluation = data?.deterministic_evaluation;
  const recommendation = data?.ai_orchestration;
  const durationRisk =
    evaluation?.attempt_pressure === "HIGH" ||
    evaluation?.attempt_pressure === "CRITICAL"
      ? "HIGH"
      : "LOW";
  const dashboard = dashboardByRole[role];
  const liveMetrics: Array<[string, string, string]> = dashboardData
    ? [
        [
          "Active backlogs",
          String(dashboardData.active_backlog_count),
          "Current institutional records",
        ],
        [
          "Students affected",
          String(dashboardData.student_count),
          "Students with pending backlogs",
        ],
        [
          "Critical cases",
          String(dashboardData.critical_case_count),
          "Requires human review",
        ],
        [
          "Interventions",
          String(dashboardData.intervention_count),
          "Recorded in the system",
        ],
      ]
    : [];
  const dashboardAction = {
    student: ["Review recovery plan", "Recovery plan"],
    mentor: ["Open priority students", "Students"],
    hod: ["Review critical cases", "Students"],
    exam: ["Review registrations", "Registrations"],
    placement: ["Review readiness constraints", "Backlog constraints"],
  }[role];
  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setData(null);
    setDispatchLogs([]);
    setError("");
  };

  const hasAgent34 =
    (data?.integration_feeds?.agent_34_results?.results?.length ?? 0) > 0;
  const hasAgent30 =
    (data?.integration_feeds?.agent_30_supplementary?.supplementary_exams
      ?.length ?? 0) > 0;
  const hasFeeds = hasAgent34 || hasAgent30;

  return (
    <main
      className={`workspace-page ${mode === "prototype" ? "prototype-console" : "role-dashboard"}`}
    >
      {mode === "dashboard" && (
        <DashboardSidebar
          role={role}
          activeTab={activeTab}
          onSelect={handleTabSelect}
          onLogout={onBack}
        />
      )}
      {mode === "dashboard" ? (
        <DashboardTopbar role={role} />
      ) : (
        <header className="workspace-header">
          <div className="workspace-brand">
            <button
              className="icon-button"
              onClick={onBack}
              aria-label="Back to landing page"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="workspace-product-lockup">
                <Brand compact />
                <span>EduRecover</span>
              </div>
              <span className="workspace-kicker">
                <i />{" "}
                {mode === "prototype"
                  ? "Agent 35 prototype console"
                  : role === "hod"
                    ? "HOD command center"
                    : "Workspace"}
              </span>
              <h1>
                {mode === "prototype"
                  ? "Backlog Monitoring Agent"
                  : dashboard.title}
              </h1>
              <p>
                Run the complete Agent 35 flow against a student record, ingest
                external JSON feeds to your DB, inspect the reasoning, and
                deploy an approved intervention.
              </p>
            </div>
          </div>
          <div className="workspace-tools">
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              className={`workspace-button ${customFeeds ? "success" : "subtle"}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <UploadCloud size={16} />{" "}
              {customFeeds ? "External JSON Active" : "Load External JSON"}
            </button>
            <button
              className="workspace-button subtle"
              onClick={() => setShowScanner(true)}
              disabled={loading}
            >
              <QrCode size={16} /> Scan ID
            </button>
            <div className="student-search">
              <Search size={15} />
              <input
                value={studentId}
                onChange={(event) =>
                  setStudentId(event.target.value.toUpperCase())
                }
                aria-label="Registration number"
                placeholder="Registration no."
              />
            </div>
            <button
              className="workspace-button primary"
              onClick={() => void fetchOrchestration(studentId)}
              disabled={loading || !studentId}
            >
              {loading ? (
                <RefreshCw className="spin" size={16} />
              ) : (
                <Activity size={16} />
              )}
              {loading ? "Analyzing" : "Run orchestrator"}
            </button>
          </div>
        </header>
      )}

      {mode === "dashboard" && activeTab === "Dashboard" && (
        <section className={`dashboard-overview dashboard-role-${role}`}>
          <div className="dashboard-overview-copy">
            <span className="workspace-kicker">{dashboard.greeting}</span>
            <h2>{dashboard.title}</h2>
            <p>{dashboard.description}</p>
            <button
              className="dashboard-next-action"
              type="button"
              onClick={() => handleTabSelect(dashboardAction[1])}
            >
              <span className="dashboard-next-icon">
                <Sparkles size={15} />
              </span>
              <span>
                <small>Recommended next step</small>
                <strong>{dashboardAction[0]}</strong>
              </span>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="dashboard-overview-status">
            <span>
              <i /> Data synced
            </span>
            <small>Last updated just now</small>
          </div>
          <div className="dashboard-metrics">
            {liveMetrics.map(([label, value, detail]) => (
              <div className="dashboard-metric" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{detail}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {mode === "dashboard" &&
        activeTab === "Dashboard" &&
        role === "hod" &&
        !data &&
        !loading &&
        !dashboardLoading &&
        dashboardData && (
          <HodCommandCenter
            dashboard={dashboardData}
            onSelectStudent={(selectedStudentId) => {
              setStudentId(selectedStudentId);
              setActiveTab("Students");
              void fetchOrchestration(selectedStudentId);
            }}
          />
        )}

      {mode === "dashboard" && activeTab === "Dashboard" && onSwitchRole && (
        <RecoveryJourney
          role={role}
          onSwitchRole={onSwitchRole}
          onSelectTab={handleTabSelect}
        />
      )}

      {mode === "dashboard" &&
        activeTab !== "Dashboard" &&
        !data &&
        !loading &&
        !dashboardLoading &&
        dashboardData && (
          <DashboardTabView
            role={role}
            activeTab={activeTab}
            dashboard={dashboardData}
            onSelectStudent={(selectedStudentId) => {
              setStudentId(selectedStudentId);
              void fetchOrchestration(selectedStudentId);
            }}
          />
        )}

      {mode === "prototype" && (
        <section className="workspace-toolbar">
          <div className="profile-label">
            <span>Agent 35 test profiles</span>
            <small>Pick a record to exercise the orchestration flow</small>
          </div>
          <div className="profile-pills">
            {(
              dashboardData?.students.map((student) => student.student_id) ?? []
            ).map((id) => (
              <button
                key={id}
                className={studentId === id ? "active" : ""}
                onClick={() => {
                  setStudentId(id);
                  setData(null);
                  setDispatchLogs([]);
                }}
              >
                {id}
              </button>
            ))}
          </div>
          <button className="workspace-button ghost" onClick={onBack}>
            <ArrowLeft size={15} /> Public site
          </button>
        </section>
      )}

      {error && (
        <div className="workspace-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}

      {mode === "dashboard" &&
        activeTab === "Dashboard" &&
        role !== "hod" &&
        !data &&
        !loading && <RoleHomeView role={role} onSelectTab={handleTabSelect} />}

      {!data && !loading && mode === "prototype" && (
        <section className="workspace-empty">
          <div className="empty-icon">
            <Gauge size={27} />
          </div>
          <span className="workspace-kicker">Ready for analysis</span>
          <h2>Start with a student signal.</h2>
          <p>
            Choose a demo profile, scan an ID, or load external agent JSON to
            build an evidence-backed recovery plan.
          </p>
          <button
            className="workspace-button primary"
            onClick={() => void fetchOrchestration(studentId)}
          >
            <Sparkles size={16} /> Analyze {studentId}
          </button>
        </section>
      )}

      {loading && (
        <section className="workspace-empty">
          <RefreshCw className="spin empty-icon" size={27} />
          <span className="workspace-kicker">Agent 35 is working</span>
          <h2>Assembling the student context.</h2>
          <p>
            Retrieving results, applying regulations, and evaluating
            recoverability.
          </p>
        </section>
      )}

      {data && evaluation && recommendation && (
        <section className="workspace-content">
          {(() => {
            const profile = {
              name: data.target_student_id,
              program: "Institutional record",
              batch: "Batch unavailable",
              semester: "Semester unavailable",
              mentor: mentorId,
            };
            return (
              <article className="student-context-card">
                <div className="student-context-identity">
                  <span className="student-context-avatar">
                    <CircleUserRound size={25} />
                  </span>
                  <div>
                    <span className="workspace-kicker">
                      Student recovery case
                    </span>
                    <h2>{profile.name}</h2>
                    <p>
                      {profile.program} · {profile.batch}
                    </p>
                  </div>
                </div>
                <div className="student-context-facts">
                  <span>
                    <small>Semester</small>
                    <strong>{profile.semester}</strong>
                  </span>
                  <span>
                    <small>Assigned mentor</small>
                    <strong>{profile.mentor}</strong>
                  </span>
                  <span>
                    <small>Case owner</small>
                    <strong>
                      {role === "hod" ? "HOD review" : "Academic operations"}
                    </strong>
                  </span>
                </div>
              </article>
            );
          })()}
          <div className="workspace-overview">
            <div>
              <span className="workspace-kicker">
                Student evaluation profile
              </span>
              <h2>
                {data.target_student_id}
                <span> · academic recovery brief</span>
              </h2>
            </div>
            <div className="workspace-overview-actions">
              {mode === "dashboard" && role === "hod" && (
                <button
                  className="workspace-button ghost"
                  onClick={() => {
                    setData(null);
                    setDispatchLogs([]);
                  }}
                >
                  <ArrowLeft size={15} /> Command center
                </button>
              )}
              <StatusBadge tone={approved ? "success" : "warning"}>
                {approved ? "Intervention approved" : "Human review required"}
              </StatusBadge>
            </div>
          </div>
          <div className="workspace-stats">
            <StatCard
              label="Active backlogs"
              value={`${evaluation.active_backlog_count} / ${evaluation.max_allowed_backlogs}`}
              detail="Current academic load"
              tone="warning"
            />
            <StatCard
              label="Promotion status"
              value={evaluation.promotion_status}
              detail="Rule engine result"
              tone={
                evaluation.promotion_status === "ELIGIBLE"
                  ? "success"
                  : "danger"
              }
            />
            <StatCard
              label="Attempt pressure"
              value={evaluation.attempt_pressure}
              detail="Regulation-aware signal"
            />
            <StatCard
              label="Duration risk"
              value={durationRisk}
              detail="Completion runway"
              tone={durationRisk === "HIGH" ? "danger" : "success"}
            />
          </div>
          <div className="workspace-grid">
            <div className="workspace-column">
              <article className="workspace-card agent-checklist-card">
                <div className="card-heading">
                  <div>
                    <span className="workspace-kicker">
                      <Activity size={12} /> Agent 35 reasoning
                    </span>
                    <h3>Analysis complete</h3>
                  </div>
                  <StatusBadge tone="success">Evidence ready</StatusBadge>
                </div>
                <div className="agent-checklist">
                  {[
                    "Retrieved student profile",
                    "Applied current regulation",
                    "Calculated attempts and progression",
                    "Checked results and supplementary feeds",
                    "Classified recoverability",
                  ].map((step) => (
                    <div key={step}>
                      <Check size={14} />
                      <span>{step}</span>
                      <small>Complete</small>
                    </div>
                  ))}
                </div>
                <div className="agent-next-state">
                  <span>Next handoff</span>
                  <strong>
                    {approved
                      ? "Intervention is active"
                      : "Human approval required"}
                  </strong>
                </div>
              </article>
              <article className="workspace-card">
                <div className="card-heading">
                  <div>
                    <span className="workspace-kicker">
                      Fact · institutional record
                    </span>
                    <h3>Arrear register</h3>
                  </div>
                  <Archive size={18} />
                </div>
                {evaluation.backlog_details.length === 0 ? (
                  <p className="muted-copy">
                    No active backlogs found for this profile.
                  </p>
                ) : (
                  <div className="backlog-list">
                    {evaluation.backlog_details.map((backlog) => (
                      <div className="backlog-row" key={backlog.id}>
                        <strong>{backlog.course_code}</strong>
                        <span>
                          {backlog.attempts_made} made ·{" "}
                          {backlog.attempts_remaining ?? "-"} remaining
                        </span>
                        <StatusBadge tone="warning">
                          {backlog.status}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                )}
              </article>
              <article className="workspace-card">
                <div className="card-heading">
                  <div>
                    <span className="workspace-kicker">
                      Calculation · rule engine
                    </span>
                    <h3>Decision context</h3>
                  </div>
                  <ShieldCheck size={18} />
                </div>
                <div className="context-list">
                  <div>
                    <span>Registration number</span>
                    <strong>{data.target_student_id}</strong>
                  </div>
                  <div>
                    <span>Chronic failure pattern</span>
                    <StatusBadge
                      tone={
                        evaluation.active_backlog_count >= 3
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {evaluation.active_backlog_count >= 3
                        ? "Detected"
                        : "None"}
                    </StatusBadge>
                  </div>
                  <div>
                    <span>Attempts remaining</span>
                    <strong>
                      {evaluation.backlog_details.reduce(
                        (minimum, backlog) =>
                          Math.min(minimum, backlog.attempts_remaining ?? 0),
                        evaluation.max_attempts ?? 0,
                      )}
                    </strong>
                  </div>
                </div>
              </article>

              {hasFeeds && (
                <article className="workspace-card evidence-card">
                  <div className="card-heading">
                    <div>
                      <span className="workspace-kicker">
                        Fact · connected systems
                      </span>
                      <h3>Evidence feeds</h3>
                    </div>
                    <Activity size={18} />
                  </div>

                  {hasAgent34 && (
                    <div className="feed-block">
                      <div className="feed-heading">
                        <strong>Agent 34 · Results</strong>
                        <StatusBadge tone="success">Institutional</StatusBadge>
                      </div>
                      {data.integration_feeds!.agent_34_results.results.map(
                        (result) => (
                          <div
                            className="feed-row"
                            key={`${result.course_code}-${result.term}`}
                          >
                            <span>{result.course_code}</span>
                            <small>{result.term}</small>
                            <StatusBadge
                              tone={
                                result.result === "PASS" ? "success" : "danger"
                              }
                            >
                              {result.result}
                            </StatusBadge>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {hasAgent30 && (
                    <div className="feed-block">
                      <div className="feed-heading">
                        <strong>Agent 30 · Supplementary</strong>
                        <StatusBadge tone="success">Institutional</StatusBadge>
                      </div>
                      {data.integration_feeds!.agent_30_supplementary.supplementary_exams.map(
                        (exam) => (
                          <div
                            className="feed-row feed-stack"
                            key={exam.course_code}
                          >
                            <span>{exam.course_code}</span>
                            <small>
                              {exam.supplementary_available
                                ? "Available"
                                : "Unavailable"}{" "}
                              ·{" "}
                              {exam.fee_cleared ? "Fee cleared" : "Fee pending"}{" "}
                              ·{" "}
                              {exam.attendance_eligible
                                ? "Attendance eligible"
                                : "Attendance blocked"}
                            </small>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </article>
              )}
            </div>
            <div className="workspace-column">
              <article className="workspace-card recommendation-card">
                <div className="card-heading">
                  <div>
                    <span className="workspace-kicker">
                      <Sparkles size={12} /> AI recommendation
                    </span>
                    <h3>{recommendation.recoverability_segment}</h3>
                  </div>
                  <StatusBadge tone="warning">Approval required</StatusBadge>
                </div>
                <div className="reasoning-block">
                  <span>Evidence-based reasoning</span>
                  <p>{recommendation.reasoning}</p>
                </div>
                <div className="actions-block">
                  <span>Recommended interventions</span>
                  <ol>
                    {recommendation.recommended_actions.map((action, index) => (
                      <li key={action}>
                        <b>0{index + 1}</b>
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="approval-row">
                  <div>
                    <span>Human decision</span>
                    <strong>
                      {approved
                        ? `Approved by ${mentorId}`
                        : "Awaiting mentor sign-off"}
                    </strong>
                    {!approved && (
                      <select
                        value={mentorId}
                        onChange={(event) => setMentorId(event.target.value)}
                      >
                        <option value="FACULTY_099">Prof. S. Dhital</option>
                        <option value="FACULTY_104">Dr. A. Sharma</option>
                      </select>
                    )}
                  </div>
                  <button
                    className={`workspace-button ${approved ? "success" : "primary"}`}
                    onClick={() => {
                      if (showApprovalConfirm) void handleApprove();
                      else setShowApprovalConfirm(true);
                    }}
                    disabled={approving || approved}
                  >
                    {approved ? <Check size={16} /> : <ShieldCheck size={16} />}
                    {approving
                      ? "Logging"
                      : approved
                        ? "Intervention approved"
                        : showApprovalConfirm
                          ? "Confirm & deploy"
                          : "Approve & deploy"}
                  </button>
                  {!approved && showApprovalConfirm && (
                    <button
                      className="workspace-button ghost"
                      type="button"
                      onClick={() => setShowApprovalConfirm(false)}
                      disabled={approving}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
              {(dispatchLogs.length > 0 || activityEvents.length > 0) && (
                <article className="workspace-card activity-card">
                  <div className="card-heading">
                    <div>
                      <span className="workspace-kicker">Agent activity</span>
                      <h3>Downstream execution log</h3>
                    </div>
                    <Activity size={18} />
                  </div>
                  <div className="activity-log">
                    {activityEvents.length > 0
                      ? activityEvents.map((event) => (
                          <p key={event.event_id}>
                            <Check size={13} />
                            <span>
                              <strong>{event.agent_id}</strong> {event.message}
                            </span>
                            <small>{event.status}</small>
                          </p>
                        ))
                      : dispatchLogs.map((log) => (
                          <p key={log}>
                            <Check size={13} />
                            {log}
                          </p>
                        ))}
                    <div ref={logsEndRef} />
                  </div>
                </article>
              )}
              <article className="workspace-card export-card">
                <div>
                  <span className="workspace-kicker">Evidence package</span>
                  <h3>Export this recovery brief</h3>
                </div>
                <div className="export-actions">
                  <button onClick={() => exportData("json")}>
                    <FileJson size={15} /> JSON
                  </button>
                  <button onClick={() => exportData("csv")}>
                    <FileSpreadsheet size={15} /> CSV
                  </button>
                  <button onClick={() => exportData("txt")}>
                    <FileText size={15} /> Report
                  </button>
                  <Download size={16} className="export-icon" />
                </div>
              </article>
            </div>
          </div>
        </section>
      )}

      {showScanner && (
        <div className="scanner-backdrop">
          <div className="scanner-modal">
            <div className="scanner-heading">
              <div>
                <span className="workspace-kicker">Institutional input</span>
                <h2>Scan student ID</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowScanner(false)}
                aria-label="Close scanner"
              >
                <X size={18} />
              </button>
            </div>
            <div id="barcode-reader" />
            <div className="scanner-footer">
              <p>Align a barcode or QR code within the target frame.</p>
              <button
                className="workspace-button primary"
                onClick={() => {
                  setShowScanner(false);
                  void fetchOrchestration(studentId);
                }}
              >
                <Sparkles size={15} /> Use {studentId}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}