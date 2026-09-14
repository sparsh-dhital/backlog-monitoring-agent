import { useCallback, useEffect, useRef, useState } from "react";
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
  Check,
  CircleAlert,
  CircleUserRound,
  ClipboardCheck,
  Download,
  Ellipsis,
  FileJson,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Gauge,
  Home,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Brand from "../components/Brand";
import type {
  ActivityEvent,
  DashboardData,
  OrchestrationData,
} from "../types/agent";
import { userRoles, type UserRole } from "../types/roles";
import { api } from "../api";
import { StatCard, StatusBadge } from "../components/WorkspacePrimitives";
import RecoverySimulator from "../components/RecoverySimulator";
import DepartmentCharts from "../components/DepartmentCharts";
import BacklogManager from "../components/BacklogManager";
import StudentBacklogCharts from "../components/StudentBacklogCharts";
import { supabaseAuth } from "../supabaseClient";
import VoiceAssistant from "../components/VoiceAssistant";
import {
  addDemoEvent,
  listDemoEvents,
  subscribeToDemoEvents,
  type DemoEvent,
} from "../shared/demoStore";

const dashboardByRole = {
  student: {
    title: "My Academic Recovery",
    greeting: "Good morning, Rahul.",
    description:
      "Here is what needs your attention, and the next step that keeps your degree on track.",
  },
  mentor: {
    title: "My Students",
    greeting: "Good morning, mentor.",
    description:
      "A focused queue of students who need a conversation, an intervention, or a little more context.",
  },
  hod: {
    title: "Academic Command Center",
    greeting: "Good morning, HOD.",
    description:
      "See the department-wide picture, then open the cases behind the trend before they become harder to recover.",
  },
  exam: {
    title: "Examination Operations",
    greeting: "Good morning, examination cell.",
    description:
      "Keep supplementary registration, eligibility, fee clearance and attempts together in one operational view.",
  },
  placement: {
    title: "Placement Readiness",
    greeting: "Good morning, placement cell.",
    description:
      "See which students are ready, which are recovering, and which backlog is blocking the next opportunity.",
  },
} as const;

/* Every entry below resolves to a real endpoint. Tabs that had no data
   source (Reports, Progress, Readiness, Notifications, Settings) were
   removed rather than left rendering placeholder rows. */
const dashboardNavigation = {
  student: [
    ["Dashboard", Home],
    ["My backlogs", Archive],
    ["Simulator", FlaskConical],
  ],
  mentor: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Interventions", Sparkles],
    ["Patterns", BarChart3],
    ["Alerts", Bell],
  ],
  hod: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Backlogs", Archive],
    ["Patterns", BarChart3],
    ["Interventions", Sparkles],
    ["Examinations", ClipboardCheck],
    ["Alerts", Bell],
  ],
  exam: [
    ["Dashboard", Home],
    ["Registrations", ClipboardCheck],
    ["Eligibility", ShieldCheck],
    ["Fee clearance", FileText],
    ["Alerts", Bell],
  ],
  placement: [
    ["Dashboard", Home],
    ["Backlog constraints", Archive],
    ["Alerts", Bell],
  ],
} as const;

