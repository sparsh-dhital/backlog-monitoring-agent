import { useCallback, useEffect, useRef, useState } from "react";
import type { Html5QrcodeScanner as Html5QrcodeScannerType } from "html5-qrcode";
import {
  Activity,
  Archive,
  ArrowLeft,
  Check,
  CircleAlert,
  CircleUserRound,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Gauge,
  Lightbulb,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import Brand from "../components/Brand";
import type {
  ActivityEvent,
  AssistantAction,
  AssistantReply,
  AssistantTurn,
  DashboardData,
  OrchestrationData,
} from "../types/agent";
import { userRoles, type UserRole } from "../types/roles";
import { api } from "../api";
import { useTheme } from "../theme-context";
import {
  clickControl,
  interpretLocally,
  scrollWorkspace,
  visibleControlLabels,
} from "../shared/voiceCommands";
import { StatCard, StatusBadge } from "../components/WorkspacePrimitives";
import VoiceAssistant from "../components/VoiceAssistant";
import BacklogManager from "../components/BacklogManager";
import RecoverySimulator from "../components/RecoverySimulator";
import StudentBacklogCharts from "../components/StudentBacklogCharts";
import {
  DashboardBottomNav,
  DashboardSidebar,
  DashboardTopbar,
} from "../components/DashboardNav";
import { dashboardNavigation } from "../shared/dashboardNavigation";
import {
  DashboardHome,
  DashboardSkeleton,
  DashboardTabView,
  ProfileView,
  SettingsView,
  TabSkeleton,
} from "../components/DashboardViews";
import { dashboardByRole } from "../shared/dashboardContent";

const SIDEBAR_KEY = "edurecover-sidebar";

/** A saved choice wins; otherwise tablets start with the icon rail. */
function readSidebarCollapsed() {
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved) return saved === "collapsed";
  } catch {
    // Storage unavailable.
  }
  return window.matchMedia("(max-width: 1023px)").matches;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [backlogVersion, setBacklogVersion] = useState(0);
  const sidebarTouched = useRef(false);

  const toggleSidebar = useCallback(() => {
    sidebarTouched.current = true;
    setSidebarCollapsed((current) => !current);
  }, []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const refreshBacklogCharts = useCallback(
    () => setBacklogVersion((version) => version + 1),
    [],
  );

  // Remember an explicit collapse/expand; the tablet default is not a choice.
  useEffect(() => {
    if (!sidebarTouched.current) return;
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "collapsed" : "expanded");
    } catch {
      // Storage unavailable: the choice lasts for this visit.
    }
  }, [sidebarCollapsed]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const requestSequence = useRef(0);
  const assistantHistory = useRef<AssistantTurn[]>([]);
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    if (mode !== "dashboard") return;
    let active = true;
    api
      .dashboard()
      .then((payload) => {
        if (!active) return;
        setDashboardData(payload);
        setStudentId(
          (current) =>
            current ||
            payload.student_id ||
            payload.students[0]?.student_id ||
            "",
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
    let active = true;
    let scanner: Html5QrcodeScannerType | null = null;
    void import("html5-qrcode")
      .then(({ Html5QrcodeScanner, Html5QrcodeSupportedFormats }) => {
        if (!active) return;
        scanner = new Html5QrcodeScanner(
          "barcode-reader",
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.floor(
                Math.min(viewfinderWidth, viewfinderHeight) * 0.72,
              );
              return { width: size, height: size };
            },
            rememberLastUsedCamera: false,
            disableFlip: false,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            videoConstraints: {
              facingMode: { ideal: "environment" },
            },
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
            scanner?.clear().catch(() => undefined);
            setShowScanner(false);
            const scannedId = decodedText.trim().toUpperCase();
            setStudentId(scannedId);
            void fetchOrchestration(scannedId);
          },
          () => undefined,
        );
      })
      .catch((scannerError: unknown) => {
        if (!active) return;
        setError(
          scannerError instanceof Error
            ? scannerError.message
            : "Unable to start the camera scanner. Check camera permissions and use HTTPS or localhost.",
        );
      });
    return () => {
      active = false;
      scanner?.clear().catch(() => undefined);
    };
  }, [fetchOrchestration, showScanner]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
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
  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    setData(null);
    setDispatchLogs([]);
    setError("");
  };

  const availableTabs: string[] = [
    ...dashboardNavigation[role].map(([label]) => label),
    "Profile",
    "Settings",
  ];

  // Carries out one step the assistant planned. Returns what to say instead
  // when the step cannot be done from the current screen.
  const runAssistantAction = (action: AssistantAction): string | null => {
    switch (action.type) {
      case "navigate":
        if (!availableTabs.includes(action.tab)) {
          return `${action.tab} isn't available in this view.`;
        }
        handleTabSelect(action.tab);
        return null;
      case "open_student": {
        const target = String(action.student_id ?? "")
          .replace(/\s+/g, "")
          .toUpperCase();
        if (!target) return "I didn't catch which student to open.";
        if (
          role === "student" &&
          dashboardData?.student_id &&
          target !== dashboardData.student_id
        ) {
          return "You can only open your own record.";
        }
        setStudentId(target);
        void fetchOrchestration(target);
        return null;
      }
      case "close_student":
        if (!data) return "There's no student case open right now.";
        setData(null);
        return null;
      case "theme":
        if (action.mode === "toggle" || (action.mode === "dark") !== darkMode) {
          toggleDarkMode();
        }
        return null;
      case "scroll":
        scrollWorkspace(action.direction);
        return null;
      case "switch_role":
        if (!onSwitchRole) return "Switching roles isn't available here.";
        if (!userRoles.some((item) => item.id === action.role)) {
          return "I don't know that role.";
        }
        if (action.role !== role) onSwitchRole(action.role);
        return null;
      case "click":
        return clickControl(String(action.label ?? ""))
          ? null
          : `I couldn't find ${action.label} on this screen.`;
      case "export_report":
        if (!data) return "Open a student case first, then I can export its report.";
        exportData(action.format);
        return null;
      case "approve_intervention":
        if (role !== "mentor" && role !== "hod") {
          return "Only mentors and heads of department can approve interventions.";
        }
        if (!data) return "Open a student case first, then ask me to approve it.";
        if (approved) return "This intervention is already approved.";
        void handleApprove();
        return null;
      case "logout":
        onBack();
        return null;
      default:
        return null;
    }
  };

  const handleVoiceCommand = async (command: string) => {
    const history = assistantHistory.current.slice(-8);
    let plan: AssistantReply;
    try {
      plan = await api.assistant({
        utterance: command,
        role,
        active_tab: activeTab,
        available_tabs: availableTabs,
        visible_controls: visibleControlLabels(),
        open_case:
          data && evaluation && recommendation
            ? {
                student_id: data.target_student_id,
                promotion_status: evaluation.promotion_status,
                attempt_pressure: evaluation.attempt_pressure,
                active_backlog_count: evaluation.active_backlog_count,
                max_allowed_backlogs: evaluation.max_allowed_backlogs,
                backlogs: evaluation.backlog_details.map(
                  ({ course_code, attempts_made, attempts_remaining, status }) => ({
                    course_code,
                    attempts_made,
                    attempts_remaining,
                    status,
                  }),
                ),
                recoverability_segment: recommendation.recoverability_segment,
                reasoning: recommendation.reasoning,
                recommended_actions: recommendation.recommended_actions,
                intervention_approved: approved,
              }
            : null,
        dark_mode: darkMode,
        history,
      });
    } catch {
      // AI unreachable (offline, missing key, rate limit): still handle the
      // simple requests locally instead of going silent.
      plan = interpretLocally(command, availableTabs);
    }
    const problems = plan.actions
      .map(runAssistantAction)
      .filter((problem): problem is string => Boolean(problem));
    const spoken = problems.length > 0 ? problems.join(" ") : plan.reply;
    assistantHistory.current = [
      ...history,
      { role: "user", text: command },
      { role: "assistant", text: spoken },
    ];
    return spoken;
  };

  return (
    <main
      className={
        mode === "dashboard"
          ? "dashboard-shell flex h-screen overflow-hidden font-sans relative isolate"
          : `workspace-page prototype-console`
      }
    >
      {mode === "dashboard" && (
        <DashboardSidebar
          role={role}
          activeTab={activeTab}
          onSelect={handleTabSelect}
          onLogout={onBack}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
          mobileOpen={mobileNavOpen}
          onCloseMobile={closeMobileNav}
        />
      )}
      {mode === "dashboard" && (
        <DashboardBottomNav
          role={role}
          activeTab={activeTab}
          onSelect={handleTabSelect}
          onOpenMenu={openMobileNav}
          menuOpen={mobileNavOpen}
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
            onProfile={() => handleTabSelect("Profile")}
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

        {mode === "dashboard" && activeTab === "Dashboard" && !data && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {dashboardLoading ? (
              <DashboardSkeleton />
            ) : (
              <DashboardHome
                role={role}
                dashboard={dashboardData}
                busy={loading}
                onSelectTab={handleTabSelect}
                onOpenStudent={(selectedStudentId) => {
                  setStudentId(selectedStudentId);
                  void fetchOrchestration(selectedStudentId);
                }}
                onOpenPriorityStudent={(selectedStudentId) => {
                  setStudentId(selectedStudentId);
                  setActiveTab("Students");
                  void fetchOrchestration(selectedStudentId);
                }}
                onSwitchRole={onSwitchRole}
              />
            )}
          </div>
        )}

        {/* Dashboard tab views (non-Dashboard tabs) */}
        {mode === "dashboard" &&
          activeTab !== "Dashboard" &&
          !data &&
          !loading &&
          !dashboardLoading && (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {activeTab === "Profile" ? (
                <ProfileView role={role} />
              ) : activeTab === "Settings" ? (
                <SettingsView
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={toggleSidebar}
                  onSelectTab={handleTabSelect}
                />
              ) : activeTab === "My backlogs" && role === "student" ? (
                studentId ? (
                  <div className="dash-page">
                    <BacklogManager studentId={studentId} onChanged={refreshBacklogCharts} />
                    <StudentBacklogCharts studentId={studentId} refreshKey={backlogVersion} />
                  </div>
                ) : (
                  <TabSkeleton />
                )
              ) : activeTab === "Recovery simulator" && role === "student" ? (
                <RecoverySimulator studentId={studentId || undefined} />
              ) : (
                <DashboardTabView
                  activeTab={activeTab}
                  dashboard={dashboardData}
                  onSelectStudent={(selectedStudentId) => {
                    setStudentId(selectedStudentId);
                    void fetchOrchestration(selectedStudentId);
                  }}
                />
              )}
            </div>
          )}

        {/* Loading state for tab views */}
        {mode === "dashboard" &&
          activeTab !== "Dashboard" &&
          !data &&
          (loading || dashboardLoading) && (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <TabSkeleton />
            </div>
          )}

        {/* Student detail view (inside dashboard) */}
        {mode === "dashboard" && data && evaluation && recommendation && (
          <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-8">
            {/* Header */}
            <div className="dash-case-hero on-brand relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 mb-6 text-white shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full hero-glow" />
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
              <div className="bg-white/60 rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">
                  Evidence review
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {recommendation.reasoning}
                </p>
              </div>

              {/* Recommended Actions */}
              <div className="bg-white/60 rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
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
              <div className="bg-white/60 rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] overflow-hidden mb-5">
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
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition duration-200 shrink-0 shadow-md shadow-amber-500/20"
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

        {mode === "dashboard" && (
          <VoiceAssistant role={role} onCommand={handleVoiceCommand} />
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
            <CircleAlert size={17} />
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
              <Search size={16} /> Analyze {studentId}
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
                          (result, resultIndex) => (
                            <div
                              className="feed-row"
                              key={`${result.course_code}-${result.term}-${resultIndex}`}
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
                          (exam, examIndex) => (
                            <div
                              className="feed-row feed-stack"
                              key={`${exam.course_code}-${examIndex}`}
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
                        <Lightbulb size={12} /> AI recommendation
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
                <p>
                  Align a clear barcode or QR code inside the frame. Use the
                  rear camera and good lighting for best detection.
                </p>
                <button
                  className="workspace-button primary"
                  onClick={() => {
                    setShowScanner(false);
                    void fetchOrchestration(studentId);
                  }}
                >
                  <Lightbulb size={15} /> Use {studentId}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* end of inner content wrapper */}
    </main>
  );
}
