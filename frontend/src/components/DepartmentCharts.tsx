import { useMemo, useState } from "react";
import { Table2, ChartColumnBig } from "lucide-react";
import type { DashboardData } from "../types/agent";

/* ── Palette ──────────────────────────────────────────────────────
   Ordinal blue ramp (steps 250/350/450/600) and categorical slot 1,
   both validated with scripts/validate_palette.js against the card
   surface (#f9fcff): ordinal passes monotonic L, adjacent dL, light-end
   contrast and single-hue; slot 1 passes the categorical gates.
   Buckets here are ORDERED (1 → 4+ backlogs), so an ordinal ramp is the
   correct job — not categorical identity hues.                        */
const RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#184f95"];
const SERIES_1 = "#2a78d6";

/** 2px of surface between touching marks — the gap does the separating,
 *  never a stroke around the mark. */
const GAP = 2;

interface Bucket {
  label: string;
  short: string;
  count: number;
  color: string;
}

function bucketize(
  values: number[],
  bands: Array<{ label: string; short: string; test: (n: number) => boolean }>,
): Bucket[] {
  return bands.map((band, index) => ({
    label: band.label,
    short: band.short,
    count: values.filter((value) => band.test(value)).length,
    color: RAMP[index % RAMP.length],
  }));
}

/* ── Shared tooltip ───────────────────────────────────────────── */

interface Tip {
  x: number;
  y: number;
  label: string;
  value: string;
}

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div
      className="viz-tooltip"
      style={{ left: tip.x, top: tip.y }}
      role="status"
    >
      <strong>{tip.value}</strong>
      <span>{tip.label}</span>
    </div>
  );
}

/* ── 1. Backlogs by course — horizontal bar, single series ─────── */

