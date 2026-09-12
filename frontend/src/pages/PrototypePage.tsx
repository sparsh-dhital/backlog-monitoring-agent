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
import { supabaseAuth } from "../supabaseClient";

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
  const roleBadgeColors: Record<string, string> = {
    hod: "bg-violet-100 text-violet-700",
    mentor: "bg-blue-100 text-blue-700",
    student: "bg-emerald-100 text-emerald-700",
    exam: "bg-amber-100 text-amber-700",
    placement: "bg-rose-100 text-rose-700",
  };

  return (
    <aside
      className="flex flex-col w-64 shrink-0 h-full bg-white border-r border-slate-100 shadow-[2px_0_12px_rgba(0,0,0,0.04)] z-20"
      aria-label="Dashboard navigation"
    >
      {/* Brand & Role */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <Brand compact />
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-slate-800 tracking-tight">EduRecover</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 self-start ${roleBadgeColors[role] ?? "bg-slate-100 text-slate-600"}`}>
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
                className={activeTab === label ? "text-indigo-200" : "text-slate-400 group-hover:text-slate-600"}
              />
              <span className="flex-1 text-left">{label}</span>
              {label === "Alerts" && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === label
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  3
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-100 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onSelect("Settings")}
          aria-current={activeTab === "Settings" ? "page" : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold tracking-tight transition-all duration-150 ${
            activeTab === "Settings"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings size={17} className={activeTab === "Settings" ? "text-indigo-200" : "text-slate-400"} />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold tracking-tight text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150"
        >
          <ArrowLeft size={17} className="text-slate-400" />
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
    <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between px-8">
      {/* Search */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 h-10 w-80 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          aria-label="Search dashboard"
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
          placeholder="Search students, courses, or IDs..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-150"
        >
          <Bell size={19} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
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
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">One connected case</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">From signal to recovery</h2>
          <p className="text-sm text-slate-500 mt-1">Each team sees the same student story from its own point of view.</p>
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
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${
                role === stepRole ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600"
              }`}>
                0{index + 1}
              </span>
              <ArrowRight size={14} className={role === stepRole ? "text-indigo-200" : "text-slate-400"} />
            </div>
            <div>
              <p className={`text-sm font-bold leading-tight ${
                role === stepRole ? "text-white" : "text-slate-800"
              }`}>{title}</p>
              <p className={`text-xs mt-0.5 ${
                role === stepRole ? "text-indigo-200" : "text-slate-500"
              }`}>{detail}</p>
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
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">What needs attention now</h2>
        </div>
        <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live academic view
        </span>
      </div>

      {/* Top 3-column grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Bar chart card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend</p>
              <h3 className="text-sm font-bold text-slate-800">Backlogs by course</h3>
            </div>
            <ArrowUpRight size={16} className="text-slate-300" />
          </div>
          <div
            className="flex items-end gap-2 h-24"
            aria-label="Backlogs by course chart"
          >
            {dashboard.course_patterns.slice(0, 6).map((pattern, index) => (
              <div key={index} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
                  style={{ height: `${Math.min(100, pattern.count * 10)}%`, minHeight: 8 }}
                />
                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">{pattern.course_code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Failure patterns card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pattern detection</p>
              <h3 className="text-sm font-bold text-slate-800">Failure patterns</h3>
            </div>
            <Sparkles size={16} className="text-violet-400" />
          </div>
          <div className="flex flex-col gap-3">
            {dashboard.course_patterns.map((pattern) => (
              <div key={pattern.course_code} className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-slate-500 w-14 shrink-0">{pattern.course_code}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pattern.count * 10)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-5 text-right">{pattern.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recoverability card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment</p>
              <h3 className="text-sm font-bold text-slate-800">Recoverability</h3>
            </div>
            <Gauge size={16} className="text-slate-300" />
          </div>
          {/* Donut ring visual */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="54 46" strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a78bfa" strokeWidth="3" strokeDasharray="32 68" strokeDashoffset="-54" strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="14 86" strokeDashoffset="-86" strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-slate-900 leading-none">{dashboard.active_backlog_count}</span>
                <span className="text-[9px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Routine 54%</span>
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> Structured 32%</span>
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Intensive 14%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Priority queue */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority queue</p>
              <h3 className="text-sm font-bold text-slate-800">Requires HOD attention</h3>
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
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                  item.status === "CRITICAL" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                }`}>
                  <CircleAlert size={15} />
                </span>
                <span className="flex-1">
                  <strong className="text-sm font-bold text-slate-800 block font-mono">{item.student_id}</strong>
                  <small className="text-xs text-slate-500">{item.active_backlog_count} active backlogs · {item.status.toLowerCase()}</small>
                </span>
                <ArrowUpRight size={15} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Alerts feed */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent alerts</p>
              <h3 className="text-sm font-bold text-slate-800">Signals worth reviewing</h3>
            </div>
            <Users size={16} className="text-slate-300" />
          </div>
          <div className="flex flex-col gap-3">
            {[
              { dot: "bg-rose-500", title: "Attempt pressure", desc: "14 students have one attempt remaining.", time: "2h ago" },
              { dot: "bg-amber-500", title: "Duration risk", desc: "6 students are nearing maximum duration.", time: "5h ago" },
              { dot: "bg-emerald-500", title: "Recovery milestone", desc: "12 backlogs cleared this term.", time: "Today" },
            ].map(({ dot, title, desc, time }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
                <p className="flex-1 text-sm text-slate-600">
                  <strong className="text-slate-800 font-semibold">{title}</strong>{" "}{desc}
                </p>
                <small className="text-xs text-slate-400 shrink-0 mt-0.5">{time}</small>
              </div>
            ))}
          </div>
        </div>
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
  activeTab,
  onSelectStudent,
  dashboard,
}: {
  activeTab: string;
  onSelectStudent: (studentId: string) => void;
  dashboard: DashboardData | null;
}) {
  const content = tabContent[activeTab as keyof typeof tabContent];

  // Derive live rows from backend data for each tab
  const liveRows: string[][] = (() => {
    if (!dashboard) return [];
    const { students, course_patterns } = dashboard;
    const criticalStudents = students.filter((s) => s.status === "CRITICAL");
    const reviewStudents = students.filter((s) => s.status === "REVIEW");

    switch (activeTab) {
      case "Students":
        return students.map((s) => [
          s.student_id,
          `${s.active_backlog_count} active backlogs`,
          `${s.max_attempts_made} max attempts made`,
          s.status,
        ]);
      case "Backlogs":
        return course_patterns.map((p) => [
          p.course_code,
          `${p.count} student${p.count !== 1 ? "s" : ""} affected`,
          "Pending backlog volume",
          p.count >= 5 ? "High pressure" : p.count >= 3 ? "Watch" : "Stable",
        ]);
      case "Patterns":
        return course_patterns.slice(0, 6).map((p) => [
          p.course_code,
          `${p.count} repeated failures`,
          p.count >= 5 ? "Multiple attempt pressure" : "Pattern detected",
          p.count >= 5 ? "Escalate" : "Review",
        ]);
      case "Interventions":
        return criticalStudents.slice(0, 5).map((s) => [
          s.student_id,
          `${s.active_backlog_count} backlogs · CRITICAL`,
          "Mentor sign-off required",
          "Pending",
        ]).concat(reviewStudents.slice(0, 3).map((s) => [
          s.student_id,
          `${s.active_backlog_count} backlogs · REVIEW`,
          "Structured remedial plan",
          "Active",
        ]));
      case "Alerts":
        return [
          criticalStudents.length > 0
            ? ["Attempt pressure", `${criticalStudents.length} students`, "At or near maximum attempts", "Urgent"]
            : null,
          reviewStudents.length > 0
            ? ["Recovery needed", `${reviewStudents.length} students`, "Under review or intervention", "Review"]
            : null,
          dashboard.student_count > 0
            ? ["Active backlogs", `${dashboard.active_backlog_count} total`, "Current institutional records", "Live"]
            : null,
        ].filter(Boolean) as string[][];
      case "Examinations":
      case "Registrations":
      case "Eligibility":
        return students.slice(0, 6).map((s) => [
          s.student_id,
          `${s.active_backlog_count} backlogs`,
          s.status === "CRITICAL" ? "Eligibility at risk" : "Eligible to register",
          s.status === "CRITICAL" ? "Review" : "Eligible",
        ]);
      default:
        return [];
    }
  })();

  const rows = liveRows.length > 0 ? liveRows : (content?.rows as unknown as string[][] ?? []);
  const canOpenStudent = activeTab === "Students" || activeTab === "Interventions";

  const statusTone = (status: string): "danger" | "success" | "warning" | "neutral" => {
    const s = status.toLowerCase();
    if (["critical", "urgent", "action", "escalate", "restricted"].some((k) => s.includes(k))) return "danger";
    if (["live", "eligible", "ready", "positive", "clear"].some((k) => s.includes(k))) return "success";
    if (["review", "watch", "monitor", "pending", "high pressure", "warning"].some((k) => s.includes(k))) return "warning";
    return "neutral";
  };

  // Derive tab-level summary stats
  const summaryStats: Array<[string, string]> = (() => {
    if (!dashboard) return [];
    switch (activeTab) {
      case "Students": return [["Total", String(dashboard.student_count)], ["Critical", String(dashboard.critical_case_count)], ["Interventions", String(dashboard.intervention_count)]];
      case "Backlogs": return [["Active backlogs", String(dashboard.active_backlog_count)], ["Courses affected", String(dashboard.course_patterns.length)]];
      case "Patterns": return [["Courses flagged", String(dashboard.course_patterns.length)], ["Critical students", String(dashboard.critical_case_count)]];
      case "Interventions": return [["Total interventions", String(dashboard.intervention_count)], ["Critical cases", String(dashboard.critical_case_count)]];
      case "Alerts": return [["Students affected", String(dashboard.student_count)], ["Critical", String(dashboard.critical_case_count)]];
      default: return [["Records", String(rows.length)]];
    }
  })();

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Settings size={24} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Workspace settings</h2>
          <p className="text-slate-500 text-sm">Profile, notification, and institution preferences will live here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Gradient page header */}
      <div className="px-8 pt-7 pb-5 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/40 filter blur-2xl" />
          <div className="absolute bottom-0 left-16 w-32 h-32 rounded-full bg-indigo-300/40 filter blur-2xl" />
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5">{content.eyebrow}</p>
            <h1 className="text-xl font-bold text-white tracking-tight mb-1">{content.title}</h1>
            <p className="text-sm text-indigo-100/80 max-w-lg leading-relaxed">{content.description}</p>
          </div>
          <span className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {liveRows.length > 0 ? "Live data" : "Reference view"}
          </span>
        </div>
        {/* Stat pills */}
        {summaryStats.length > 0 && (
          <div className="relative z-10 flex items-center gap-3 mt-4">
            {summaryStats.map(([label, value]) => (
              <div key={label} className="group flex flex-col bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-xl px-4 py-2 backdrop-blur-md shadow-inner shadow-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 cursor-default">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300/80 group-hover:bg-white transition-colors"></span>
                  <p className="text-[9px] font-bold text-indigo-200 group-hover:text-indigo-100 uppercase tracking-widest transition-colors">{label}</p>
                </div>
                <p className="text-lg font-bold text-white leading-tight">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Table header */}
        <div className="grid grid-cols-4 px-8 py-3 bg-white/60 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
          {["Signal", "Scope", "Context", "Status"].map((col) => (
            <span key={col} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{col}</span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
              <Activity size={22} className="text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">No records available</h3>
            <p className="text-xs text-slate-400 max-w-xs">This view will populate when data is available from the backend.</p>
          </div>
        ) : (
          rows.map((row, idx) => (
            <button
              key={`${row[0]}-${idx}`}
              type="button"
              onClick={() => canOpenStudent && onSelectStudent(row[0])}
              disabled={!canOpenStudent}
              className={`w-full grid grid-cols-4 items-center px-8 py-4 border-b border-slate-100/60 text-left transition-all duration-150 ${
                canOpenStudent
                  ? "hover:bg-indigo-50/60 cursor-pointer group"
                  : "cursor-default hover:bg-slate-50/40"
              }`}
            >
              <strong className={`text-sm font-semibold tracking-tight ${
                canOpenStudent ? "text-indigo-700 group-hover:text-indigo-900" : "text-slate-800"
              } font-mono`}>{row[0]}</strong>
              <span className="text-sm text-slate-500">{row[1]}</span>
              <span className="text-sm text-slate-500">{row[2]}</span>
              <StatusBadge tone={statusTone(row[3])}>{row[3]}</StatusBadge>
            </button>
          ))
        )}
      </div>
    </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Current signal card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Current signal</p>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-3xl font-bold text-slate-800 tracking-tight">{dashboard.metrics[0][1]}</span>
            <p className="text-sm font-semibold text-slate-600 mt-1">{dashboard.metrics[0][0]}</p>
          </div>
          <StatusBadge tone="success">{dashboard.metrics[0][2]}</StatusBadge>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden shadow-inner shadow-black/5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 shadow-md shadow-indigo-500/20"
            style={{ width: role === "student" ? "78%" : "64%" }}
          />
        </div>
        <p className="text-xs font-semibold text-slate-500 mt-2">{role === "student" ? "78%" : "64%"} complete</p>
      </div>

      {/* Recommended actions card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recommended actions</p>
        <div className="flex flex-col gap-2">
          {nextActions.map(([action, tab], index) => (
            <button
              key={action}
              type="button"
              onClick={() => onSelectTab(tab)}
              className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 text-left transition-all duration-150 group"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold group-hover:bg-indigo-200 transition-colors shrink-0">
                0{index + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">{action}</span>
              <ArrowUpRight size={15} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
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
  const [dashboardLoading, setDashboardLoading] = useState(
    mode === "dashboard",
  );
  const [activeTab, setActiveTab] = useState("Dashboard");
  const logsEndRef = useRef<HTMLDivElement>(null);
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

  return (
    <main
      className={mode === "dashboard"
        ? "flex h-screen overflow-hidden bg-slate-50/50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/60 via-slate-50 to-fuchsia-50/60 font-sans relative isolate"
        : `workspace-page prototype-console`}
    >
      {mode === "dashboard" && (
        <>
          <div className="absolute top-0 -left-12 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob -z-10" />
          <div className="absolute top-0 -right-12 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 -z-10" />
          <div className="absolute -bottom-16 left-32 w-96 h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 -z-10" />
        </>
      )}
      {mode === "dashboard" && (
        <DashboardSidebar
          role={role}
          activeTab={activeTab}
          onSelect={handleTabSelect}
          onLogout={onBack}
        />
      )}
      {/* Main content area */}
      <div className={mode === "dashboard" ? "flex-1 flex flex-col min-w-0 overflow-hidden h-full" : ""}>
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
                  ? "Backlog Monitoring Agent"
                  : dashboard.title}
              </h1>
              <p>
                {mode === "prototype"
                  ? "Run the complete Agent 35 flow against a student record, inspect the reasoning, and deploy an approved intervention."
                  : "A role-specific view of academic health, with Agent 35 available when a case needs deeper review."}
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
              {loading ? "Analyzing" : "Run orchestrator"}
            </button>
          </div>
        </header>
      )}

      {mode === "dashboard" && activeTab === "Dashboard" && (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Hero overview card */}
          <div className="px-8 pt-8 pb-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-fuchsia-600/90 backdrop-blur-2xl border border-white/20 p-7 text-white shadow-[0_8px_32px_-12px_rgba(168,85,247,0.4)]">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/40 mix-blend-overlay filter blur-xl" />
                <div className="absolute bottom-0 left-20 w-40 h-40 rounded-full bg-indigo-300/40 mix-blend-overlay filter blur-xl" />
              </div>
              <div className="relative z-10 flex items-start justify-between gap-8">
                <div className="max-w-xl">
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">{dashboard.greeting}</p>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-3">{dashboard.title}</h1>
                  <p className="text-indigo-100/90 text-sm leading-relaxed mb-8 max-w-md">{dashboard.description}</p>
                  <button
                    type="button"
                    onClick={() => handleTabSelect(dashboardAction[1])}
                    className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 backdrop-blur-md"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shadow-inner shadow-white/20">
                      <Sparkles size={14} className="text-indigo-100" />
                    </span>
                    <span className="flex flex-col text-left">
                      <small className="text-indigo-100/70 text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">Recommended next step</small>
                      <strong className="text-white text-sm leading-none drop-shadow-sm">{dashboardAction[0]}</strong>
                    </span>
                    <ArrowUpRight size={16} className="ml-1 opacity-70" />
                  </button>
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
                  const tones = ["warning", "danger", "neutral", "success"] as const;
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

          {mode === "dashboard" && activeTab === "Dashboard" && onSwitchRole && (
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
                <RoleHomeView role={role} onSelectTab={handleTabSelect} />
              </div>
            )}
        </div>
      )}

      {/* Dashboard tab views (non-Dashboard tabs) */}
      {mode === "dashboard" &&
        activeTab !== "Dashboard" &&
        !data &&
        !loading &&
        !dashboardLoading && (
          <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
            <DashboardTabView
              activeTab={activeTab}
              dashboard={dashboardData}
              onSelectStudent={(selectedStudentId) => {
                setStudentId(selectedStudentId);
                void fetchOrchestration(selectedStudentId);
              }}
            />
          </div>
        )}

      {/* Loading state for tab views */}
      {mode === "dashboard" && activeTab !== "Dashboard" && !data && (loading || dashboardLoading) && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <RefreshCw size={18} className="text-indigo-500 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Loading {activeTab.toLowerCase()}...</p>
          </div>
        </div>
      )}

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
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Student case</p>
                <h1 className="text-2xl font-bold text-white mb-2 font-mono">{data.target_student_id}</h1>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    evaluation.promotion_status === "ELIGIBLE"
                      ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30"
                      : "bg-rose-400/20 text-rose-100 border border-rose-400/30"
                  }`}>
                    {evaluation.promotion_status}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    evaluation.attempt_pressure === "CRITICAL"
                      ? "bg-rose-400/20 text-rose-100 border border-rose-400/30"
                      : evaluation.attempt_pressure === "HIGH"
                        ? "bg-amber-400/20 text-amber-100 border border-amber-400/30"
                        : "bg-slate-400/20 text-slate-100 border border-slate-400/30"
                  }`}>
                    {evaluation.attempt_pressure} pressure
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-400/20 text-violet-100 border border-violet-400/30">
                    {recommendation.recoverability_segment}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setData(null); setStudentId(""); }}
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
                <div key={label} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5">
                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* AI Reasoning */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">AI Analysis · Agent 35</p>
              <p className="text-sm text-slate-700 leading-relaxed">{recommendation.reasoning}</p>
            </div>

            {/* Recommended Actions */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Recommended Actions</p>
              <ol className="flex flex-col gap-2">
                {recommendation.recommended_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                    <span className="text-sm text-slate-700 leading-relaxed">{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Backlog Details Table */}
          {evaluation.backlog_details.length > 0 && (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] overflow-hidden mb-5">
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Backlog Details</p>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">{evaluation.backlog_details.length} active backlog{evaluation.backlog_details.length !== 1 ? "s" : ""} on record</h3>
              </div>
              <div className="grid grid-cols-4 px-6 py-2.5 bg-slate-50/60 border-b border-slate-100">
                {["Course", "Attempts Made", "Remaining", "Status"].map((col) => (
                  <span key={col} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{col}</span>
                ))}
              </div>
              {evaluation.backlog_details.map((b) => (
                <div key={b.id ?? b.course_code} className="grid grid-cols-4 items-center px-6 py-3.5 border-b border-slate-100/60 hover:bg-indigo-50/30 transition-colors">
                  <span className="text-sm font-semibold text-slate-800 font-mono">{b.course_code}</span>
                  <span className="text-sm text-slate-600">{b.attempts_made}</span>
                  <span className="text-sm text-slate-600">{b.attempts_remaining ?? "—"}</span>
                  <StatusBadge tone={
                    (b.attempts_remaining ?? 1) === 0 ? "danger" :
                    (b.attempts_remaining ?? 1) === 1 ? "warning" : "neutral"
                  }>{b.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}

          {/* Approve Intervention */}
          {recommendation.human_approval_required && !approved && (role === "hod" || role === "mentor") && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Human approval required</p>
                <p className="text-sm text-amber-800 font-semibold">Approve this recovery plan to trigger downstream pipeline</p>
                <p className="text-xs text-amber-600 mt-1">This will notify the student, schedule mentor support, and activate remedial resources.</p>
              </div>
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={approving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shrink-0 shadow-md shadow-amber-500/20"
              >
                {approving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
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
                <p className="text-sm font-bold text-emerald-800">Intervention approved and pipeline deployed</p>
                <p className="text-xs text-emerald-600">Student notified. Mentor support and remedial resources are now active.</p>
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
              {mode === "prototype"
                ? "Agent 35 test profiles"
                : "Quick profiles"}
            </span>
            <small>
              {mode === "prototype"
                ? "Pick a record to exercise the orchestration flow"
                : "Use a demo record to explore the workflow"}
            </small>
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

      {!data && !loading && mode === "prototype" && (
        <section className="workspace-empty">
          <div className="empty-icon">
            <Gauge size={27} />
          </div>
          <span className="workspace-kicker">Ready for analysis</span>
          <h2>Start with a student signal.</h2>
          <p>
            Choose a demo profile or scan an institutional ID to run Agent 35
            and build an evidence-backed recovery plan.
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
                                result.result === "PASS" ? "success" : "danger"
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
                              {exam.fee_cleared ? "Fee cleared" : "Fee pending"}{" "}
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
                      if (showApprovalConfirm) {
                        void handleApprove();
                      } else {
                        setShowApprovalConfirm(true);
                      }
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
      </div>{/* end of inner content wrapper */}
    </main>
  );
}
