import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Archive,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Gauge,
  GraduationCap,
  HandHelping,
  KeyRound,
  ListChecks,
  Mail,
  Mic,
  Moon,
  PanelLeftClose,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  TriangleAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { DashboardData } from "../types/agent";
import { userRoles, type UserRole } from "../types/roles";
import { supabaseAuth } from "../supabaseClient";
import { readOtpSession } from "../shared/authSession";
import { useTheme } from "../theme-context";
import {
  dashboardActions,
  dashboardByRole,
  journeySteps,
  roleNextActions,
  tabContent,
} from "../shared/dashboardContent";
import { dashboardNavigation, roleBadgeClasses } from "../shared/dashboardNavigation";
import DepartmentCharts from "./DepartmentCharts";
import { Avatar, SectionHeading, StatCard, StatusBadge, type Tone } from "./WorkspacePrimitives";
import "../styles/dashboard-views.css";

function describeToday() {
  const now = new Date();
  const hour = now.getHours();
  return {
    partOfDay: hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening",
    date: now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
  };
}

const share = (part: number, total: number) => (total > 0 ? `${(part / total) * 100}%` : "0%");

function PanelHeader({
  eyebrow,
  title,
  icon: Icon,
  action,
}: {
  eyebrow: string;
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="dash-panel-head">
      <div className="min-w-0">
        <p className="dash-eyebrow">{eyebrow}</p>
        <h3 className="dash-panel-title">{title}</h3>
      </div>
      {action ??
        (Icon && (
          <span className="dash-panel-icon">
            <Icon size={16} aria-hidden="true" />
          </span>
        ))}
    </div>
  );
}

type Metric = { label: string; value: string; detail: string; tone: Tone; icon: LucideIcon };

function buildMetrics(role: UserRole, dashboard: DashboardData | null): Metric[] {
  if (!dashboard) return [];
  if (role === "student") {
    // A student's dashboard is scoped to their own record.
    const record = dashboard.students[0];
    const attempts = record?.max_attempts_made ?? 0;
    return [
      { label: "Pending backlogs", value: String(dashboard.active_backlog_count), detail: "Subjects still to clear", tone: "warning", icon: Archive },
      { label: "Highest attempts", value: String(attempts), detail: "Most attempts on one subject", tone: attempts >= 3 ? "danger" : attempts === 2 ? "warning" : "neutral", icon: TriangleAlert },
      { label: "Case status", value: record ? (record.status === "CRITICAL" ? "Critical" : "In review") : "Clear", detail: "From the rule engine", tone: record ? (record.status === "CRITICAL" ? "danger" : "neutral") : "success", icon: ShieldCheck },
      { label: "Courses affected", value: String(dashboard.course_patterns.length), detail: "Across your record", tone: "success", icon: BookOpen },
    ];
  }
  return [
    { label: "Active backlogs", value: String(dashboard.active_backlog_count), detail: "Current institutional records", tone: "warning", icon: Archive },
    { label: "Students affected", value: String(dashboard.student_count), detail: "Students with pending backlogs", tone: "danger", icon: UsersRound },
    { label: "Critical cases", value: String(dashboard.critical_case_count), detail: "Requires human review", tone: "neutral", icon: CircleAlert },
    { label: "Interventions", value: String(dashboard.intervention_count), detail: "Recorded in the system", tone: "success", icon: HandHelping },
  ];
}

/* ── Dashboard home ─────────────────────────────────────────────── */

