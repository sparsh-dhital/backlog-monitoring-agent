import { useEffect, useState } from "react";
import { api } from "../api";
import type { BacklogRow } from "../types/agent";

/* Same validated ordinal ramp as the department charts, resolved per theme
   from CSS variables on .viz-root (index.css): blue 250/350/450/600 on light,
   500/400/300/200 on dark. Attempt bands are ORDERED, so an ordinal ramp is
   the right job. The exhausted-attempts meter uses the fixed status red. */
const RAMP = ["var(--viz-ramp-1)", "var(--viz-ramp-2)", "var(--viz-ramp-3)"];
const GAP = 2;
/** Regulation default; the evaluation endpoint is the source of truth. */
const MAX_ATTEMPTS = 3;

interface Band {
  label: string;
  short: string;
  count: number;
  color: string;
}

interface Tip {
  x: number;
  y: number;
  label: string;
  value: string;
}

export default function StudentBacklogCharts({
  studentId,
  refreshKey = 0,
}: {
  studentId?: string;
  /** Bump after the backlog list changes so the charts re-read it. */
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<BacklogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let active = true;
    api
      .backlogs(studentId)
      .then((payload) => {
        if (!active) return;
        setRows(payload.backlogs);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setRows([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Charts could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentId, refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" role="status">
        <div className="skeleton-shimmer h-64 rounded-2xl" />
        <div className="skeleton-shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
      </div>
    );
  }

  const pending = rows.filter((row) => row.status === "PENDING");

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/60 p-10 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Nothing to chart yet.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Add a backlog above and the charts appear here.
        </p>
      </div>
    );
  }

  // Subjects grouped by attempts used — an ordered scale, so an ordinal ramp.
  const bands: Band[] = [
    { label: "1 attempt used", short: "1", count: 0, color: RAMP[0] },
    { label: "2 attempts used", short: "2", count: 0, color: RAMP[1] },
    { label: "3 or more", short: "3+", count: 0, color: RAMP[2] },
  ];
  for (const row of rows) {
    const index = row.attempts_made <= 1 ? 0 : row.attempts_made === 2 ? 1 : 2;
    bands[index].count += 1;
  }
  const live = bands.filter((band) => band.count > 0);
  const total = rows.length;

  const R = 54;
  const C = 2 * Math.PI * R;
  const arcs: Array<{ band: Band; dash: number; offset: number }> = [];
  let cursor = 0;
  for (const band of live) {
    const length = (band.count / total) * C;
    arcs.push({ band, dash: Math.max(length - GAP, 0.5), offset: -cursor });
    cursor += length;
  }

  return (
    <div className="viz-root grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Attempts used vs remaining — a meter per subject, the correct form
          when a student has only a handful of records. */}
      <figure className="viz-card">
        <figcaption>
          <h4>Attempts used per subject</h4>
          <p>How much room is left before the limit</p>
        </figcaption>
        <div className="flex flex-col gap-3.5">
          {rows.map((row) => {
            const used = Math.min(row.attempts_made, MAX_ATTEMPTS);
            const left = Math.max(0, MAX_ATTEMPTS - used);
            return (
              <div key={row.id}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-700 truncate">
                    {row.course_code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                    {left === 0 ? "no attempts left" : `${left} left`}
                  </span>
                </div>
                <div className="flex gap-[2px]">
                  {Array.from({ length: MAX_ATTEMPTS }, (_, index) => (
                    <span
                      key={index}
                      className="h-2.5 flex-1 rounded-[2px]"
                      style={{
                        background:
                          index < used
                            ? left === 0
                              ? "var(--viz-critical)"
                              : "var(--viz-ramp-3)"
                            : "var(--viz-track)",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] font-medium text-slate-500 mt-4 pt-4 border-t border-slate-100">
          {pending.length} of {rows.length} subject
          {rows.length === 1 ? "" : "s"} still pending.
        </p>
      </figure>

      {/* Part-to-whole by attempt band */}
      <figure className="viz-card">
        <figcaption>
          <h4>Subjects by attempts used</h4>
          <p>Share of your record in each band</p>
        </figcaption>

        {live.length < 3 ? (
          <div className="viz-donut-wrap">
            <div className="viz-stack" aria-label="Subjects by attempts used">
              {live.map((band) => (
                <span
                  key={band.label}
                  className="viz-stack-seg"
                  style={{
                    width: `${(band.count / total) * 100}%`,
                    background: band.color,
                  }}
                />
              ))}
            </div>
            <Legend bands={live} total={total} />
            <p className="text-[11px] font-medium text-slate-500 text-center">
              A ring needs three bands — add subjects with different attempt
              counts and this becomes a donut.
            </p>
          </div>
        ) : (
          <div className="viz-donut-wrap">
            <div className="viz-donut">
              <svg
                viewBox="0 0 140 140"
                role="img"
                aria-label="Subjects by attempts used"
              >
                <g transform="rotate(-90 70 70)">
                  {arcs.map(({ band, dash, offset }) => (
                    <circle
                      key={band.label}
                      cx="70"
                      cy="70"
                      r={R}
                      fill="none"
                      style={{ stroke: band.color }}
                      strokeWidth="18"
                      strokeDasharray={`${dash} ${C - dash}`}
                      strokeDashoffset={offset}
                      onPointerMove={(event) =>
                        setTip({
                          x: event.clientX,
                          y: event.clientY,
                          label: band.label,
                          value: `${band.count} subject${band.count === 1 ? "" : "s"}`,
                        })
                      }
                      onPointerLeave={() => setTip(null)}
                    />
                  ))}
                </g>
              </svg>
              <div className="viz-donut-center">
                <strong>{total}</strong>
                <span>subjects</span>
              </div>
            </div>
            <Legend bands={live} total={total} />
          </div>
        )}
      </figure>

      {tip && (
        <div
          className="viz-tooltip"
          style={{ left: tip.x, top: tip.y }}
          role="status"
        >
          <strong>{tip.value}</strong>
          <span>{tip.label}</span>
        </div>
      )}
    </div>
  );
}

function Legend({ bands, total }: { bands: Band[]; total: number }) {
  return (
    <ul className="viz-legend">
      {bands.map((band) => (
        <li key={band.label}>
          <span className="viz-swatch" style={{ background: band.color }} />
          <span className="viz-legend-label">{band.label}</span>
          <span className="viz-legend-value">
            {band.count}
            <small>{Math.round((band.count / total) * 100)}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
