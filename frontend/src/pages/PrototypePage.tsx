import { useCallback, useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Gauge,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { StatCard, StatusBadge } from "../components/WorkspacePrimitives";
import type { OrchestrationData } from "../types/agent";
import type { UserRole } from "../types/roles";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const STUDENTS = ["STU001", "STU002", "STU003", "STU004"];

export default function PrototypePage({
  role = "hod",
  onBack,
}: {
  role?: UserRole;
  onBack: () => void;
}) {
  const [studentId, setStudentId] = useState(STUDENTS[0]);
  const [mentorId, setMentorId] = useState("FACULTY_099");
  const [data, setData] = useState<OrchestrationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchOrchestration = useCallback(async (targetId: string) => {
    setLoading(true);
    setError("");
    setApproved(false);
    setDispatchLogs([]);
    try {
      const response = await fetch(`${API_URL}/api/orchestrate/${targetId}`);
      if (!response.ok) throw new Error("Unable to fetch orchestration data");
      setData((await response.json()) as OrchestrationData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
      const response = await fetch(
        `${API_URL}/api/approve-intervention/${studentId}?mentor_id=${mentorId}`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Unable to approve intervention");
      setApproved(true);
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

  return (
    <main className="workspace-page">
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
            <span className="workspace-kicker">
              <i />{" "}
              {role === "hod"
                ? "HOD command center"
                : role === "mentor"
                  ? "Faculty workspace"
                  : role === "student"
                    ? "Student recovery"
                    : role === "exam"
                      ? "Examination operations"
                      : "Placement readiness"}
            </span>
            <h1>Academic Recovery Workspace</h1>
            <p>
              Deterministic rules, visible reasoning, human-approved
              intervention.
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

      <section className="workspace-toolbar">
        <div className="profile-label">
          <span>Quick profiles</span>
          <small>Use a demo record to explore the workflow</small>
        </div>
        <div className="profile-pills">
          {STUDENTS.map((id) => (
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

      {error && (
        <div className="workspace-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}
      {!data && !loading && (
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

      {data && evaluation && recommendation && (
        <section className="workspace-content">
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
            <StatusBadge tone={approved ? "success" : "warning"}>
              {approved ? "Intervention approved" : "Human review required"}
            </StatusBadge>
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
                        <span>{backlog.attempts_made} attempts</span>
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
                    <strong>Regulation checked</strong>
                  </div>
                </div>
              </article>
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
                    onClick={() => void handleApprove()}
                    disabled={approving || approved}
                  >
                    {approved ? <Check size={16} /> : <ShieldCheck size={16} />}
                    {approving
                      ? "Logging"
                      : approved
                        ? "Intervention approved"
                        : "Approve & deploy"}
                  </button>
                </div>
              </article>
              {dispatchLogs.length > 0 && (
                <article className="workspace-card activity-card">
                  <div className="card-heading">
                    <div>
                      <span className="workspace-kicker">Agent activity</span>
                      <h3>Downstream execution log</h3>
                    </div>
                    <Activity size={18} />
                  </div>
                  <div className="activity-log">
                    {dispatchLogs.map((log) => (
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