export function DashboardHome({
  role,
  dashboard,
  busy,
  onSelectTab,
  onOpenStudent,
  onOpenPriorityStudent,
  onSwitchRole,
}: {
  role: UserRole;
  dashboard: DashboardData | null;
  /** A student case is loading. */
  busy: boolean;
  onSelectTab: (tab: string) => void;
  onOpenStudent: (studentId: string) => void;
  onOpenPriorityStudent: (studentId: string) => void;
  onSwitchRole?: (role: UserRole) => void;
}) {
  const [today] = useState(describeToday);
  const content = dashboardByRole[role];
  // A signed-in student is greeted by their own record, not the demo name.
  const greetingName = role === "student" && dashboard?.student_id ? dashboard.student_id : content.greetingName;
  const [actionLabel, actionTab] = dashboardActions[role];
  const roleLabel = userRoles.find((item) => item.id === role)?.label ?? role;
  const students = dashboard?.students ?? [];
  const critical = students.filter((student) => student.status === "CRITICAL").length;
  const review = students.length - critical;
  const topCourse = dashboard?.course_patterns[0];
  const metrics = buildMetrics(role, dashboard);
  const hasStudentsTab = dashboardNavigation[role].some(([label]) => label === "Students");
  const ownCase = role === "student" ? students[0] : undefined;

  return (
    <div className="dash-page dashboard-reveal">
      <section className="dashboard-hero on-brand dash-hero" aria-label="Overview">
        <div className="dash-hero-glow" aria-hidden="true" />
        <div className="dash-hero-grid">
          <div className="min-w-0">
            <div className="dash-hero-chips">
              <span className="dash-hero-chip">
                <Sparkles size={13} aria-hidden="true" />
                {roleLabel} workspace
              </span>
              <span className="dash-hero-chip">
                <CalendarDays size={13} aria-hidden="true" />
                {today.date}
              </span>
            </div>
            <p className="dash-hero-greeting">
              {today.partOfDay}, {greetingName}.
            </p>
            <h1 className="dash-hero-title">{content.title}</h1>
            <p className="dash-hero-copy">{content.description}</p>
            <div className="dash-hero-actions">
              <button type="button" className="dash-hero-cta" onClick={() => onSelectTab(actionTab)}>
                <span className="dash-hero-cta-icon">
                  <Search size={15} aria-hidden="true" />
                </span>
                <span className="flex flex-col text-left">
                  <small>Recommended next step</small>
                  <strong>{actionLabel}</strong>
                </span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
              <span className="dash-hero-live">
                <i aria-hidden="true" />
                Live data
              </span>
            </div>
          </div>

          <aside className="dash-glance" aria-label="Focus now">
            <p className="dash-glance-title">Focus now</p>
            <div className="dash-glance-row">
              <span className="dash-glance-icon">
                <ShieldAlert size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                {role === "student" ? (
                  <>
                    <strong>
                      {ownCase ? (ownCase.status === "CRITICAL" ? "Your case is critical" : "Your case is in review") : "No open case"}
                    </strong>
                    <small>Status from the regulation rule engine</small>
                  </>
                ) : (
                  <>
                    <strong>
                      {critical} critical · {review} in review
                    </strong>
                    <small>Students with pending backlogs</small>
                  </>
                )}
              </div>
            </div>
            {role !== "student" && students.length > 0 && (
              <div
                className="dash-glance-bar"
                role="img"
                aria-label={`${critical} critical and ${review} in review`}
              >
                {critical > 0 && <span className="is-critical" style={{ width: share(critical, students.length) }} />}
                {review > 0 && <span className="is-review" style={{ width: share(review, students.length) }} />}
              </div>
            )}
            <div className="dash-glance-row">
              <span className="dash-glance-icon">
                <BookOpen size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <strong>{topCourse ? topCourse.course_code : "No pending courses"}</strong>
                <small>
                  {topCourse
                    ? `Most affected course · ${topCourse.count} ${role === "student" ? "record" : "student"}${topCourse.count === 1 ? "" : "s"}`
                    : "Nothing is waiting on a course right now"}
                </small>
              </div>
            </div>
            <div className="dash-glance-row">
              <span className="dash-glance-icon">
                <Mic size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <strong>Ask the assistant</strong>
                <small>Try “which students need attention?”</small>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {metrics.length > 0 && (
        <div className="dash-stat-grid">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
              icon={<metric.icon size={18} aria-hidden="true" />}
            />
          ))}
        </div>
      )}

      {role !== "hod" && <RoleHomeView role={role} dashboard={dashboard} onSelectTab={onSelectTab} />}

      {students.length > 0 && (
        <section className="dash-card dash-section">
          <SectionHeading
            eyebrow="Quick access"
            title={role === "student" ? "Your recovery case" : "Students with open backlogs"}
            description="Open a case to see the evidence and the recommended next step."
            action={
              hasStudentsTab ? (
                <button type="button" className="dash-link" onClick={() => onSelectTab("Students")}>
                  View all <ArrowRight size={14} aria-hidden="true" />
                </button>
              ) : (
                <span className="dash-chip">Demo data</span>
              )
            }
          />
          <div className="dash-student-grid">
            {students.slice(0, 6).map((student) => {
              const isCritical = student.status === "CRITICAL";
              return (
                <button
                  key={student.student_id}
                  type="button"
                  className="dash-student-card"
                  disabled={busy}
                  onClick={() => onOpenStudent(student.student_id)}
                >
                  <Avatar label={student.student_id} tone={isCritical ? "danger" : "brand"} />
                  <span className="min-w-0 flex-1">
                    <strong className="font-mono">{student.student_id}</strong>
                    <small>
                      {student.active_backlog_count} backlog{student.active_backlog_count === 1 ? "" : "s"} · {student.max_attempts_made} max attempts
                    </small>
                  </span>
                  <StatusBadge tone={isCritical ? "danger" : "warning"}>
                    {isCritical ? "Critical" : "Review"}
                  </StatusBadge>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {role === "hod" && dashboard && (
        <HodCommandCenter dashboard={dashboard} onSelectStudent={onOpenPriorityStudent} />
      )}

      {role !== "student" && dashboard && <DepartmentCharts dashboard={dashboard} />}

      {onSwitchRole && (
        <RecoveryJourney role={role} onSwitchRole={onSwitchRole} onSelectTab={onSelectTab} />
      )}
    </div>
  );
}

/* ── HOD command center ─────────────────────────────────────────── */

function HodCommandCenter({
  dashboard,
  onSelectStudent,
}: {
  dashboard: DashboardData;
  onSelectStudent: (studentId: string) => void;
}) {
  // Scale the mini charts to the busiest course, not a fixed ten students.
  const maxPatternCount = Math.max(1, ...dashboard.course_patterns.map((pattern) => pattern.count));
  const alerts = [
    { tone: "#f43f5e", title: "Attempt pressure", desc: "14 students have one attempt remaining.", time: "2h ago" },
    { tone: "#f59e0b", title: "Duration risk", desc: "6 students are nearing maximum duration.", time: "5h ago" },
    { tone: "#10b981", title: "Recovery milestone", desc: "12 backlogs cleared this term.", time: "Today" },
  ];

  return (
    <section className="dash-section-stack" aria-label="Academic command center">
      <SectionHeading
        eyebrow="Department signal map"
        icon={BarChart3}
        title="What needs attention now"
        action={
          <span className="dash-chip is-live">
            <i aria-hidden="true" />
            Live academic view
          </span>
        }
      />

      <div className="dash-grid-3">
        <article className="dash-card dash-panel">
          <PanelHeader eyebrow="Trend" title="Backlogs by course" icon={Activity} />
          {dashboard.course_patterns.length === 0 ? (
            <p className="dash-muted">No pending backlogs recorded.</p>
          ) : (
            <div className="dash-mini-bars" aria-label="Backlogs by course chart">
              {dashboard.course_patterns.slice(0, 6).map((pattern) => (
                <div key={pattern.course_code} className="dash-mini-bar">
                  <span className="dash-mini-bar-value">{pattern.count}</span>
                  <div className="dash-mini-bar-track">
                    <div
                      className="dash-mini-bar-fill"
                      style={{ height: `${(pattern.count / maxPatternCount) * 100}%` }}
                    />
                  </div>
                  <span className="dash-mini-bar-label">{pattern.course_code}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dash-card dash-panel">
          <PanelHeader eyebrow="Pattern detection" title="Failure patterns" icon={Search} />
          {dashboard.course_patterns.length === 0 ? (
            <p className="dash-muted">No repeated failures detected.</p>
          ) : (
            <div className="dash-pattern-list">
              {dashboard.course_patterns.slice(0, 6).map((pattern) => (
                <div key={pattern.course_code} className="dash-pattern">
                  <code>{pattern.course_code}</code>
                  <span className="dash-pattern-track">
                    <span
                      className="dash-pattern-fill"
                      style={{ width: `${(pattern.count / maxPatternCount) * 100}%` }}
                    />
                  </span>
                  <strong>{pattern.count}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dash-card dash-panel">
          <PanelHeader eyebrow="Assessment" title="Recoverability" icon={Gauge} />
          <div className="dash-ring-row">
            <div className="dash-ring-wrap">
              <svg viewBox="0 0 36 36" className="dash-ring-svg" role="img" aria-label="Recoverability mix">
                <circle cx="18" cy="18" r="15.9" fill="none" className="dash-ring-base" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="54 46" strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a78bfa" strokeWidth="3" strokeDasharray="32 68" strokeDashoffset="-54" strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="14 86" strokeDashoffset="-86" strokeLinecap="round" />
              </svg>
              <div className="dash-ring-center">
                <strong>{dashboard.active_backlog_count}</strong>
                <small>Total</small>
              </div>
            </div>
            <ul className="dash-legend">
              <li><i style={{ background: "#6366f1" }} /> Routine <b>54%</b></li>
              <li><i style={{ background: "#a78bfa" }} /> Structured <b>32%</b></li>
              <li><i style={{ background: "#f97316" }} /> Intensive <b>14%</b></li>
            </ul>
          </div>
        </article>
      </div>

      <div className="dash-grid-2">
        <article className="dash-card dash-panel">
          <PanelHeader eyebrow="Priority queue" title="Requires HOD attention" icon={CircleAlert} />
          <div className="dash-list">
            {dashboard.students.length === 0 && <p className="dash-muted">No students are waiting on a decision.</p>}
            {dashboard.students.map((item) => {
              const isCritical = item.status === "CRITICAL";
              return (
                <button key={item.student_id} type="button" className="dash-list-row" onClick={() => onSelectStudent(item.student_id)}>
                  <Avatar label={item.student_id} tone={isCritical ? "danger" : "neutral"} size="sm" />
                  <span className="min-w-0 flex-1">
                    <strong className="font-mono">{item.student_id}</strong>
                    <small>
                      {item.active_backlog_count} active backlog{item.active_backlog_count === 1 ? "" : "s"}
                    </small>
                  </span>
                  <StatusBadge tone={isCritical ? "danger" : "warning"}>{isCritical ? "Critical" : "Review"}</StatusBadge>
                  <ArrowUpRight size={15} className="dash-row-arrow" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </article>

        <article className="dash-card dash-panel">
          <PanelHeader eyebrow="Recent alerts" title="Signals worth reviewing" icon={TriangleAlert} />
          <div className="dash-list">
            {alerts.map((alert) => (
              <div key={alert.title} className="dash-list-row dash-alert-row" style={{ "--alert-tone": alert.tone } as CSSProperties}>
                <span className="min-w-0 flex-1">
                  <strong>{alert.title}</strong>
                  <small>{alert.desc}</small>
                </span>
                <small className="dash-alert-time">{alert.time}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

/* ── Recovery journey ───────────────────────────────────────────── */

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
    <section className="dash-card dash-section" aria-label="Academic recovery journey">
      <SectionHeading
        eyebrow="One connected case"
        title="From signal to recovery"
        description="Each team sees the same student story from its own point of view."
        action={
          <span className="dash-chip is-live">
            <i aria-hidden="true" />
            Shared case context
          </span>
        }
      />
      <ol className="dash-journey">
        {journeySteps.map(([stepRole, title, detail, tab], index) => {
          const active = role === stepRole;
          return (
            <li key={stepRole} className={`dash-journey-step${active ? " is-active" : ""}`}>
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                onClick={() => {
                  if (active) onSelectTab(tab);
                  else onSwitchRole(stepRole);
                }}
              >
                <span className="dash-journey-dot">{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <small>{detail}</small>
                <span className="dash-journey-link">
                  {active ? `Open ${tab}` : "Switch view"}
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── Role home (non-HOD) ────────────────────────────────────────── */

function ProgressRing({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg className="dash-ring" viewBox="0 0 84 84" role="img" aria-label={`${value}% complete`}>
      <circle cx="42" cy="42" r={radius} className="dash-ring-track" />
      <circle
        cx="42"
        cy="42"
        r={radius}
        className="dash-ring-fill"
        strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="47" textAnchor="middle" className="dash-ring-text">
        {value}%
      </text>
    </svg>
  );
}

function RoleHomeView({
  role,
  dashboard,
  onSelectTab,
}: {
  role: UserRole;
  dashboard: DashboardData | null;
  onSelectTab: (tab: string) => void;
}) {
  const [label, demoValue, demoDetail] = dashboardByRole[role].metrics[0];
  // A student's own backlog count is live; other roles' headline figures are illustrative.
  const value = role === "student" && dashboard ? String(dashboard.active_backlog_count) : demoValue;
  const detail = role === "student" && dashboard ? "Subjects still to clear" : demoDetail;
  const progress = role === "student" ? 78 : 64;
  return (
    <div className="dash-grid-2">
      <article className="dash-card dash-panel">
        <PanelHeader eyebrow="Current signal" title="Recovery progress" icon={Gauge} />
        <div className="dash-signal">
          <ProgressRing value={progress} />
          <div className="min-w-0">
            <strong className="dash-signal-value">{value}</strong>
            <p>{label}</p>
            <StatusBadge tone="success">{detail}</StatusBadge>
          </div>
        </div>
      </article>
      <article className="dash-card dash-panel">
        <PanelHeader eyebrow="Recommended actions" title="Your next steps" icon={ListChecks} />
        <ol className="dash-action-list">
          {roleNextActions[role].map(([action, tab], index) => (
            <li key={action}>
              <button type="button" onClick={() => onSelectTab(tab)}>
                <span className="dash-action-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">{action}</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}

/* ── Workspace tab view ─────────────────────────────────────────── */

export function DashboardTabView({
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
        return course_patterns
          .slice(0, 6)
          .map((p) => [
            p.course_code,
            `${p.count} repeated failures`,
            p.count >= 5 ? "Multiple attempt pressure" : "Pattern detected",
            p.count >= 5 ? "Escalate" : "Review",
          ]);
      case "Interventions":
        return criticalStudents
          .slice(0, 5)
          .map((s) => [s.student_id, `${s.active_backlog_count} backlogs · CRITICAL`, "Mentor sign-off required", "Pending"])
          .concat(
            reviewStudents
              .slice(0, 3)
              .map((s) => [s.student_id, `${s.active_backlog_count} backlogs · REVIEW`, "Structured remedial plan", "Active"]),
          );
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
        return students
          .slice(0, 6)
          .map((s) => [
            s.student_id,
            `${s.active_backlog_count} backlogs`,
            s.status === "CRITICAL" ? "Eligibility at risk" : "Eligible to register",
            s.status === "CRITICAL" ? "Review" : "Eligible",
          ]);
      default:
        return [];
    }
  })();

  const rows = liveRows.length > 0 ? liveRows : ((content?.rows as unknown as string[][]) ?? []);
  const canOpenStudent = activeTab === "Students" || activeTab === "Interventions";

  const statusTone = (status: string): Tone => {
    const s = status.toLowerCase();
    if (["critical", "urgent", "action", "escalate", "restricted"].some((k) => s.includes(k))) return "danger";
    if (["live", "eligible", "ready", "positive", "clear"].some((k) => s.includes(k))) return "success";
    if (["review", "watch", "monitor", "pending", "high pressure", "warning"].some((k) => s.includes(k))) return "warning";
    return "neutral";
  };

  const summaryStats: Array<[string, string]> = (() => {
    if (!dashboard) return [];
    switch (activeTab) {
      case "Students":
        return [
          ["Total", String(dashboard.student_count)],
          ["Critical", String(dashboard.critical_case_count)],
          ["Interventions", String(dashboard.intervention_count)],
        ];
      case "Backlogs":
        return [
          ["Active backlogs", String(dashboard.active_backlog_count)],
          ["Courses affected", String(dashboard.course_patterns.length)],
        ];
      case "Patterns":
        return [
          ["Courses flagged", String(dashboard.course_patterns.length)],
          ["Critical students", String(dashboard.critical_case_count)],
        ];
      case "Interventions":
        return [
          ["Total interventions", String(dashboard.intervention_count)],
          ["Critical cases", String(dashboard.critical_case_count)],
        ];
      case "Alerts":
        return [
          ["Students affected", String(dashboard.student_count)],
          ["Critical", String(dashboard.critical_case_count)],
        ];
      default:
        return [["Records", String(rows.length)]];
    }
  })();

  if (!content) {
    return (
      <div className="dash-page">
        <section className="dash-card dash-empty">
          <span className="dash-empty-icon">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <strong>This section is on its way</strong>
          <p>There is nothing to show here yet.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <header className="on-brand dash-tab-hero">
        <div className="dash-hero-glow" aria-hidden="true" />
        <div className="dash-tab-hero-row">
          <div className="min-w-0">
            <p className="dash-tab-eyebrow">{content.eyebrow}</p>
            <h1 className="dash-tab-title">{content.title}</h1>
            <p className="dash-tab-copy">{content.description}</p>
          </div>
          <span className="dash-hero-live">
            <i aria-hidden="true" />
            {liveRows.length > 0 ? "Live data" : "Reference view"}
          </span>
        </div>
        {summaryStats.length > 0 && (
          <div className="dash-tab-stats">
            {summaryStats.map(([label, value]) => (
              <div key={label} className="dash-tab-stat">
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </header>

      <section className="dash-card dash-table" aria-label={content.title}>
        <div className="dash-table-head">
          <span>Signal</span>
          <span>Scope</span>
          <span>Context</span>
          <span>Status</span>
          <span />
        </div>
        {rows.length === 0 ? (
          <div className="dash-empty">
            <span className="dash-empty-icon">
              <Activity size={22} aria-hidden="true" />
            </span>
            <strong>No records available</strong>
            <p>This view will populate when data is available from the backend.</p>
          </div>
        ) : (
          rows.map((row, index) => {
            const tone = statusTone(row[3]);
            const isId = /\d/.test(row[0]);
            const cells = (
              <>
                <span className="dash-table-primary">
                  <Avatar label={row[0]} tone={tone === "danger" ? "danger" : "neutral"} size="sm" />
                  <strong className={isId ? "font-mono" : undefined}>{row[0]}</strong>
                </span>
                <span className="dash-table-cell" data-label="Scope">{row[1]}</span>
                <span className="dash-table-cell" data-label="Context">{row[2]}</span>
                <span className="dash-table-status">
                  <StatusBadge tone={tone}>{row[3]}</StatusBadge>
                </span>
                {canOpenStudent ? (
                  <ArrowRight size={16} className="dash-table-chevron" aria-hidden="true" />
                ) : (
                  <span />
                )}
              </>
            );
            return canOpenStudent ? (
              <button
                key={`${row[0]}-${index}`}
                type="button"
                className="dash-table-row is-interactive"
                onClick={() => onSelectStudent(row[0])}
              >
                {cells}
              </button>
            ) : (
              <div key={`${row[0]}-${index}`} className="dash-table-row">
                {cells}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/* ── Profile ────────────────────────────────────────────────────── */

type Profile = { name: string; email: string; provider: string };

export function ProfileView({ role }: { role: UserRole }) {
  const roleLabel = userRoles.find((item) => item.id === role)?.label || role;
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    const demoProfile: Profile = {
      name: `${roleLabel} demo account`,
      email: "Demo session · no email on file",
      provider: "demo",
    };
    supabaseAuth.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        const user = data.user;
        // Code and demo sessions have no Supabase user; show those instead of loading forever.
        if (!user) {
          const otpSession = readOtpSession();
          setProfile(
            otpSession
              ? {
                  name: otpSession.registrationNumber,
                  email: "Signed in with registration number",
                  provider: "otp",
                }
              : demoProfile,
          );
          return;
        }
        const metadata = user.user_metadata ?? {};
        const identityMetadata =
          (user.identities?.[0]?.identity_data as Record<string, unknown> | undefined) ?? {};
        const merged = { ...identityMetadata, ...metadata };
        const constructedName =
          merged.given_name && merged.family_name ? `${merged.given_name} ${merged.family_name}` : null;
        const name =
          merged.full_name ||
          merged.name ||
          constructedName ||
          merged.display_name ||
          merged.user_name ||
          user.email?.split("@")[0].toUpperCase() ||
          "Authenticated User";
        setProfile({
          name: String(name),
          email: user.email || "Not available",
          provider: String(user.app_metadata?.provider || "Email and password"),
        });
      })
      .catch(() => {
        if (active) setProfile(demoProfile);
      });
    return () => {
      active = false;
    };
  }, [roleLabel]);

  const signIn =
    profile?.provider === "azure"
      ? "Microsoft 365"
      : profile?.provider === "github"
        ? "GitHub"
        : profile?.provider === "demo"
          ? "Demo access"
          : profile?.provider === "otp"
            ? "Registration number + code"
            : profile?.provider || "Loading";

  const details: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: "Institution", value: "Vignan University", icon: GraduationCap },
    { label: "Workspace role", value: roleLabel, icon: ShieldCheck },
    { label: "Sign-in method", value: signIn, icon: KeyRound },
    {
      label: "Account status",
      value: profile ? (profile.provider === "demo" ? "Active · demo" : "Active") : "Loading",
      icon: BadgeCheck,
    },
  ];

  return (
    <div className="dash-page dash-narrow">
      <SectionHeading
        as="h1"
        eyebrow="Account overview"
        title="Your profile"
        description="Your EduRecover identity and institution access details."
      />
      <section className="dash-card dash-profile">
        <div className="on-brand dash-profile-banner" aria-hidden="true" />
        <div className="dash-profile-body">
          <span className="dash-profile-avatar">
            <UserRound size={32} aria-hidden="true" />
          </span>
          <div className="dash-profile-text">
            <h2>{profile?.name || "Loading profile..."}</h2>
            <p>
              <Mail size={14} aria-hidden="true" />
              {profile?.email || "Loading account email..."}
            </p>
          </div>
          <span className={`dash-profile-role ${roleBadgeClasses[role]}`}>{roleLabel}</span>
        </div>
      </section>
      <section className="dash-card dash-panel">
        <PanelHeader eyebrow="Account details" title="Access and identity" icon={ShieldCheck} />
        <div className="dash-detail-grid">
          {details.map((detail) => (
            <div key={detail.label} className="dash-detail">
              <span className="dash-detail-icon">
                <detail.icon size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <small>{detail.label}</small>
                <strong>{detail.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Settings ───────────────────────────────────────────────────── */

export function SettingsView({
  sidebarCollapsed,
  onToggleSidebar,
  onSelectTab,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSelectTab: (tab: string) => void;
}) {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <div className="dash-page dash-narrow">
      <SectionHeading
        as="h1"
        eyebrow="Preferences"
        title="Workspace settings"
        description="Tune how EduRecover looks and behaves on this device."
      />

      <section className="dash-card dash-panel">
        <PanelHeader eyebrow="Appearance" title="Theme" icon={darkMode ? Moon : Sun} />
        <p className="dash-muted">Choose a light or dark workspace. Your choice is saved on this device.</p>
        <div className="dash-segment" role="radiogroup" aria-label="Theme">
          <button
            type="button"
            role="radio"
            aria-checked={!darkMode}
            className={!darkMode ? "is-active" : undefined}
            onClick={() => {
              if (darkMode) toggleDarkMode();
            }}
          >
            <Sun size={16} aria-hidden="true" /> Light
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={darkMode}
            className={darkMode ? "is-active" : undefined}
            onClick={() => {
              if (!darkMode) toggleDarkMode();
            }}
          >
            <Moon size={16} aria-hidden="true" /> Dark
          </button>
        </div>
      </section>

      <section className="dash-card dash-panel">
        <PanelHeader eyebrow="Navigation" title="Compact sidebar" icon={PanelLeftClose} />
        <div className="dash-setting-row">
          <p className="dash-muted">
            Show only icons in the sidebar on larger screens, with names on hover. Phones always use the menu drawer.
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={sidebarCollapsed}
            aria-label="Compact sidebar"
            className={`dash-switch${sidebarCollapsed ? " is-on" : ""}`}
            onClick={onToggleSidebar}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="dash-card dash-panel">
        <PanelHeader eyebrow="Voice assistant" title="Talk to your workspace" icon={Mic} />
        <p className="dash-muted">
          Press the microphone button in the corner and speak naturally in English or Hindi, for example
          “show critical students” or “switch to dark mode”. You can mute spoken replies from the assistant panel.
        </p>
      </section>

      <section className="dash-card dash-panel">
        <PanelHeader eyebrow="Account" title="Profile and access" icon={UserRound} />
        <div className="dash-setting-row">
          <p className="dash-muted">See your institution, workspace role and sign-in method.</p>
          <button type="button" className="dash-link" onClick={() => onSelectTab("Profile")}>
            Open profile <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}

/* ── Loading states ─────────────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="dash-page" aria-label="Loading dashboard" role="status">
      <div className="skeleton-shimmer dash-skeleton-hero" />
      <div className="dash-stat-grid">
        {["one", "two", "three", "four"].map((item) => (
          <div key={item} className="dash-card dash-panel">
            <div className="skeleton-shimmer h-2.5 w-24 rounded-full" />
            <div className="skeleton-shimmer h-8 w-20 rounded-lg mt-4" />
            <div className="skeleton-shimmer h-2.5 w-32 rounded-full mt-3" />
          </div>
        ))}
      </div>
      <div className="dash-grid-2">
        {["one", "two"].map((item) => (
          <div key={item} className="dash-card dash-panel">
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

export function TabSkeleton() {
  return (
    <div className="dash-page" aria-label="Loading section" role="status">
      <div className="skeleton-shimmer dash-skeleton-tab" />
      <div className="dash-card overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="dash-skeleton-row">
            <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
            <div className="skeleton-shimmer h-3 w-28 rounded-full" />
            <div className="skeleton-shimmer h-3 w-24 rounded-full" />
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
