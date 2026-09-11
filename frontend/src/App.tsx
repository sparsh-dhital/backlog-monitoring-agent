import { useState, useEffect, useRef } from "react";

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
  const [loading, setLoading] = useState(false);
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

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/approve-intervention/${studentId}`,
        {
          method: "POST",
        },
      );
      if (!res.ok) throw new Error("Failed to approve intervention");
      setApproved(true);

      // Simulate live background task streaming for the UI demo
      const sequence = [
        `> [SYSTEM] INITIATING DOWNSTREAM PIPELINE FOR ${studentId}...`,
        `> [AGENT_12_COMM] Received orchestration contract.`,
        `> [AGENT_12_COMM] Action: Sending formal intervention email to ${studentId}@university.edu.`,
        `> [AGENT_14_REMEDIAL] Received payload. Flagging for math support module.`,
        `> [AGENT_45_SCHEDULE] Received payload.`,
        `> [AGENT_45_SCHEDULE] Action: Booking faculty counseling slot for upcoming Thursday.`,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-indigo-400">
              Agent 35: Academic Recovery Orchestrator
            </h1>
            <p className="text-sm text-slate-400">
              Multi-agent deterministic rule enforcement & Gemini qualitative
              intervention analysis
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              placeholder="Enter Student ID"
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full md:w-36"
            />
            <button
              onClick={() => fetchOrchestration(studentId)}
              disabled={loading}
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
                    <span className="text-xs text-slate-500">Student ID</span>
                    <span className="text-sm font-bold text-slate-200">
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
                  <div className="flex justify-between items-center pt-1">
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
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Gemini AI Recovery Orchestrator
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {approved
                        ? "✓ Intervention logged to Supabase database."
                        : "Awaiting mentor sign-off to push workflow."}
                    </span>
                    <button
                      onClick={handleApprove}
                      disabled={approving || approved}
                      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
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