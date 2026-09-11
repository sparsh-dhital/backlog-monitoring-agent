import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface OrchestrationData {
  agent_id: string;
  target_student_id: string;
  deterministic_evaluation: {
    student_id: string;
    active_backlog_count: number;
    max_allowed_backlogs: number;
    promotion_status: string;
    attempt_pressure: string;
    backlog_details: Array<{
      id: string;
      course_code: string;
      attempts_made: number;
      status: string;
    }>;
  };
  ai_orchestration: {
    recoverability_segment: string;
    reasoning: string;
    recommended_actions: string[];
    human_approval_required: boolean;
  };
}

export default function App() {
  const [studentId, setStudentId] = useState("STU001");
  const [mentorId, setMentorId] = useState("FACULTY_099");
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [data, setData] = useState<OrchestrationData | null>(null);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const students = ["STU001", "STU002", "STU003", "STU004"];

  const fetchOrchestration = async (targetId: string) => {
    setLoading(true);
    setError("");
    setApproved(false);
    setDispatchLogs([]);
    try {
      const res = await fetch(`${API_URL}/api/orchestrate/${targetId}`);
      if (!res.ok) throw new Error("Failed to fetch orchestration data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dispatchLogs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [dispatchLogs]);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "barcode-reader",
        {
          fps: 15,
          qrbox: { width: 380, height: 110 },
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
          scanner.clear().catch(() => {});
          setShowScanner(false);
          const scannedId = decodedText.trim().toUpperCase();
          setStudentId(scannedId);
          fetchOrchestration(scannedId);
        },
        (_errorMessage) => {},
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [showScanner]);

  const handleInstantScan = () => {
    setShowScanner(false);
    const scannedId = studentId || students[0];
    setStudentId(scannedId);
    fetchOrchestration(scannedId);
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(
        `${API_URL}/api/approve-intervention/${studentId}?mentor_id=${mentorId}`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("Failed to approve intervention");
      setApproved(true);

      const sequence = [
        `> [SYSTEM] INITIATING DOWNSTREAM PIPELINE FOR ${studentId}...`,
        `> [SYSTEM] Authorized by Mentor ID: ${mentorId}`,
        `> [COMM_MODULE] Received orchestration contract.`,
        `> [COMM_MODULE] Action: Sending formal intervention email to ${studentId}@university.edu.`,
        `> [REMEDIAL_MODULE] Received payload. Flagging for support module.`,
        `> [SCHEDULER_MODULE] Action: Booking faculty counseling slot.`,
        `> [SYSTEM] BACKLOG STATUS MUTATED TO 'INTERVENTION_ACTIVE'.`,
        `> [SYSTEM] PIPELINE FULLY DEPLOYED AND SYNCED WITH SUPABASE.`,
      ];

      sequence.forEach((log, index) => {
        setTimeout(
          () => {
            setDispatchLogs((prev) => [...prev, log]);
          },
          (index + 1) * 800,
        );
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleExport = (format: string) => {
    if (!data) return;
    let content = "";
    let mimeType = "";
    let filename = `Recovery_Plan_${data.target_student_id}.${format}`;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      mimeType = "application/json";
      filename = `Recovery_Data_${data.target_student_id}.json`;
    } else if (format === "csv") {
      content =
        "Course Code,Attempts Made,Status\n" +
        data.deterministic_evaluation.backlog_details
          .map((b) => `${b.course_code},${b.attempts_made},${b.status}`)
          .join("\n");
      mimeType = "text/csv";
      filename = `Arrear_Register_${data.target_student_id}.csv`;
    } else if (format === "docx") {
      content =
        `VIGNAN UNIVERSITY - ACADEMIC RECOVERY REPORT\n==========================================\n` +
        `Registration No: ${data.target_student_id}\n` +
        `Active Backlogs: ${data.deterministic_evaluation.active_backlog_count} / ${data.deterministic_evaluation.max_allowed_backlogs}\n` +
        `Promotion Status: ${data.deterministic_evaluation.promotion_status}\n` +
        `Attempt Pressure: ${data.deterministic_evaluation.attempt_pressure}\n\n` +
        `RECOVERY STRATEGY\n------------------------------------------\n` +
        `Segment: ${data.ai_orchestration.recoverability_segment}\n\n` +
        `Evidence-Based Reasoning:\n${data.ai_orchestration.reasoning}\n\n` +
        `Recommended Actions:\n${data.ai_orchestration.recommended_actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`;
      mimeType = "application/msword";
      filename = `Recovery_Plan_${data.target_student_id}.doc`;
    } else if (format === "pdf") {
      const htmlContent = `
        <html>
          <head>
            <title>Academic Recovery Report - ${data.target_student_id}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #111; padding: 40px; line-height: 1.6; }
              .header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
              .header h1 { color: #000; margin: 0; font-size: 24px; }
              .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
              .section { margin-bottom: 25px; background: #f9f9fb; border: 1px solid #e5e5ea; padding: 20px; border-radius: 16px; }
              .section h2 { font-size: 14px; color: #333; margin-top: 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e5ea; padding-bottom: 8px; }
              .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; }
              .label { font-size: 11px; color: #888; font-weight: 700; text-transform: uppercase; }
              .value { font-size: 16px; color: #111; font-weight: 700; margin-top: 2px; }
              ul { padding-left: 20px; margin: 10px 0; }
              li { margin-bottom: 8px; font-size: 14px; color: #333; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Vignan University</h1>
              <p>Academic Recovery & Backlog Monitoring System</p>
            </div>
            
            <div class="section">
              <h2>Student Evaluation Profile</h2>
              <div class="grid">
                <div>
                  <div class="label">Registration Number</div>
                  <div class="value">${data.target_student_id}</div>
                </div>
                <div>
                  <div class="label">Active Backlogs</div>
                  <div class="value">${data.deterministic_evaluation.active_backlog_count} / ${data.deterministic_evaluation.max_allowed_backlogs}</div>
                </div>
                <div>
                  <div class="label">Promotion Status</div>
                  <div class="value">${data.deterministic_evaluation.promotion_status}</div>
                </div>
                <div>
                  <div class="label">Attempt Pressure</div>
                  <div class="value">${data.deterministic_evaluation.attempt_pressure}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Recovery Orchestration Strategy</h2>
              <div class="label">Assigned Segment</div>
              <div class="value" style="color: #000; margin-bottom: 15px;">${data.ai_orchestration.recoverability_segment}</div>
              
              <div class="label">Evidence-Based Reasoning</div>
              <p style="font-size: 14px; color: #333; background: #fff; padding: 12px; border: 1px solid #e5e5ea; border-radius: 12px;">
                ${data.ai_orchestration.reasoning}
              </p>
            </div>

            <div class="section">
              <h2>Recommended Action Plan</h2>
              <ul>
                ${data.ai_orchestration.recommended_actions.map((action) => `<li>${action}</li>`).join("")}
              </ul>
            </div>

            <div class="footer">
              Official Document Generated Automatically by Vignan University Academic Recovery Platform
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const durationRisk =
    data?.deterministic_evaluation.attempt_pressure === "HIGH" ? "HIGH" : "LOW";
  const chronicPattern =
    data && data.deterministic_evaluation.active_backlog_count >= 3
      ? "DETECTED"
      : "NONE";

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-10 selection:bg-white selection:text-black pb-24">
      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl p-6">
          <div className="bg-[#141416] p-6 rounded-3xl border border-white/15 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                Scan Student ID Barcode
              </h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-zinc-400 hover:text-white transition text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full"
              >
                ✕ Close
              </button>
            </div>

            <div
              id="barcode-reader"
              className="w-full bg-black rounded-2xl overflow-hidden border border-white/10"
            ></div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-zinc-400">
                Align barcode within the target frame.
              </p>
              <button
                onClick={handleInstantScan}
                className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-full text-xs font-semibold transition"
              >
                ⚡ Instant Scan Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Apple Bento Header Card */}
        <header className="bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-semibold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Agent 35 Core System
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Vignan University Academic Recovery
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Deterministic rule enforcement and intelligent intervention
              orchestration engine.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            <button
              onClick={() => setShowScanner(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#1c1c1e] hover:bg-[#2c2c2e] text-zinc-200 border border-white/10 transition"
            >
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Scan ID Card
            </button>

            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              placeholder="Registration No."
              className="bg-black border border-white/15 rounded-full px-4 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white transition w-full sm:w-36 text-center"
            />

            <button
              onClick={() => fetchOrchestration(studentId)}
              disabled={loading || !studentId}
              className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition disabled:opacity-50 flex-1 sm:flex-none shadow-lg shadow-white/5"
            >
              {loading ? "Analyzing..." : "Run Orchestrator"}
            </button>
          </div>
        </header>

        {/* Quick Test Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mr-2">
            Quick Profiles:
          </span>
          {students.map((id) => (
            <button
              key={id}
              onClick={() => {
                setStudentId(id);
                setDispatchLogs([]);
              }}
              className={`px-4 py-2 rounded-full text-xs font-mono font-semibold transition ${
                studentId === id
                  ? "bg-white text-black shadow-lg shadow-white/10"
                  : "bg-[#121214] text-zinc-400 border border-white/10 hover:bg-[#1c1c1e] hover:text-white"
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800/60 text-red-200 p-4 rounded-3xl text-xs">
            {error}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Bento Column */}
            <div className="space-y-6">
              {/* Deterministic Bento Card */}
              <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-3">
                  Deterministic Evaluation
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Registration No.</span>
                    <span className="font-mono font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      {data.target_student_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Active Backlogs</span>
                    <span className="font-bold text-amber-400">
                      {data.deterministic_evaluation.active_backlog_count} /{" "}
                      {data.deterministic_evaluation.max_allowed_backlogs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Promotion Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                        data.deterministic_evaluation.promotion_status ===
                        "ELIGIBLE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {data.deterministic_evaluation.promotion_status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Attempt Pressure</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                        data.deterministic_evaluation.attempt_pressure ===
                          "HIGH" ||
                        data.deterministic_evaluation.attempt_pressure ===
                          "CRITICAL"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {data.deterministic_evaluation.attempt_pressure}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Duration Risk</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                        durationRisk === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {durationRisk}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-zinc-400">Chronic Pattern</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                        chronicPattern === "DETECTED"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-white/5 text-zinc-400 border border-white/10"
                      }`}
                    >
                      {chronicPattern}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrear Register Bento Card */}
              <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-3">
                  Arrear Register
                </h2>
                {data.deterministic_evaluation.backlog_details.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">
                    No active backlogs found for this profile.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.deterministic_evaluation.backlog_details.map((b) => (
                      <div
                        key={b.id}
                        className="flex justify-between items-center bg-black/40 p-3.5 rounded-2xl border border-white/10 text-xs"
                      >
                        <span className="font-mono font-bold text-zinc-200">
                          {b.course_code}
                        </span>
                        <span className="text-zinc-400">
                          Attempts: {b.attempts_made}
                        </span>
                        <span className="text-amber-400 font-semibold">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Bento Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-5 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                      Recovery Orchestrator Output
                    </span>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      {data.ai_orchestration.recoverability_segment}
                    </h2>
                  </div>

                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                      data.ai_orchestration.human_approval_required
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {data.ai_orchestration.human_approval_required
                      ? "Approval Required"
                      : "Auto-Processable"}
                  </span>
                </div>

                {/* Export Options Toolbar */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    Export Document:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleExport("pdf")}
                      className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-zinc-200 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      <span className="text-rose-400 font-bold mr-1">PDF</span>{" "}
                      Document
                    </button>
                    <button
                      onClick={() => handleExport("docx")}
                      className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-zinc-200 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      <span className="text-blue-400 font-bold mr-1">DOCX</span>{" "}
                      Word
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-zinc-200 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      <span className="text-emerald-400 font-bold mr-1">
                        CSV
                      </span>{" "}
                      Data
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-zinc-200 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      <span className="text-indigo-400 font-bold mr-1">
                        JSON
                      </span>{" "}
                      Payload
                    </button>
                  </div>
                </div>

                {/* Evidence-Based Reasoning */}
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                    Evidence-Based Reasoning
                  </h3>
                  <div className="text-sm text-zinc-300 leading-relaxed bg-black/60 p-5 rounded-2xl border border-white/10 shadow-inner">
                    {data.ai_orchestration.reasoning}
                  </div>
                </div>

                {/* Recommended Interventions */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                    Recommended Interventions
                  </h3>
                  <ul className="space-y-3">
                    {data.ai_orchestration.recommended_actions.map(
                      (action, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3.5 bg-black/60 p-4 rounded-2xl border border-white/10 text-xs text-zinc-200"
                        >
                          <span className="text-emerald-400 font-mono font-bold shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            0{idx + 1}
                          </span>
                          <span className="leading-relaxed mt-0.5">
                            {action}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* Approval & Terminal Log Section */}
                <div className="pt-5 border-t border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 font-medium">
                        {approved
                          ? `✓ Intervention logged by ${mentorId}.`
                          : "Awaiting mentor sign-off:"}
                      </span>
                      {!approved && (
                        <select
                          value={mentorId}
                          onChange={(e) => setMentorId(e.target.value)}
                          className="bg-black border border-white/15 rounded-full px-4 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white"
                        >
                          <option value="FACULTY_099">Prof. S. Dhital</option>
                          <option value="FACULTY_104">Dr. A. Sharma</option>
                        </select>
                      )}
                    </div>

                    <button
                      onClick={handleApprove}
                      disabled={approving || approved}
                      className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition whitespace-nowrap shadow-lg ${
                        approved
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default"
                          : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                      }`}
                    >
                      {approving
                        ? "Logging..."
                        : approved
                          ? "Intervention Approved ✓"
                          : "Approve & Deploy Plan"}
                    </button>
                  </div>

                  {dispatchLogs.length > 0 && (
                    <div className="bg-black border border-white/10 rounded-2xl p-5 font-mono text-[11px] overflow-y-auto max-h-48 shadow-inner space-y-1.5">
                      {dispatchLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`${log.includes("SYSTEM") ? "text-zinc-200 font-bold" : "text-emerald-400"}`}
                        >
                          {log}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}