import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
      const res = await fetch(
        `http://127.0.0.1:8000/api/orchestrate/${targetId}`,
      );
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
    // Dynamically uses the currently selected or first test profile instead of hardcoding
    const scannedId = studentId || students[0];
    setStudentId(scannedId);
    fetchOrchestration(scannedId);
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/approve-intervention/${studentId}?mentor_id=${mentorId}`,
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
              body { font-family: Arial, sans-serif; color: #111; padding: 40px; line-height: 1.6; }
              .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
              .header h1 { color: #4f46e5; margin: 0; font-size: 24px; }
              .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
              .section { margin-bottom: 25px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
              .section h2 { font-size: 16px; color: #374151; margin-top: 0; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
              .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; }
              .label { font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; }
              .value { font-size: 15px; color: #111827; font-weight: bold; margin-top: 2px; }
              ul { padding-left: 20px; margin: 10px 0; }
              li { margin-bottom: 8px; font-size: 14px; color: #374151; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
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
              <div class="value" style="color: #4f46e5; margin-bottom: 15px;">${data.ai_orchestration.recoverability_segment}</div>
              
              <div class="label">Evidence-Based Reasoning</div>
              <p style="font-size: 14px; color: #374151; background: #fff; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px;">
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans pb-20 relative">
      {showScanner && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-indigo-400">
                Scan ID Card Barcode or QR Code
              </h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-slate-400 hover:text-rose-400 transition text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div
              id="barcode-reader"
              className="w-full bg-black rounded-lg overflow-hidden border border-slate-800"
            ></div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">
                Align linear barcode inside the red frame.
              </p>
              <button
                onClick={handleInstantScan}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-semibold shadow transition"
              >
                ⚡ Instant Scan Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-indigo-400">
              Agent 35: Vignan University Academic Recovery
            </h1>
            <p className="text-sm text-slate-400">
              Multi-agent deterministic rule enforcement & intelligent
              intervention analysis
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowScanner(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600"
            >
              <svg
                className="w-4 h-4"
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
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all w-full md:w-40 font-mono"
            />
            <button
              onClick={() => fetchOrchestration(studentId)}
              disabled={loading || !studentId}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Analyzing..." : "Run Orchestrator"}
            </button>
          </div>
        </header>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mr-2">
            Quick Test Profiles:
          </span>
          {students.map((id) => (
            <button
              key={id}
              onClick={() => {
                setStudentId(id);
                setDispatchLogs([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                studentId === id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Deterministic Evaluation
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <span className="text-xs text-slate-500">
                      Registration No.
                    </span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {data.target_student_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <span className="text-xs text-slate-500">
                      Active Backlogs
                    </span>
                    <span className="font-semibold text-amber-400 text-sm">
                      {data.deterministic_evaluation.active_backlog_count} /{" "}
                      {data.deterministic_evaluation.max_allowed_backlogs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <span className="text-xs text-slate-500">
                      Promotion Status
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        data.deterministic_evaluation.promotion_status ===
                        "ELIGIBLE"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {data.deterministic_evaluation.promotion_status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <span className="text-xs text-slate-500">
                      Attempt Pressure
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        data.deterministic_evaluation.attempt_pressure ===
                          "HIGH" ||
                        data.deterministic_evaluation.attempt_pressure ===
                          "CRITICAL"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-blue-950 text-blue-400 border border-blue-800"
                      }`}
                    >
                      {data.deterministic_evaluation.attempt_pressure}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <span className="text-xs text-slate-500">
                      Duration Risk
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        durationRisk === "HIGH"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      }`}
                    >
                      {durationRisk}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-slate-500">
                      Chronic Pattern
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        chronicPattern === "DETECTED"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {chronicPattern}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Arrear Register
                </h2>
                {data.deterministic_evaluation.backlog_details.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No active backlogs found for this profile.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.deterministic_evaluation.backlog_details.map((b) => (
                      <div
                        key={b.id}
                        className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-sm"
                      >
                        <span className="font-mono text-indigo-300">
                          {b.course_code}
                        </span>
                        <span className="text-xs text-slate-400">
                          Attempts: {b.attempts_made}
                        </span>
                        <span className="text-xs text-amber-500 font-medium">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recovery Orchestrator Output
                    </h2>
                    <span className="text-xl font-bold text-indigo-300 mt-1 block">
                      {data.ai_orchestration.recoverability_segment}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        data.ai_orchestration.human_approval_required
                          ? "bg-amber-950/80 text-amber-300 border border-amber-700"
                          : "bg-emerald-950/80 text-emerald-300 border border-emerald-700"
                      }`}
                    >
                      {data.ai_orchestration.human_approval_required
                        ? "Approval Required"
                        : "Auto-Processable"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Export Document:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleExport("pdf")}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                    >
                      <span className="text-red-400 font-bold">PDF</span>{" "}
                      Document
                    </button>
                    <button
                      onClick={() => handleExport("docx")}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                    >
                      <span className="text-blue-400 font-bold">DOCX</span> Word
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                    >
                      <span className="text-emerald-400 font-bold">CSV</span>{" "}
                      Data
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                    >
                      <span className="text-indigo-400 font-bold">JSON</span>{" "}
                      Payload
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Evidence-Based Reasoning
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800/80">
                    {data.ai_orchestration.reasoning}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Recommended Interventions
                  </h3>
                  <ul className="space-y-2">
                    {data.ai_orchestration.recommended_actions.map(
                      (action, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-sm text-slate-200"
                        >
                          <span className="text-indigo-400 font-bold shrink-0">
                            0{idx + 1}
                          </span>
                          <span className="leading-relaxed">{action}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {approved
                          ? `✓ Intervention logged by ${mentorId}.`
                          : "Awaiting mentor sign-off:"}
                      </span>
                      {!approved && (
                        <select
                          value={mentorId}
                          onChange={(e) => setMentorId(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="FACULTY_099">Prof. S. Dhital</option>
                          <option value="FACULTY_104">Dr. A. Sharma</option>
                        </select>
                      )}
                    </div>

                    <button
                      onClick={handleApprove}
                      disabled={approving || approved}
                      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                        approved
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
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
                    <div className="mt-4 bg-black border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-48 shadow-inner shadow-black">
                      {dispatchLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`mb-1 ${log.includes("SYSTEM") ? "text-indigo-400 font-bold" : "text-emerald-500"}`}
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