function CourseBars({
  patterns,
  onTip,
}: {
  patterns: Array<{ course_code: string; count: number }>;
  onTip: (tip: Tip | null) => void;
}) {
  const rows = patterns.slice(0, 8);
  // Scale to the real maximum, never an invented constant.
  const max = Math.max(...rows.map((row) => row.count), 1);

  if (rows.length === 0) {
    return <p className="viz-empty">No pending backlogs recorded.</p>;
  }

  return (
    <div className="viz-bars">
      {rows.map((row) => {
        const pct = (row.count / max) * 100;
        return (
          <div
            key={row.course_code}
            className="viz-bar-row"
            tabIndex={0}
            onPointerMove={(event) =>
              onTip({
                x: event.clientX,
                y: event.clientY,
                label: row.course_code,
                value: `${row.count} student${row.count === 1 ? "" : "s"}`,
              })
            }
            onPointerLeave={() => onTip(null)}
            onFocus={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              onTip({
                x: box.left + box.width / 2,
                y: box.top,
                label: row.course_code,
                value: `${row.count} student${row.count === 1 ? "" : "s"}`,
              });
            }}
            onBlur={() => onTip(null)}
          >
            <span className="viz-bar-label">{row.course_code}</span>
            <span className="viz-bar-track">
              <span
                className="viz-bar-fill"
                style={{ width: `${Math.max(pct, 1.5)}%`, background: SERIES_1 }}
              />
            </span>
            <span className="viz-bar-value">{row.count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── 2. Backlog load mix — donut (part-to-whole, ordered) ──────── */

function LoadDonut({
  buckets,
  total,
  onTip,
}: {
  buckets: Bucket[];
  total: number;
  onTip: (tip: Tip | null) => void;
}) {
  const live = buckets.filter((bucket) => bucket.count > 0);

  if (total === 0) {
    return <p className="viz-empty">No students with pending backlogs.</p>;
  }

  // A 2-slice pie is an anti-pattern; part-to-whole falls back to a
  // stacked bar whenever the data collapses to fewer than three bands.
  if (live.length < 3) {
    return (
      <div className="viz-donut-wrap">
        <div className="viz-stack" aria-label="Backlog load mix">
          {live.map((bucket) => (
            <span
              key={bucket.label}
              className="viz-stack-seg"
              style={{
                width: `${(bucket.count / total) * 100}%`,
                background: bucket.color,
              }}
              onPointerMove={(event) =>
                onTip({
                  x: event.clientX,
                  y: event.clientY,
                  label: bucket.label,
                  value: `${bucket.count} student${bucket.count === 1 ? "" : "s"}`,
                })
              }
              onPointerLeave={() => onTip(null)}
            />
          ))}
        </div>
        <DonutLegend buckets={live} total={total} />
      </div>
    );
  }

  const R = 54;
  const C = 2 * Math.PI * R;
  // Arc lengths and their running offsets, resolved before render so
  // nothing is reassigned while rendering.
  const arcs: Array<{ bucket: Bucket; dash: number; offset: number }> = [];
  let cursor = 0;
  for (const bucket of live) {
    const length = (bucket.count / total) * C;
    // Subtract the surface gap so segments never touch.
    arcs.push({
      bucket,
      dash: Math.max(length - GAP, 0.5),
      offset: -cursor,
    });
    cursor += length;
  }

  return (
    <div className="viz-donut-wrap">
      <div className="viz-donut">
        <svg viewBox="0 0 140 140" role="img" aria-label="Backlog load mix">
          <g transform="rotate(-90 70 70)">
            {arcs.map(({ bucket, dash, offset }) => (
              <circle
                key={bucket.label}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={bucket.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={offset}
                onPointerMove={(event) =>
                  onTip({
                    x: event.clientX,
                    y: event.clientY,
                    label: bucket.label,
                    value: `${bucket.count} student${bucket.count === 1 ? "" : "s"}`,
                  })
                }
                onPointerLeave={() => onTip(null)}
              />
            ))}
          </g>
        </svg>
        <div className="viz-donut-center">
          <strong>{total}</strong>
          <span>students</span>
        </div>
      </div>
      <DonutLegend buckets={live} total={total} />
    </div>
  );
}

/** Legend is always present for >= 2 series, and carries the value so
 *  identity is never color-alone and no number is gated behind hover. */
function DonutLegend({ buckets, total }: { buckets: Bucket[]; total: number }) {
  return (
    <ul className="viz-legend">
      {buckets.map((bucket) => (
        <li key={bucket.label}>
          <span className="viz-swatch" style={{ background: bucket.color }} />
          <span className="viz-legend-label">{bucket.label}</span>
          <span className="viz-legend-value">
            {bucket.count}
            <small>{Math.round((bucket.count / total) * 100)}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── 3. Attempt pressure — columns, ordered bands ─────────────── */

function AttemptColumns({
  buckets,
  onTip,
}: {
  buckets: Bucket[];
  onTip: (tip: Tip | null) => void;
}) {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  if (total === 0) {
    return <p className="viz-empty">No attempt data recorded.</p>;
  }

  return (
    <div className="viz-columns">
      {buckets.map((bucket) => (
        <div
          key={bucket.label}
          className="viz-col"
          tabIndex={0}
          onPointerMove={(event) =>
            onTip({
              x: event.clientX,
              y: event.clientY,
              label: bucket.label,
              value: `${bucket.count} student${bucket.count === 1 ? "" : "s"}`,
            })
          }
          onPointerLeave={() => onTip(null)}
          onFocus={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            onTip({
              x: box.left + box.width / 2,
              y: box.top,
              label: bucket.label,
              value: `${bucket.count} student${bucket.count === 1 ? "" : "s"}`,
            });
          }}
          onBlur={() => onTip(null)}
        >
          {/* Value on the cap — the axis it replaces. */}
          <span className="viz-col-value">{bucket.count}</span>
          <span className="viz-col-plot">
            <span
              className="viz-col-fill"
              style={{
                height: `${Math.max((bucket.count / max) * 100, 2)}%`,
                background: bucket.color,
              }}
            />
          </span>
          <span className="viz-col-label">{bucket.short}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Table view — the relief every chart here is backed by ────── */

function ChartTable({
  patterns,
  load,
  attempts,
}: {
  patterns: Array<{ course_code: string; count: number }>;
  load: Bucket[];
  attempts: Bucket[];
}) {
  return (
    <div className="viz-table-wrap">
      <table className="viz-table">
        <caption>Backlogs by course</caption>
        <thead>
          <tr>
            <th scope="col">Course</th>
            <th scope="col">Students affected</th>
          </tr>
        </thead>
        <tbody>
          {patterns.slice(0, 8).map((row) => (
            <tr key={row.course_code}>
              <th scope="row">{row.course_code}</th>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="viz-table">
        <caption>Backlog load per student</caption>
        <thead>
          <tr>
            <th scope="col">Band</th>
            <th scope="col">Students</th>
          </tr>
        </thead>
        <tbody>
          {load.map((bucket) => (
            <tr key={bucket.label}>
              <th scope="row">{bucket.label}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="viz-table">
        <caption>Attempt pressure</caption>
        <thead>
          <tr>
            <th scope="col">Attempts made</th>
            <th scope="col">Students</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((bucket) => (
            <tr key={bucket.label}>
              <th scope="row">{bucket.label}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── The section ──────────────────────────────────────────────── */

export default function DepartmentCharts({
  dashboard,
}: {
  dashboard: DashboardData;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [asTable, setAsTable] = useState(false);

  const load = useMemo(
    () =>
      bucketize(
        dashboard.students.map((student) => student.active_backlog_count),
        [
          { label: "1 backlog", short: "1", test: (n) => n === 1 },
          { label: "2 backlogs", short: "2", test: (n) => n === 2 },
          { label: "3 backlogs", short: "3", test: (n) => n === 3 },
          { label: "4 or more", short: "4+", test: (n) => n >= 4 },
        ],
      ),
    [dashboard.students],
  );

  const attempts = useMemo(
    () =>
      bucketize(
        dashboard.students.map((student) => student.max_attempts_made),
        [
          { label: "1 attempt", short: "1", test: (n) => n <= 1 },
          { label: "2 attempts", short: "2", test: (n) => n === 2 },
          { label: "3 or more", short: "3+", test: (n) => n >= 3 },
        ],
      ),
    [dashboard.students],
  );

  return (
    <section className="viz-root" aria-label="Department analytics">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
            Department analytics
          </p>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">
            Where the backlog load sits
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((current) => !current)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          aria-pressed={asTable}
        >
          {asTable ? <ChartColumnBig size={13} /> : <Table2 size={13} />}
          {asTable ? "Charts" : "Table view"}
        </button>
      </div>

      {asTable ? (
        <ChartTable
          patterns={dashboard.course_patterns}
          load={load}
          attempts={attempts}
        />
      ) : (
        <div className="viz-grid">
          <figure className="viz-card">
            <figcaption>
              <h4>Backlogs by course</h4>
              <p>Students affected, highest first</p>
            </figcaption>
            <CourseBars
              patterns={dashboard.course_patterns}
              onTip={setTip}
            />
          </figure>

          <figure className="viz-card">
            <figcaption>
              <h4>Backlog load per student</h4>
              <p>Share of affected students by band</p>
            </figcaption>
            <LoadDonut
              buckets={load}
              total={dashboard.students.length}
              onTip={setTip}
            />
          </figure>

          <figure className="viz-card">
            <figcaption>
              <h4>Attempt pressure</h4>
              <p>Highest attempts made on any subject</p>
            </figcaption>
            <AttemptColumns buckets={attempts} onTip={setTip} />
          </figure>
        </div>
      )}

      <Tooltip tip={tip} />
    </section>
  );
}
