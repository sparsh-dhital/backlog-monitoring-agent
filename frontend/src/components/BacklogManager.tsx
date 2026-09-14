import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Plus, RefreshCw, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { api } from "../api";
import type { BacklogRow } from "../types/agent";
import { StatusBadge } from "./WorkspacePrimitives";

const DEMO_PREFIX = "DEMO-";

const statusTone = (status: string) => {
  if (status === "PENDING") return "warning" as const;
  if (status === "CLEARED") return "success" as const;
  return "danger" as const;
};

export default function BacklogManager({
  studentId,
  onChanged,
}: {
  /** Staff pass a target student; a student account is scoped by its token. */
  studentId?: string;
  onChanged?: () => void;
}) {
  const [rows, setRows] = useState<BacklogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [courseCode, setCourseCode] = useState("");
  const [attempts, setAttempts] = useState(1);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string>("");

  // Bumping this re-runs the read; nothing is set synchronously in the effect.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .backlogs(studentId)
      .then((payload) => {
        if (!active) return;
        setRows(payload.backlogs);
        setLoadError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setRows([]);
        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : "Backlogs could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentId, reloadToken]);

  const retry = () => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  };

  /** Re-read after every mutation so the row list and the charts agree. */
  const refresh = () => {
    setReloadToken((token) => token + 1);
    onChanged?.();
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = courseCode.trim().toUpperCase();
    if (!code) {
      setFormError("Enter a course code.");
      return;
    }
    if (attempts < 0 || attempts > 10) {
      setFormError("Attempts must be between 0 and 10.");
      return;
    }
    setBusy("add");
    setFormError("");
    setNotice("");
    try {
      await api.createBacklog({
        course_code: code,
        attempts_made: attempts,
        status: "PENDING",
        ...(studentId ? { student_id: studentId } : {}),
      });
      setCourseCode("");
      setAttempts(1);
      setNotice(`${code} added.`);
      refresh();
    } catch (error) {
      // Backend messages (duplicate course, bad range) surface inline.
      setFormError(
        error instanceof Error
          ? error.message
          : "That backlog could not be saved.",
      );
    } finally {
      setBusy("");
    }
  };

  const handleDelete = async (row: BacklogRow) => {
    setBusy(row.id);
    setFormError("");
    setNotice("");
    try {
      await api.deleteBacklog(row.id);
      setNotice(`${row.course_code} removed.`);
      refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "That row could not be deleted.",
      );
    } finally {
      setBusy("");
    }
  };

  const runDemo = async (mode: "seed" | "clear") => {
    setBusy(mode);
    setFormError("");
    setNotice("");
    try {
      if (mode === "seed") {
        const result = await api.seedDemoBacklogs(studentId);
        setNotice(
          result.created > 0
            ? `${result.created} sample row${result.created === 1 ? "" : "s"} added.`
            : "Sample rows are already present.",
        );
      } else {
        const result = await api.clearDemoBacklogs(studentId);
        setNotice(
          result.deleted > 0
            ? `${result.deleted} sample row${result.deleted === 1 ? "" : "s"} removed.`
            : "There were no sample rows to remove.",
        );
      }
      refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "That action could not be completed.",
      );
    } finally {
      setBusy("");
    }
  };

  const demoCount = rows.filter((row) =>
    row.course_code.startsWith(DEMO_PREFIX),
  ).length;

  return (
    <section
      className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6"
      aria-label="Manage backlog records"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
            Backlog records
          </p>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">
            Add or remove subjects
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Every change is written to the database and the charts update with
            it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void runDemo("seed")}
            disabled={Boolean(busy)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            <Sparkles size={13} />
            {busy === "seed" ? "Adding..." : "Add sample rows"}
          </button>
          <button
            type="button"
            onClick={() => void runDemo("clear")}
            disabled={Boolean(busy) || demoCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 transition-colors"
          >
            <Trash2 size={13} />
            {busy === "clear"
              ? "Removing..."
              : `Remove samples${demoCount ? ` (${demoCount})` : ""}`}
          </button>
        </div>
      </div>

      {/* Add form */}
      <form
        onSubmit={(event) => void handleAdd(event)}
        className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-100 mb-4"
      >
        <label className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Course code
          </span>
          <input
            value={courseCode}
            onChange={(event) => setCourseCode(event.target.value)}
            placeholder="e.g. CS204"
            maxLength={20}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </label>
        <label className="flex flex-col gap-1.5 w-32">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Attempts made
          </span>
          <input
            type="number"
            min={0}
            max={10}
            value={attempts}
            onChange={(event) => setAttempts(Number(event.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </label>
        <button
          type="submit"
          disabled={Boolean(busy)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={15} />
          {busy === "add" ? "Adding..." : "Add backlog"}
        </button>
      </form>

      {formError && (
        <p className="flex items-start gap-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          {formError}
        </p>
      )}
      {notice && !formError && (
        <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
          {notice}
        </p>
      )}

      {/* Rows */}
      {loading && (
        <div
          className="flex flex-col gap-2"
          role="status"
          aria-label="Loading records"
        >
          {["a", "b", "c"].map((key) => (
            <div key={key} className="skeleton-shimmer h-12 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5">
          <p className="text-sm font-semibold text-rose-700">{loadError}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )}

      {!loading && !loadError && rows.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm font-semibold text-emerald-700">
            Congratulations, you have no backlogs.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            No backlog records were found for your student account. Add one
            above only if you need to record a new subject.
          </p>
        </div>
      )}

      {!loading && !loadError && rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const isDemo = row.course_code.startsWith(DEMO_PREFIX);
            return (
              <li
                key={row.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-white/70"
              >
                <span className="font-mono text-sm font-bold text-slate-800 w-32 shrink-0">
                  {row.course_code}
                </span>
                {isDemo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                    SAMPLE
                  </span>
                )}
                <span className="text-sm text-slate-500 flex-1">
                  {row.attempts_made} attempt
                  {row.attempts_made === 1 ? "" : "s"} made
                </span>
                <StatusBadge tone={statusTone(row.status)}>
                  {row.status}
                </StatusBadge>
                <button
                  type="button"
                  onClick={() => void handleDelete(row)}
                  disabled={Boolean(busy)}
                  aria-label={`Delete ${row.course_code}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