function DashboardSidebar({
  role,
  activeTab,
  onSelect,
  onLogout,
  alertCount,
}: {
  role: UserRole;
  activeTab: string;
  onSelect: (tab: string) => void;
  onLogout: () => void;
  alertCount: number;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const roleLabel = userRoles.find((item) => item.id === role)?.label;
  const roleBadgeColors: Record<string, string> = {
    hod: "bg-violet-100 text-violet-700",
    mentor: "bg-blue-100 text-blue-700",
    student: "bg-emerald-100 text-emerald-700",
    exam: "bg-amber-100 text-amber-700",
    placement: "bg-rose-100 text-rose-700",
  };
  const mobilePrimaryItems = dashboardNavigation[role].slice(0, 4);
  const mobileMoreItems = dashboardNavigation[role].slice(4);

  const selectMobileItem = (label: string) => {
    setMoreOpen(false);
    onSelect(label);
  };

  return (
    <aside
      className="dashboard-sidebar flex flex-col w-64 shrink-0 h-full bg-white border-r border-slate-100 shadow-[2px_0_12px_rgba(0,0,0,0.04)] z-20"
      aria-label="Dashboard navigation"
    >
      {/* Brand & Role */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <Brand compact />
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-slate-800 tracking-tight">
            EduRecover
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 self-start ${roleBadgeColors[role] ?? "bg-slate-100 text-slate-600"}`}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Workspace
        </p>
        <div className="flex flex-col gap-0.5">
          {dashboardNavigation[role].map(([label, Icon]) => (
            <button
              key={label}
              type="button"
              aria-current={activeTab === label ? "page" : undefined}
              onClick={() => onSelect(label)}
              className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold tracking-tight transition-all duration-150 ${
                activeTab === label
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                size={17}
                className={
                  activeTab === label
                    ? "text-indigo-200"
                    : "text-slate-400 group-hover:text-slate-600"
                }
              />
              <span className="flex-1 text-left">{label}</span>
              {label === "Alerts" && alertCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === label
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="dashboard-sidebar-actions px-3 py-3 border-t border-slate-100 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold tracking-tight text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150"
        >
          <ArrowLeft size={17} className="text-slate-400" />
          <span>Logout</span>
        </button>
      </div>

      <div
        className="dashboard-mobile-nav"
        aria-label="Mobile dashboard navigation"
      >
        {mobilePrimaryItems.map(([label, Icon]) => (
          <button
            key={label}
            type="button"
            aria-current={activeTab === label ? "page" : undefined}
            onClick={() => selectMobileItem(label)}
            className={activeTab === label ? "is-active" : ""}
          >
            <Icon size={19} />
            <span>{label === "Dashboard" ? "Overview" : label}</span>
            {label === "Alerts" && alertCount > 0 && <b>{alertCount}</b>}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="mobile-dashboard-more"
          onClick={() => setMoreOpen((current) => !current)}
          className={
            moreOpen ||
            !mobilePrimaryItems.some(([label]) => label === activeTab)
              ? "is-active"
              : ""
          }
        >
          {moreOpen ? <X size={19} /> : <Ellipsis size={19} />}
          <span>More</span>
        </button>
        {moreOpen && (
          <div className="dashboard-mobile-more" id="mobile-dashboard-more">
            {mobileMoreItems.map(([label, Icon]) => (
              <button
                key={label}
                type="button"
                aria-current={activeTab === label ? "page" : undefined}
                onClick={() => selectMobileItem(label)}
                className={activeTab === label ? "is-active" : ""}
              >
                <Icon size={17} />
                <span>{label}</span>
                {label === "Alerts" && alertCount > 0 && <b>{alertCount}</b>}
              </button>
            ))}
            <button type="button" onClick={onLogout}>
              <ArrowLeft size={17} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function DashboardTopbar({
  role,
  search,
  onSearchChange,
  alertCount,
  onOpenAlerts,
}: {
  role: UserRole;
  search: string;
  onSearchChange: (value: string) => void;
  alertCount: number;
  onOpenAlerts: () => void;
}) {
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
        metadata.user_name ||
        metadata.preferred_username ||
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
    <header className="dashboard-topbar h-16 bg-white border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between px-8">
      {/* Search */}
      <div className="dashboard-search flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 h-10 w-80 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          aria-label="Search dashboard"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
          placeholder="Search students or courses..."
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notification bell — count comes from the live alert feed */}
        <button
          type="button"
          onClick={onOpenAlerts}
          aria-label={`Notifications: ${alertCount} active`}
          className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-150"
        >
          <Bell size={19} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
              {alertCount}
            </span>
          )}
        </button>

        <div className="w-px h-7 bg-slate-200" />

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-200">
            <CircleUserRound size={19} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
              {profileName || roleLabel}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {profileEmail || `${roleLabel} · EduRecover`}
            </span>
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
    <section
      className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6"
      aria-label="Academic recovery journey"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
            One connected case
          </p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            From signal to recovery
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Each team sees the same student story from its own point of view.
          </p>
        </div>
        <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Shared case context
        </span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {journeySteps.map(([stepRole, title, detail, tab], index) => (
          <button
            key={stepRole}
            type="button"
            onClick={() => {
              if (role === stepRole) onSelectTab(tab);
              else onSwitchRole(stepRole);
            }}
            className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
              role === stepRole
                ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-200 text-white"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-indigo-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${
                  role === stepRole
                    ? "bg-white/20 text-white"
                    : "bg-indigo-100 text-indigo-600"
                }`}
              >
                0{index + 1}
              </span>
              <ArrowRight
                size={14}
                className={
                  role === stepRole ? "text-indigo-200" : "text-slate-400"
                }
              />
            </div>
            <div>
              <p
                className={`text-sm font-bold leading-tight ${
                  role === stepRole ? "text-white" : "text-slate-800"
                }`}
              >
                {title}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  role === stepRole ? "text-indigo-200" : "text-slate-500"
                }`}
              >
                {detail}
              </p>
            </div>
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
    <section aria-label="Academic command center">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <BarChart3 size={14} /> Department signal map
          </p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            What needs attention now
          </h2>
        </div>
        <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live academic view
        </span>
      </div>

      {/* Validated chart suite — replaces the earlier placeholder visuals,
          whose donut carried hardcoded percentages rather than real data. */}
      <div className="mb-4">
        <DepartmentCharts dashboard={dashboard} />
      </div>

      {/* Bottom 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Priority queue */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Priority queue
              </p>
              <h3 className="text-sm font-bold text-slate-800">
                Requires HOD attention
              </h3>
            </div>
            <CircleAlert size={16} className="text-rose-400" />
          </div>
          <div className="flex flex-col gap-2">
            {dashboard.students.map((item) => (
              <button
                key={item.student_id}
                type="button"
                onClick={() => onSelectStudent(item.student_id)}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-rose-50 hover:border-rose-100 transition-all duration-150 group text-left"
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    item.status === "CRITICAL"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  <CircleAlert size={15} />
                </span>
                <span className="flex-1">
                  <strong className="text-sm font-bold text-slate-800 block font-mono">
                    {item.student_id}
                  </strong>
                  <small className="text-xs text-slate-500">
                    {item.active_backlog_count} active backlogs ·{" "}
                    {item.status.toLowerCase()}
                  </small>
                </span>
                <ArrowUpRight
                  size={15}
                  className="text-slate-300 group-hover:text-rose-500 transition-colors"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Alerts feed */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recent alerts
              </p>
              <h3 className="text-sm font-bold text-slate-800">
                Signals worth reviewing
              </h3>
            </div>
            <Users size={16} className="text-slate-300" />
          </div>
          <div className="flex flex-col gap-3">
            {(() => {
              // Derived from live dashboard data — no fabricated counts, and no
              // "duration" claim, since the schema carries no admission date,
              // semester of origin, or programme length to measure against.
              const nearLimit = dashboard.students.filter(
                (s) => s.max_attempts_made >= 2,
              ).length;
              const topCourse = dashboard.course_patterns[0];
              const signals = [
                nearLimit > 0 && {
                  dot: "bg-rose-500",
                  title: "Attempt pressure",
                  desc: `${nearLimit} student${nearLimit === 1 ? "" : "s"} at or near the attempt limit.`,
                },
                dashboard.critical_case_count > 0 && {
                  dot: "bg-rose-500",
                  title: "Critical cases",
                  desc: `${dashboard.critical_case_count} student${dashboard.critical_case_count === 1 ? "" : "s"} need human review.`,
                },
                topCourse && {
                  dot: "bg-amber-500",
                  title: "Failure concentration",
                  desc: `${topCourse.course_code} accounts for ${topCourse.count} pending backlog${topCourse.count === 1 ? "" : "s"}.`,
                },
                dashboard.intervention_count > 0 && {
                  dot: "bg-emerald-500",
                  title: "Interventions active",
                  desc: `${dashboard.intervention_count} recovery plan${dashboard.intervention_count === 1 ? "" : "s"} on record.`,
                },
              ].filter(Boolean) as Array<{
                dot: string;
                title: string;
                desc: string;
              }>;

              if (signals.length === 0) {
                return (
                  <p className="text-sm text-slate-400 p-3">
                    No active signals right now.
                  </p>
                );
              }

              return signals.map(({ dot, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot}`}
                  />
                  <p className="flex-1 text-sm text-slate-600">
                    <strong className="text-slate-800 font-semibold">
                      {title}
                    </strong>{" "}
                    {desc}
                  </p>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

type Tone = "danger" | "success" | "warning" | "neutral";

interface TabRow {
  key: string;
  cells: string[];
  tone: Tone;
  studentId?: string;
}

const tabMeta: Record<
  string,
  { eyebrow: string; title: string; description: string; columns: string[] }
> = {
  Students: {
    eyebrow: "Student directory",
    title: "Students needing context",
    description:
      "Every student carrying a pending backlog, straight from the records.",
    columns: ["Student", "Backlogs", "Attempts", "Status"],
  },
  Backlogs: {
    eyebrow: "Arrear register",
    title: "Backlog portfolio",
    description:
      "Volume and repeated-failure pressure per course, across all pending arrears.",
    columns: ["Course", "Students", "Average attempts", "Pressure"],
  },
  Patterns: {
    eyebrow: "Academic intelligence",
    title: "Patterns worth acting on",
    description: "Courses where attempt pressure is concentrating.",
    columns: ["Course", "Backlogs", "Peak attempts", "Signal"],
  },
  Interventions: {
    eyebrow: "Human decisions",
    title: "Intervention record",
    description: "Approved recovery plans and who signed them off.",
    columns: ["Student", "Action", "Mentor", "Status"],
  },
  Alerts: {
    eyebrow: "Signals",
    title: "Live alerts",
    description: "Derived from current attempt and promotion thresholds.",
    columns: ["Signal", "Scope", "Detail", "Severity"],
  },
  Examinations: {
    eyebrow: "Examination operations",
    title: "Registrations and eligibility",
    description: "Fee clearance and eligibility for the current window.",
    columns: ["Student", "Course", "Fee", "Eligibility"],
  },
  Registrations: {
    eyebrow: "Examination operations",
    title: "Supplementary registrations",
    description: "Every registration on record for the current window.",
    columns: ["Student", "Course", "Fee", "Eligibility"],
  },
  Eligibility: {
    eyebrow: "Examination operations",
    title: "Eligibility checks",
    description: "Who may sit the next attempt, and who is blocked.",
    columns: ["Student", "Course", "Fee", "Eligibility"],
  },
  "Fee clearance": {
    eyebrow: "Examination operations",
    title: "Outstanding fees",
    description: "Registrations still awaiting payment clearance.",
    columns: ["Student", "Course", "Fee", "Eligibility"],
  },
  "Backlog constraints": {
    eyebrow: "Placement readiness",
    title: "Backlog-constrained students",
    description: "Students whose pending arrears affect placement eligibility.",
    columns: ["Student", "Backlogs", "Attempts", "Status"],
  },
  "My backlogs": {
    eyebrow: "My record",
    title: "My pending backlogs",
    description: "Every subject still open against your enrolment.",
    columns: ["Course", "Attempts made", "Attempts left", "Status"],
  },
};

const statusTone = (status: string): Tone => {
  const value = status.toLowerCase();
  if (
    ["critical", "urgent", "high", "blocked", "debarred", "restricted"].some(
      (key) => value.includes(key),
    )
  )
    return "danger";
  if (
    ["eligible", "cleared", "stable", "approved", "active"].some((key) =>
      value.includes(key),
    )
  )
    return "success";
  if (["review", "watch", "warning", "pending"].some((key) => value.includes(key)))
    return "warning";
  return "neutral";
};

/** Every tab resolves to one real request; nothing here is seeded with mock rows. */
async function loadTab(
  tab: string,
  options: { search: string; status: string; page: number },
): Promise<{ rows: TabRow[]; pageCount: number; total: number }> {
  switch (tab) {
    case "Students":
    case "Backlog constraints": {
      const payload = await api.students({
        search: options.search,
        status: options.status,
        page: options.page,
        pageSize: 15,
      });
      return {
        pageCount: payload.page_count,
        total: payload.total,
        rows: payload.students.map((student) => ({
          key: student.student_id,
          studentId: student.student_id,
          cells: [
            student.student_id,
            `${student.active_backlog_count} pending`,
            `${student.max_attempts_made} max attempts`,
            student.status,
          ],
          tone: statusTone(student.status),
        })),
      };
    }
    case "Backlogs": {
      const { courses } = await api.courses();
      return {
        pageCount: 1,
        total: courses.length,
        rows: courses.map((course) => ({
          key: course.course_code,
          cells: [
            course.course_code,
            `${course.student_count} student${course.student_count === 1 ? "" : "s"}`,
            `${course.average_attempts} average`,
            course.pressure,
          ],
          tone: statusTone(course.pressure),
        })),
      };
    }
    case "Patterns": {
      const { courses } = await api.courses();
      const pressured = courses.filter((course) => course.pressure !== "STABLE");
      return {
        pageCount: 1,
        total: pressured.length,
        rows: pressured.map((course) => ({
          key: course.course_code,
          cells: [
            course.course_code,
            `${course.backlog_count} backlog${course.backlog_count === 1 ? "" : "s"}`,
            `${course.max_attempts_made} peak`,
            course.pressure === "HIGH" ? "Escalate" : "Review",
          ],
          tone: course.pressure === "HIGH" ? "danger" : "warning",
        })),
      };
    }
    case "Interventions": {
      const { interventions } = await api.interventions();
      return {
        pageCount: 1,
        total: interventions.length,
        rows: interventions.map((record, index) => ({
          key: record.id ?? `${record.student_id}-${index}`,
          studentId: record.student_id,
          cells: [
            record.student_id,
            record.recommended_action ?? "Recovery plan",
            record.mentor_id ?? "Unassigned",
            record.human_approved ? "Approved" : "Pending",
          ],
          tone: record.human_approved ? "success" : "warning",
        })),
      };
    }
    case "Alerts": {
      const { alerts } = await api.alerts();
      return {
        pageCount: 1,
        total: alerts.length,
        rows: alerts.map((alert) => ({
          key: alert.id,
          cells: [
            alert.title,
            `${alert.student_ids.length} student${alert.student_ids.length === 1 ? "" : "s"}`,
            alert.detail,
            alert.severity,
          ],
          tone: alert.severity === "CRITICAL" ? "danger" : "warning",
        })),
      };
    }
    case "Examinations":
    case "Registrations":
    case "Eligibility":
    case "Fee clearance": {
      const payload = await api.examRegistrations();
      const rows =
        tab === "Fee clearance"
          ? payload.registrations.filter((row) => !row.fee_cleared)
          : payload.registrations;
      return {
        pageCount: 1,
        total: rows.length,
        rows: rows.map((row, index) => ({
          key: row.id ?? `${row.student_id}-${row.course_code}-${index}`,
          studentId: row.student_id,
          cells: [
            row.student_id,
            row.course_code,
            row.fee_cleared ? "Cleared" : "Pending",
            row.eligibility_status ?? "Unknown",
          ],
          tone: row.fee_cleared
            ? statusTone(row.eligibility_status ?? "")
            : "warning",
        })),
      };
    }
    case "My backlogs": {
      const payload = await api.mySummary();
      const details = payload.deterministic_evaluation.backlog_details;
      return {
        pageCount: 1,
        total: details.length,
        rows: details.map((item) => ({
          key: item.id ?? item.course_code,
          cells: [
            item.course_code,
            `${item.attempts_made} made`,
            `${item.attempts_remaining ?? 0} left`,
            item.status,
          ],
          tone: (item.attempts_remaining ?? 0) <= 0 ? "danger" : statusTone(item.status),
        })),
      };
    }
    default:
      return { rows: [], pageCount: 1, total: 0 };
  }
}

function DashboardTabView({
  activeTab,
  onSelectStudent,
  search,
}: {
  activeTab: string;
  onSelectStudent: (studentId: string) => void;
  search: string;
}) {
  const meta = tabMeta[activeTab];
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    rows: TabRow[];
    total: number;
    pageCount: number;
  } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(
    null,
  );

  const supportsFilters =
    activeTab === "Students" || activeTab === "Backlog constraints";

  // Changing the slice resets paging. Adjusting during render (rather than in
  // an effect) avoids a second render pass with a stale page number.
  const sliceKey = `${activeTab}|${search}|${statusFilter}`;
  const [lastSlice, setLastSlice] = useState(sliceKey);
  let activePage = page;
  if (sliceKey !== lastSlice) {
    setLastSlice(sliceKey);
    setPage(1);
    activePage = 1;
  }

  const requestKey = `${sliceKey}|${activePage}|${reloadToken}`;
  // Derived, so nothing is set synchronously inside the effect. The previous
  // rows stay on screen while a refetch is in flight — no skeleton flash.
  const settled = result?.key === requestKey || failure?.key === requestKey;
  const loading = !settled;
  const error = failure?.key === requestKey ? failure.message : "";
  const rows = result?.key === requestKey ? result.rows : (result?.rows ?? []);
  const total = result?.key === requestKey ? result.total : (result?.total ?? 0);
  const pageCount = result?.pageCount ?? 1;

  useEffect(() => {
    if (!meta) return;
    let active = true;
    loadTab(activeTab, { search, status: statusFilter, page: activePage })
      .then((payload) => {
        if (!active) return;
        setResult({ key: requestKey, ...payload });
      })
      .catch((requestError) => {
        if (!active) return;
        setFailure({
          key: requestKey,
          message:
            requestError instanceof Error
              ? requestError.message
              : "This view could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [meta, activeTab, search, statusFilter, activePage, requestKey]);

  if (!meta) {
    return (
      <div className="flex-1 px-8 py-8">
        <p className="text-sm text-slate-500">
          This section is not available for your role.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
            {meta.eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {meta.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            {meta.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {supportsFilters && (
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600"
            >
              <option value="">All statuses</option>
              <option value="CRITICAL">Critical only</option>
              <option value="REVIEW">Review only</option>
            </select>
          )}
          {!loading && !error && (
            <span className="text-xs font-semibold text-slate-400">
              {total} record{total === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {loading && <TabRowsSkeleton columns={meta.columns.length} />}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Nothing to show here.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {search || statusFilter
              ? "No records match the current filters."
              : "No records exist for this view yet."}
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="rounded-2xl border border-white/70 bg-white/60 shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 gap-4 px-8 py-4 bg-slate-50/70">
              {meta.columns.map((column) => (
                <span
                  key={column}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                  {column}
                </span>
              ))}
            </div>
            {rows.map((row) => {
              const clickable = Boolean(row.studentId);
              return (
                <button
                  key={row.key}
                  type="button"
                  disabled={!clickable}
                  onClick={() => row.studentId && onSelectStudent(row.studentId)}
                  className={`w-full grid grid-cols-4 items-center px-8 py-4 border-t border-slate-100/60 text-left transition-all duration-150 ${
                    clickable
                      ? "hover:bg-indigo-50/60 cursor-pointer group"
                      : "cursor-default"
                  }`}
                >
                  <strong
                    className={`text-sm font-semibold tracking-tight font-mono ${
                      clickable
                        ? "text-indigo-700 group-hover:text-indigo-900"
                        : "text-slate-800"
                    }`}
                  >
                    {row.cells[0]}
                  </strong>
                  <span className="text-sm text-slate-500">{row.cells[1]}</span>
                  <span className="text-sm text-slate-500">{row.cells[2]}</span>
                  <StatusBadge tone={row.tone}>{row.cells[3]}</StatusBadge>
                </button>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:bg-white transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-500">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                className="px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabRowsSkeleton({ columns }: { columns: number }) {
  return (
    <div
      className="rounded-2xl border border-white/70 bg-white/70 shadow-sm overflow-hidden"
      role="status"
      aria-label="Loading records"
    >
      <div className="grid grid-cols-4 gap-4 px-8 py-4 bg-slate-50/70">
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="skeleton-shimmer h-2.5 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-4 gap-4 px-8 py-5 border-t border-slate-100/80"
        >
          <div className="skeleton-shimmer h-3 w-28 rounded-full" />
          <div className="skeleton-shimmer h-3 w-20 rounded-full" />
          <div className="skeleton-shimmer h-3 w-24 rounded-full" />
          <div className="skeleton-shimmer h-6 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function RoleHomeView({
  role,
  onSelectTab,
  dashboard,
  studentSummary,
}: {
  role: UserRole;
  onSelectTab: (tab: string) => void;
  dashboard: DashboardData | null;
  studentSummary: OrchestrationData | null;
}) {
  const evaluation = studentSummary?.deterministic_evaluation;

  // Headline signal, derived from records rather than a fixed string.
  const signal =
    role === "student"
      ? {
          value: String(evaluation?.active_backlog_count ?? 0),
          label: "Active backlogs",
          detail: evaluation
            ? `Limit is ${evaluation.max_allowed_backlogs}`
            : "No record loaded",
          tone:
            (evaluation?.active_backlog_count ?? 0) >
            (evaluation?.max_allowed_backlogs ?? 4)
              ? ("danger" as const)
              : ("success" as const),
        }
      : {
          value: String(dashboard?.critical_case_count ?? 0),
          label: "Critical cases",
          detail: `${dashboard?.student_count ?? 0} students affected`,
          tone:
            (dashboard?.critical_case_count ?? 0) > 0
              ? ("danger" as const)
              : ("success" as const),
        };

  // Progress: a student's headroom under the promotion limit; for staff, the
  // share of affected students who are not yet critical.
  const progress =
    role === "student"
      ? evaluation && evaluation.max_allowed_backlogs > 0
        ? Math.round(
            Math.max(
              0,
              (evaluation.max_allowed_backlogs -
                evaluation.active_backlog_count) /
                evaluation.max_allowed_backlogs,
            ) * 100,
          )
        : 0
      : dashboard && dashboard.student_count > 0
        ? Math.round(
            ((dashboard.student_count - dashboard.critical_case_count) /
              dashboard.student_count) * 100,
          )
        : 0;

  const progressLabel =
    role === "student" ? "headroom to the backlog limit" : "of cases stable";

  // Recommended actions reflect what the data actually shows.
  const nextActions: Array<[string, string]> = [];
  if (role === "student") {
    const pressured = evaluation?.backlog_details.filter(
      (item) => (item.attempts_remaining ?? 0) <= 1,
    ).length;
    if (evaluation?.active_backlog_count)
      nextActions.push([
        `Review your ${evaluation.active_backlog_count} pending backlog${evaluation.active_backlog_count === 1 ? "" : "s"}`,
        "My backlogs",
      ]);
    if (pressured)
      nextActions.push([
        `${pressured} subject${pressured === 1 ? " is" : "s are"} near the attempt limit`,
        "My backlogs",
      ]);
    nextActions.push(["Model a recovery plan in the simulator", "Simulator"]);
  } else {
    if (dashboard?.critical_case_count)
      nextActions.push([
        `Review ${dashboard.critical_case_count} critical student${dashboard.critical_case_count === 1 ? "" : "s"}`,
        role === "exam" ? "Eligibility" : "Students",
      ]);
    if (dashboard?.course_patterns.length)
      nextActions.push([
        `${dashboard.course_patterns[0].course_code} drives the most backlogs`,
        role === "hod" ? "Backlogs" : "Patterns",
      ]);
    if (dashboard?.intervention_count !== undefined)
      nextActions.push([
        `${dashboard.intervention_count} intervention${dashboard.intervention_count === 1 ? "" : "s"} on record`,
        "Interventions",
      ]);
  }

  const visibleActions = nextActions.filter(([, tab]) =>
    (dashboardNavigation[role] as readonly (readonly [string, unknown])[]).some(
      ([label]) => label === tab,
    ),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Current signal
        </p>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-3xl font-bold text-slate-800 tracking-tight">
              {signal.value}
            </span>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {signal.label}
            </p>
          </div>
          <StatusBadge tone={signal.tone}>{signal.detail}</StatusBadge>
        </div>
        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden shadow-inner shadow-black/5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 shadow-md shadow-indigo-500/20"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs font-semibold text-slate-500 mt-2">
          {progress}% {progressLabel}
        </p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Recommended actions
        </p>
        {visibleActions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing needs your attention right now.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleActions.map(([action, tab], index) => (
              <button
                key={action}
                type="button"
                onClick={() => onSelectTab(tab)}
                className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 text-left transition-all duration-150 group"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold group-hover:bg-indigo-200 transition-colors shrink-0">
                  0{index + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
                  {action}
                </span>
                <ArrowUpRight
                  size={15}
                  className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton px-8 pt-8 pb-8"
      aria-label="Loading dashboard"
      role="status"
    >
      <div className="skeleton-shimmer h-64 rounded-2xl bg-indigo-200/60" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {["one", "two", "three", "four"].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-sm"
          >
            <div className="skeleton-shimmer h-2.5 w-24 rounded-full" />
            <div className="skeleton-shimmer h-8 w-20 rounded-lg mt-4" />
            <div className="skeleton-shimmer h-2.5 w-32 rounded-full mt-3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {["one", "two"].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm"
          >
            <div className="skeleton-shimmer h-2.5 w-28 rounded-full" />
            <div className="skeleton-shimmer h-5 w-44 rounded-lg mt-4" />
            <div className="skeleton-shimmer h-3 w-full rounded-full mt-6" />
            <div className="skeleton-shimmer h-3 w-4/5 rounded-full mt-3" />
            <div className="skeleton-shimmer h-3 w-3/5 rounded-full mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div
      className="flex-1 overflow-y-auto px-8 py-8"
      aria-label="Loading section"
      role="status"
    >
      <div className="skeleton-shimmer h-7 w-52 rounded-lg" />
      <div className="skeleton-shimmer h-3 w-80 max-w-full rounded-full mt-3" />
      <div className="rounded-2xl border border-white/70 bg-white/70 shadow-sm overflow-hidden mt-8">
        <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-slate-50/70">
          {["one", "two", "three", "four"].map((item) => (
            <div key={item} className="skeleton-shimmer h-2.5 rounded-full" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-4 px-6 py-5 border-t border-slate-100/80"
          >
            <div className="skeleton-shimmer h-3 w-28 rounded-full" />
            <div className="skeleton-shimmer h-3 w-20 rounded-full" />
            <div className="skeleton-shimmer h-3 w-24 rounded-full" />
            <div className="skeleton-shimmer h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrototypePage({
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
  const [studentSummary, setStudentSummary] = useState<OrchestrationData | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(
    mode === "dashboard",
  );
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [alertCount, setAlertCount] = useState(0);
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>(() => listDemoEvents());
  // Bumped after every backlog mutation so dependent views re-read.
  const [dataVersion, setDataVersion] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const requestSequence = useRef(0);

  useEffect(() => subscribeToDemoEvents(() => setDemoEvents(listDemoEvents())), []);

  // Debounce so a request does not fire on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Live alert count drives both the bell badge and the sidebar badge.
  useEffect(() => {
    if (mode !== "dashboard") return;
    let active = true;
    api
      .alerts()
      .then((payload) => {
        if (active) {
          const localUnread = demoEvents.filter((event) => !event.read).length;
          setAlertCount(payload.unread_count + localUnread);
        }
      })
      .catch(() => {
        if (active) setAlertCount(0);
      });
    return () => {
      active = false;
    };
  }, [mode, activeTab, demoEvents]);

  useEffect(() => {
    if (mode !== "dashboard") return;
    let active = true;

    // Students read their own record; department aggregates are staff-only.
    const load =
      role === "student"
        ? api.mySummary().then((payload) => {
            if (!active) return;
            setStudentSummary(payload);
            setStudentId(payload.target_student_id);
          })
        : api.dashboard().then((payload) => {
            if (!active) return;
            setDashboardData(payload);
            setStudentId(
              (current) => current || payload.students[0]?.student_id || "",
            );
          });

    load
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
  }, [mode, role]);

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
        const payload = await api.orchestration(targetId);
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
    [refreshActivity],
  );

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
  const dashboard = dashboardByRole[role];
  const summaryEvaluation = studentSummary?.deterministic_evaluation;

  // Every tile below is computed from a response; none are literals.
  const liveMetrics: Array<[string, string, string]> =
    role === "student"
      ? summaryEvaluation
        ? [
            [
              "Active backlogs",
              String(summaryEvaluation.active_backlog_count),
              `Limit is ${summaryEvaluation.max_allowed_backlogs}`,
            ],
            [
              "Attempt pressure",
              summaryEvaluation.attempt_pressure,
              `Max ${summaryEvaluation.max_attempts ?? 3} attempts per subject`,
            ],
            [
              "Promotion",
              summaryEvaluation.promotion_status === "ELIGIBLE"
                ? "Eligible"
                : "Review",
              "Against current regulation",
            ],
            [
              "Subjects at risk",
              String(
                summaryEvaluation.backlog_details.filter(
                  (item) => (item.attempts_remaining ?? 0) <= 1,
                ).length,
              ),
              "One attempt or fewer remaining",
            ],
          ]
        : []
      : dashboardData
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

  const dashboardAction: [string, string] =
    role === "student"
      ? ["Model my recovery", "Simulator"]
      : role === "exam"
        ? ["Review registrations", "Registrations"]
        : role === "placement"
          ? ["Review constrained students", "Backlog constraints"]
          : [
              dashboardData?.critical_case_count
                ? `Review ${dashboardData.critical_case_count} critical case${dashboardData.critical_case_count === 1 ? "" : "s"}`
                : "Open the student directory",
              "Students",
            ];
  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setData(null);
    setDispatchLogs([]);
    setError("");
  };

  const handleVoiceCommand = async (command: string) => {
    const normalized = command
      .toLowerCase()
      .replace(/[?!.,'’]/g, " ")
      .replace(/\bwhat\s+s\b/g, "what is")
      .replace(/\bwhats\b/g, "what is")
      .replace(/\bmy\s+backlogs?\b/g, "my backlog")
      .replace(/\bthe\s+simulation\b/g, "simulation")
      .replace(/\s+/g, " ")
      .trim();
    const availableTabs = (dashboardNavigation[role] as readonly (readonly [string, unknown])[]).map(([tab]) => tab);
    const openTab = (tab: string) => {
      if (!availableTabs.includes(tab)) return false;
      handleTabSelect(tab);
      return true;
    };

    if (normalized.includes("scroll down") || normalized.includes("move down")) {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
      return "Command executed. Scrolling down.";
    }
    if (normalized.includes("scroll up") || normalized.includes("move up")) {
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
      return "Command executed. Scrolling up.";
    }
    if (normalized.includes("close modal") || normalized.includes("close window") || normalized === "close") {
      const closeButton = document.querySelector<HTMLButtonElement>("[aria-label='Close scanner'], [aria-label='Close']");
      if (!closeButton) return "There is no open modal to close.";
      closeButton.click();
      return "Command executed. Closing the open panel.";
    }
    if (normalized.includes("enable dark mode") || normalized.includes("turn on dark mode")) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      return "Command executed. Dark mode enabled.";
    }
    if (normalized.includes("disable dark mode") || normalized.includes("turn off dark mode")) {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      return "Command executed. Dark mode disabled.";
    }
    if (normalized.includes("open dashboard") || normalized.includes("go to dashboard") || normalized === "dashboard") {
      openTab("Dashboard");
      return "Command executed. Opening the dashboard.";
    }
    const tabAliases: Array<[string[], string]> = [
      [["backlog", "backlogs", "arrear", "arrears"], role === "student" ? "My backlogs" : role === "hod" ? "Backlogs" : "Backlog constraints"],
      [["simulator", "simulation", "what if", "recovery plan"], "Simulator"],
      [["student", "directory", "students"], "Students"],
      [["intervention", "interventions"], "Interventions"],
      [["pattern", "patterns", "course pattern"], "Patterns"],
      [["alert", "alerts", "notification", "notifications"], "Alerts"],
      [["registration", "registrations", "exam registration"], "Registrations"],
      [["eligibility", "promotion"], "Eligibility"],
      [["fee", "fees", "fee clearance"], "Fee clearance"],
      [["examination", "examinations", "exam"], "Examinations"],
    ];
    const requestedTab = tabAliases.find(([aliases]) => aliases.some((alias) => normalized.includes(alias)))?.[1];
    const isDirectCommand = normalized.includes("show my backlog") || normalized.includes("what is my backlog") || normalized.includes("promotion status") || normalized.includes("show my notifications") || normalized.includes("show notifications") || normalized.includes("run simulation") || normalized.includes("what if") || normalized.includes("register for supplementary");
    if (requestedTab && !isDirectCommand) {
      if (!openTab(requestedTab)) return `${requestedTab} is not available in this view.`;
      return `Command executed. Opening ${requestedTab}.`;
    }
    const clickMatch = normalized.match(/(?:click|press|open)\s+(?:the\s+)?(.+)/);
    if (clickMatch) {
      const target = clickMatch[1].trim();
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
        .find((candidate) => candidate.textContent?.toLowerCase().includes(target));
      if (!button) return `I could not find a button named ${target}.`;
      button.click();
      return `Command executed. Clicking ${target}.`;
    }
    if (normalized.includes("clear form")) {
      document.querySelectorAll<HTMLInputElement>("input:not([type='hidden'])").forEach((input) => {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      return "Command executed. The visible form fields have been cleared.";
    }
    if (normalized.includes("show my backlog") || normalized.includes("what is my backlog") || normalized.includes("tell me my backlog") || normalized.includes("check my backlog")) {
      openTab("My backlogs");
      return "Command executed. Opening your backlog register.";
    }
    if (normalized.includes("register for supplementary") || normalized.includes("register supplementary") || normalized.includes("supplementary exam")) {
      if (!openTab("Registrations")) {
        return "Supplementary registration is not available in this view. Switch to the examination view to continue.";
      }
      return "Command executed. Opening supplementary exam registrations.";
    }
    if (normalized.includes("promotion status")) {
      openTab("Dashboard");
      return `Your promotion status is ${summaryEvaluation?.promotion_status || "being calculated"}.`;
    }
    if (normalized.includes("notification")) {
      openTab("Alerts");
      const latest = demoEvents[0]?.message;
      return latest ? `Opening notifications. Latest alert: ${latest}` : "Opening notifications. There are no new demo alerts.";
    }
    if (normalized.includes("simulation") || normalized.includes("clear my backlog") || normalized.includes("clear backlog")) {
      openTab("Simulator");
      addDemoEvent({
        kind: "simulation_completed",
        studentId: studentId || "21CS112",
        message: "Student simulation opened for recovery planning.",
        sourceRole: "student",
      });
      return "Opening the recovery simulator. Choose how many backlogs to clear.";
    }
    if (normalized.includes("switch to hod") || normalized.includes("switch to hod view") || normalized.includes("open hod view")) {
      if (!onSwitchRole) return "Role switching is not available in this workspace.";
      onSwitchRole?.("hod");
      return "Switching to the HoD command center.";
    }
    return "I did not understand that command. Try dashboard, backlog, simulator, alerts, scroll down, dark mode, or click analyze.";
  };

  return (
    <main
      className={
        mode === "dashboard"
          ? "dashboard-shell flex h-screen overflow-hidden bg-slate-50/50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/60 via-slate-50 to-fuchsia-50/60 font-sans relative isolate"
          : `workspace-page prototype-console`
      }
    >
      {mode === "dashboard" && (
        <DashboardSidebar
          role={role}
          activeTab={activeTab}
          onSelect={handleTabSelect}
          onLogout={onBack}
          alertCount={alertCount}
        />
      )}
      {/* Main content area */}
      <div
        className={
          mode === "dashboard"
            ? "flex-1 flex flex-col min-w-0 overflow-hidden h-full"
            : ""
        }
      >
        {mode === "dashboard" ? (
          <DashboardTopbar
            role={role}
            search={search}
            onSearchChange={setSearch}
            alertCount={alertCount}
            onOpenAlerts={() => handleTabSelect("Alerts")}
          />
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
                    ? "Academic recovery workspace"
                    : role === "hod"
                      ? "HOD command center"
                      : role === "mentor"
                        ? "Faculty workspace"
                        : role === "student"
                          ? "Student recovery"
                          : role === "exam"
                            ? "Examination operations"
                            : "Placement readiness"}
                </span>
                <h1>
                  {mode === "prototype"
                    ? "Backlog monitoring workspace"
                    : dashboard.title}
                </h1>
                <p>
                  {mode === "prototype"
                    ? "Review a student record, understand the contributing factors, and coordinate an approved intervention."
                    : "A role-specific view of academic health, with detailed case review when a student needs support."}
                </p>
              </div>
            </div>
            <div className="workspace-tools">
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
                {loading ? "Reviewing" : "Review student record"}
              </button>
            </div>
          </header>
        )}

        {mode === "dashboard" && activeTab === "Dashboard" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {dashboardLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="dashboard-reveal">
                {/* Hero overview card */}
                <div className="px-8 pt-8 pb-6">
                  <div className="dashboard-hero relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-fuchsia-600/90 backdrop-blur-2xl border border-white/20 p-7 text-white shadow-[0_8px_32px_-12px_rgba(168,85,247,0.4)]">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/40 mix-blend-overlay filter blur-xl" />
                      <div className="absolute bottom-0 left-20 w-40 h-40 rounded-full bg-indigo-300/40 mix-blend-overlay filter blur-xl" />
                    </div>
                    <div className="relative z-10 flex items-start justify-between gap-8">
                      <div className="max-w-xl">
                        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">
                          {dashboard.greeting}
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
                          {dashboard.title}
                        </h1>
                        <p className="text-indigo-100/90 text-sm leading-relaxed mb-8 max-w-md">
                          {dashboard.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleTabSelect(dashboardAction[1])}
                            className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 backdrop-blur-md"
                          >
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shadow-inner shadow-white/20">
                              <Sparkles size={14} className="text-indigo-100" />
                            </span>
                            <span className="flex flex-col text-left">
                              <small className="text-indigo-100/70 text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                                Recommended next step
                              </small>
                              <strong className="text-white text-sm leading-none drop-shadow-sm">
                                {dashboardAction[0]}
                              </strong>
                            </span>
                            <ArrowUpRight
                              size={16}
                              className="ml-1 opacity-70"
                            />
                          </button>
                          {role === "student" && (
                            <button
                              type="button"
                              onClick={() => handleTabSelect("Simulator")}
                              className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 backdrop-blur-md"
                            >
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shadow-inner shadow-white/20">
                                <FlaskConical
                                  size={14}
                                  className="text-indigo-100"
                                />
                              </span>
                              <span className="flex flex-col text-left">
                                <small className="text-indigo-100/70 text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                                  What-if simulator
                                </small>
                                <strong className="text-white text-sm leading-none drop-shadow-sm">
                                  Predict my recovery
                                </strong>
                              </span>
                              <ArrowUpRight
                                size={16}
                                className="ml-1 opacity-70"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner shadow-white/10 text-xs font-semibold px-3 py-1.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                          Live data
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metric cards */}
                {liveMetrics.length > 0 && (
                  <div className="px-8 pb-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {liveMetrics.map(([label, value, detail], idx) => {
                        const tones = [
                          "warning",
                          "danger",
                          "neutral",
                          "success",
                        ] as const;
                        return (
                          <StatCard
                            key={label}
                            label={label}
                            value={value}
                            detail={detail}
                            tone={tones[idx % tones.length]}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {mode === "dashboard" &&
                  activeTab === "Dashboard" &&
                  role === "hod" &&
                  !data &&
                  !loading &&
                  !dashboardLoading &&
                  dashboardData && (
                    <div className="px-8 pb-6">
                      <HodCommandCenter
                        dashboard={dashboardData}
                        onSelectStudent={(selectedStudentId) => {
                          setStudentId(selectedStudentId);
                          setActiveTab("Students");
                          void fetchOrchestration(selectedStudentId);
                        }}
                      />
                    </div>
                  )}

                {mode === "dashboard" &&
                  activeTab === "Dashboard" &&
                  onSwitchRole && (
                    <div className="px-8 pb-8">
                      <RecoveryJourney
                        role={role}
                        onSwitchRole={onSwitchRole}
                        onSelectTab={handleTabSelect}
                      />
                    </div>
                  )}

                {mode === "dashboard" &&
                  activeTab === "Dashboard" &&
                  role !== "hod" &&
                  !data &&
                  !loading && (
                    <div className="px-8 pb-8">
                      <RoleHomeView
                        role={role}
                        onSelectTab={handleTabSelect}
                        dashboard={dashboardData}
                        studentSummary={studentSummary}
                      />
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* What-if recovery simulator. It carries its own fallback case, so it
            renders immediately rather than waiting on the dashboard request. */}
        {mode === "dashboard" && activeTab === "Simulator" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="dashboard-reveal">
              <RecoverySimulator studentId={studentId || undefined} />
            </div>
          </div>
        )}

        {/* My backlogs: the record itself, editable, above the charts it feeds */}
        {mode === "dashboard" && activeTab === "My backlogs" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-8">
            <div className="dashboard-reveal flex flex-col gap-5">
              <BacklogManager
                studentId={role === "student" ? undefined : studentId}
                onChanged={() => {
                  setDataVersion((version) => version + 1);
                  if (role === "student") {
                    addDemoEvent({
                      kind: "supplementary_registered",
                      studentId: studentId || "21CS112",
                      message: `${studentId || "21CS112"} updated the supplementary backlog register.`,
                      sourceRole: "student",
                    });
                  }
                }}
              />
              <StudentBacklogCharts
                key={dataVersion}
                studentId={role === "student" ? undefined : studentId}
              />
            </div>
          </div>
        )}

        {/* Dashboard tab views (non-Dashboard tabs). The tab view owns its own
            request lifecycle, so it is not gated on the dashboard request. */}
        {mode === "dashboard" &&
          activeTab !== "Dashboard" &&
          activeTab !== "Simulator" &&
          activeTab !== "My backlogs" &&
          !data &&
          !loading && (
            <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
              {activeTab === "Alerts" && demoEvents.length > 0 && (
                <div className="mx-8 mt-8 rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Shared session alerts</p>
                  <div className="mt-3 space-y-2">
                    {demoEvents.slice(0, 6).map((event) => (
                      <div key={event.id} className="flex items-start justify-between gap-4 rounded-xl bg-indigo-50/70 px-4 py-3 text-sm text-slate-700">
                        <span>{event.message}</span>
                        <span className="shrink-0 text-[10px] font-bold uppercase text-indigo-500">{event.sourceRole}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DashboardTabView
                activeTab={activeTab}
                search={debouncedSearch}
                onSelectStudent={(selectedStudentId) => {
                  setStudentId(selectedStudentId);
                  void fetchOrchestration(selectedStudentId);
                }}
              />
            </div>
          )}

        {/* Loading the student detail drill-down from a tab row */}
        {mode === "dashboard" &&
          activeTab !== "Dashboard" &&
          activeTab !== "Simulator" &&
          !data &&
          loading && <TabSkeleton />}

        {/* Student detail view (inside dashboard) */}
        {mode === "dashboard" && data && evaluation && recommendation && (
          <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 mb-6 text-white shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/40 filter blur-2xl" />
              </div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">
                    Student case
                  </p>
                  <h1 className="text-2xl font-bold text-white mb-2 font-mono">
                    {data.target_student_id}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        evaluation.promotion_status === "ELIGIBLE"
                          ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30"
                          : "bg-rose-400/20 text-rose-100 border border-rose-400/30"
                      }`}
                    >
                      {evaluation.promotion_status}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        evaluation.attempt_pressure === "CRITICAL"
                          ? "bg-rose-400/20 text-rose-100 border border-rose-400/30"
                          : evaluation.attempt_pressure === "HIGH"
                            ? "bg-amber-400/20 text-amber-100 border border-amber-400/30"
                            : "bg-slate-400/20 text-slate-100 border border-slate-400/30"
                      }`}
                    >
                      {evaluation.attempt_pressure} pressure
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-400/20 text-violet-100 border border-violet-400/30">
                      {recommendation.recoverability_segment}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setData(null);
                    setStudentId("");
                  }}
                  className="text-indigo-200 hover:text-white transition-colors p-1"
                  aria-label="Close detail"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Stat row */}
              <div className="relative z-10 grid grid-cols-3 gap-3 mt-5">
                {[
                  ["Active backlogs", String(evaluation.active_backlog_count)],
                  ["Max allowed", String(evaluation.max_allowed_backlogs)],
                  ["Max attempts", String(evaluation.max_attempts ?? 3)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5"
                  >
                    <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">
                      {label}
                    </p>
                    <p className="text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* AI Reasoning */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">
                  Evidence review
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {recommendation.reasoning}
                </p>
              </div>

              {/* Recommended Actions */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">
                  Recommended Actions
                </p>
                <ol className="flex flex-col gap-2">
                  {recommendation.recommended_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-700 leading-relaxed">
                        {action}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Backlog Details Table */}
            {evaluation.backlog_details.length > 0 && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] overflow-hidden mb-5">
                <div className="px-6 py-4 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    Backlog Details
                  </p>
                  <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                    {evaluation.backlog_details.length} active backlog
                    {evaluation.backlog_details.length !== 1 ? "s" : ""} on
                    record
                  </h3>
                </div>
                <div className="grid grid-cols-4 px-6 py-2.5 bg-slate-50/60 border-b border-slate-100">
                  {["Course", "Attempts Made", "Remaining", "Status"].map(
                    (col) => (
                      <span
                        key={col}
                        className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                      >
                        {col}
                      </span>
                    ),
                  )}
                </div>
                {evaluation.backlog_details.map((b) => (
                  <div
                    key={b.id ?? b.course_code}
                    className="grid grid-cols-4 items-center px-6 py-3.5 border-b border-slate-100/60 hover:bg-indigo-50/30 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-800 font-mono">
                      {b.course_code}
                    </span>
                    <span className="text-sm text-slate-600">
                      {b.attempts_made}
                    </span>
                    <span className="text-sm text-slate-600">
                      {b.attempts_remaining ?? "—"}
                    </span>
                    <StatusBadge
                      tone={
                        (b.attempts_remaining ?? 1) === 0
                          ? "danger"
                          : (b.attempts_remaining ?? 1) === 1
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {b.status}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}

            {/* Approve Intervention */}
            {recommendation.human_approval_required &&
              !approved &&
              (role === "hod" || role === "mentor") && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
                      Human approval required
                    </p>
                    <p className="text-sm text-amber-800 font-semibold">
                      Approve this recovery plan to trigger downstream pipeline
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      This will notify the student, schedule mentor support, and
                      activate remedial resources.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleApprove()}
                    disabled={approving}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shrink-0 shadow-md shadow-amber-500/20"
                  >
                    {approving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {approving ? "Approving..." : "Approve"}
                  </button>
                </div>
              )}

            {approved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Check size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Intervention approved and pipeline deployed
                  </p>
                  <p className="text-xs text-emerald-600">
                    Student notified. Mentor support and remedial resources are
                    now active.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prototype sections (outside the flex-1 div since they are the only content) */}
        {mode === "prototype" && (
          <section className="workspace-toolbar">
            <div className="profile-label">
              <span>
                {mode === "prototype" ? "Student records" : "Quick profiles"}
              </span>
              <small>
                {mode === "prototype"
                  ? "Choose a record to review the recovery context"
                  : "Use a demo record to explore the workflow"}
              </small>
            </div>
            <div className="profile-pills">
              {(
                dashboardData?.students.map((student) => student.student_id) ??
                []
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

        {!data && !loading && mode === "prototype" && (
          <section className="workspace-empty">
            <div className="empty-icon">
              <Gauge size={27} />
            </div>
            <span className="workspace-kicker">Ready for analysis</span>
            <h2>Start with a student signal.</h2>
            <p>
              Choose a demo profile or scan an institutional ID to review an
              evidence-backed recovery plan.
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
            <span className="workspace-kicker">
              Preparing the student review
            </span>
            <h2>Assembling the student context.</h2>
            <p>
              Retrieving results, applying regulations, and evaluating
              recoverability.
            </p>
          </section>
        )}

        {mode === "prototype" && data && evaluation && recommendation && (
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
                label="Backlog headroom"
                value={String(
                  Math.max(
                    0,
                    evaluation.max_allowed_backlogs -
                      evaluation.active_backlog_count,
                  ),
                )}
                detail={`Room before promotion blocks (limit ${evaluation.max_allowed_backlogs})`}
                tone={
                  evaluation.active_backlog_count >=
                  evaluation.max_allowed_backlogs
                    ? "danger"
                    : evaluation.max_allowed_backlogs -
                          evaluation.active_backlog_count <=
                        1
                      ? "warning"
                      : "success"
                }
              />
            </div>
            <div className="workspace-grid">
              <div className="workspace-column">
                <article className="workspace-card agent-checklist-card">
                  <div className="card-heading">
                    <div>
                      <span className="workspace-kicker">
                        <Activity size={12} /> Evidence and recommendation
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
                {data.integration_feeds && (
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
                    <div className="feed-block">
                      <div className="feed-heading">
                        <strong>Agent 34 · Results</strong>
                        <StatusBadge tone="success">Institutional</StatusBadge>
                      </div>
                      {data.integration_feeds.agent_34_results.results.length >
                      0 ? (
                        data.integration_feeds.agent_34_results.results.map(
                          (result) => (
                            <div
                              className="feed-row"
                              key={`${result.course_code}-${result.term}`}
                            >
                              <span>{result.course_code}</span>
                              <small>{result.term}</small>
                              <StatusBadge
                                tone={
                                  result.result === "PASS"
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {result.result}
                              </StatusBadge>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="muted-copy">No result feed available.</p>
                      )}
                    </div>
                    <div className="feed-block">
                      <div className="feed-heading">
                        <strong>Agent 30 · Supplementary</strong>
                        <StatusBadge tone="success">Institutional</StatusBadge>
                      </div>
                      {data.integration_feeds.agent_30_supplementary
                        .supplementary_exams.length > 0 ? (
                        data.integration_feeds.agent_30_supplementary.supplementary_exams.map(
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
                                {exam.fee_cleared
                                  ? "Fee cleared"
                                  : "Fee pending"}{" "}
                                ·{" "}
                                {exam.attendance_eligible
                                  ? "Attendance eligible"
                                  : "Attendance blocked"}
                              </small>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="muted-copy">
                          No supplementary feed available.
                        </p>
                      )}
                    </div>
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
                      {recommendation.recommended_actions.map(
                        (action, index) => (
                          <li key={action}>
                            <b>0{index + 1}</b>
                            {action}
                          </li>
                        ),
                      )}
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
                        if (showApprovalConfirm) {
                          void handleApprove();
                        } else {
                          setShowApprovalConfirm(true);
                        }
                      }}
                      disabled={approving || approved}
                    >
                      {approved ? (
                        <Check size={16} />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
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
                                <strong>{event.agent_id}</strong>{" "}
                                {event.message}
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
      </div>
      <VoiceAssistant onCommand={handleVoiceCommand} />
      {/* end of inner content wrapper */}
    </main>
  );
}
