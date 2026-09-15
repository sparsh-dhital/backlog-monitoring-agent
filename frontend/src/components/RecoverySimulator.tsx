import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  Check,
  FlaskConical,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  UsersRound,
  Zap,
} from "lucide-react";
import { api } from "../api";
import { StatusBadge } from "./WorkspacePrimitives";

/* ─── Model inputs ──────────────────────────────────────────────── */

const supportLevels = [
  { label: "On my own", detail: "Self study only", bonus: 0 },
  { label: "Peer study group", detail: "Weekly group revision", bonus: 0.06 },
  { label: "Faculty mentor", detail: "Assigned mentor check-ins", bonus: 0.13 },
  { label: "Intensive remedial", detail: "Structured remedial class", bonus: 0.2 },
] as const;

const scenarios = [
  { id: "cautious", label: "Cautious", factor: 0.85, icon: TrendingDown },
  { id: "realistic", label: "Realistic", factor: 1, icon: Target },
  { id: "ambitious", label: "Ambitious", factor: 1.12, icon: TrendingUp },
] as const;

type ScenarioId = (typeof scenarios)[number]["id"];

/** Attendance below this is a debarment gate, mirroring the exam-cell feed. */
const ATTENDANCE_GATE = 75;
/** Weekly hours per subject treated as full preparation effort. */
const FULL_EFFORT_HOURS = 12;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export interface SimulatorCase {
  studentId: string;
  backlogCount: number;
  maxAllowedBacklogs: number;
  maxAttempts: number;
  highestAttemptsMade: number;
  live: boolean;
}

const fallbackCase: SimulatorCase = {
  studentId: "Sample case",
  backlogCount: 3,
  maxAllowedBacklogs: 4,
  maxAttempts: 3,
  highestAttemptsMade: 1,
  live: false,
};

interface SimulationInputs {
  subjectsPerTerm: number;
  studyHours: number;
  attendance: number;
  supportIndex: number;
  terms: number;
  scenario: ScenarioId;
}

const defaultInputs = (backlogCount: number): SimulationInputs => ({
  subjectsPerTerm: Math.max(1, Math.min(2, backlogCount)),
  studyHours: 12,
  attendance: 78,
  supportIndex: 1,
  terms: 2,
  scenario: "realistic",
});

/* ─── The projection model ──────────────────────────────────────── */

interface TermProjection {
  term: number;
  attempted: number;
  cleared: number;
  remaining: number;
}

interface SimulationResult {
  passProbability: number;
  attendanceEligible: boolean;
  timeline: TermProjection[];
  remainingAtEnd: number;
  clearedTotal: number;
  promotionEligible: boolean;
  exhaustionRisk: number;
  termsToClear: number | null;
  doNothingRemaining: number;
  verdict: "clear" | "on-track" | "tight" | "at-risk";
}

function simulate(
  inputs: SimulationInputs,
  caseData: SimulatorCase,
): SimulationResult {
  const { studyHours, attendance, supportIndex, terms } = inputs;
  const factor =
    scenarios.find((item) => item.id === inputs.scenario)?.factor ?? 1;
  // The slider max tracks the case, which can change under it after a fetch.
  const subjectsPerTerm = clamp(
    inputs.subjectsPerTerm,
    0,
    Math.max(1, caseData.backlogCount),
  );

  const attendanceEligible = attendance >= ATTENDANCE_GATE;
  const effortPerSubject =
    subjectsPerTerm > 0 ? studyHours / subjectsPerTerm : 0;
  const effortScore = clamp(effortPerSubject / FULL_EFFORT_HOURS, 0, 1);
  const attendanceScore = clamp((attendance - 45) / 50, 0, 1);

  let passProbability =
    0.16 +
    effortScore * 0.44 +
    attendanceScore * 0.22 +
    supportLevels[supportIndex].bonus;
  passProbability *= factor;
  // Falling under the attendance gate blocks most exam registrations outright.
  if (!attendanceEligible) passProbability *= 0.4;
  passProbability = clamp(passProbability, 0.02, 0.95);
  // Sitting out the term means there is no exam to pass.
  if (subjectsPerTerm === 0) passProbability = 0;

  const timeline: TermProjection[] = [];
  let remaining = caseData.backlogCount;
  let termsToClear: number | null = null;

  for (let term = 1; term <= terms; term += 1) {
    const attempted = Math.min(subjectsPerTerm, remaining);
    const cleared = attempted * passProbability;
    remaining = Math.max(0, remaining - cleared);
    timeline.push({ term, attempted, cleared, remaining });
    if (termsToClear === null && remaining < 0.5) termsToClear = term;
  }

  const attemptsRemaining = Math.max(
    1,
    caseData.maxAttempts - caseData.highestAttemptsMade,
  );
  // Chance the most-pressured subject burns every remaining attempt.
  const exhaustionRisk =
    subjectsPerTerm > 0
      ? Math.pow(1 - passProbability, Math.min(terms, attemptsRemaining))
      : 1;

  const promotionEligible =
    Math.round(remaining) <= caseData.maxAllowedBacklogs;

  let verdict: SimulationResult["verdict"];
  if (remaining < 0.5) verdict = "clear";
  else if (promotionEligible && exhaustionRisk < 0.3) verdict = "on-track";
  else if (promotionEligible) verdict = "tight";
  else verdict = "at-risk";

  return {
    passProbability,
    attendanceEligible,
    timeline,
    remainingAtEnd: remaining,
    clearedTotal: caseData.backlogCount - remaining,
    promotionEligible,
    exhaustionRisk,
    termsToClear,
    doNothingRemaining: caseData.backlogCount,
    verdict,
  };
}

/* ─── Small controls ────────────────────────────────────────────── */

function ParameterSlider({
  icon: Icon,
  label,
  hint,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
  disabled,
}: {
  icon: typeof BookOpen;
  label: string;
  hint: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className={`sim-param ${disabled ? "is-disabled" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 leading-tight">
              {label}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {hint}
            </p>
          </div>
        </div>
        <span className="sim-param-value shrink-0">{display}</span>
      </div>
      <input
        type="range"
        className="sim-range"
        style={{ ["--sim-progress" as string]: `${progress}%` }}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function ResultStat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "indigo" | "emerald" | "amber" | "rose";
}) {
  return (
    <div className={`sim-result-stat sim-tone-${tone}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
        {label}
      </span>
      <strong className="text-2xl font-bold tracking-tight mt-1.5 block">
        {value}
      </strong>
      <small className="text-[11px] font-medium opacity-70 mt-0.5 block">
        {detail}
      </small>
    </div>
  );
}

/* ─── The simulator ─────────────────────────────────────────────── */

const verdictCopy = {
  clear: {
    title: "All backlogs cleared",
    tone: "emerald" as const,
    icon: GraduationCap,
  },
  "on-track": {
    title: "Promotion stays on track",
    tone: "emerald" as const,
    icon: ShieldCheck,
  },
  tight: {
    title: "Eligible, but with no margin",
    tone: "amber" as const,
    icon: TriangleAlert,
  },
  "at-risk": {
    title: "Promotion goes to review",
    tone: "rose" as const,
    icon: TriangleAlert,
  },
};

export default function RecoverySimulator({
  studentId,
}: {
  studentId?: string;
}) {
  const [caseData, setCaseData] = useState<SimulatorCase>(fallbackCase);
  const [inputs, setInputs] = useState<SimulationInputs>(() =>
    defaultInputs(fallbackCase.backlogCount),
  );
  const [liveCalculate, setLiveCalculate] = useState(true);
  const [committed, setCommitted] = useState<SimulationInputs | null>(null);
  const [running, setRunning] = useState(false);

  // Pull the rule-engine facts for the focused student (no AI call); fall back to the sample.
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    api
      .evaluation(studentId)
      .then((evaluation) => {
        if (!active) return;
        const next: SimulatorCase = {
          studentId,
          backlogCount: evaluation.active_backlog_count,
          maxAllowedBacklogs: evaluation.max_allowed_backlogs,
          maxAttempts: evaluation.max_attempts ?? 3,
          highestAttemptsMade: evaluation.backlog_details.reduce(
            (highest, item) => Math.max(highest, item.attempts_made),
            0,
          ),
          live: true,
        };
        setCaseData(next);
        setInputs(defaultInputs(next.backlogCount));
        setCommitted(null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [studentId]);

  const activeInputs = liveCalculate ? inputs : (committed ?? inputs);
  const result = useMemo(
    () => simulate(activeInputs, caseData),
    [activeInputs, caseData],
  );
  const stale = !liveCalculate && committed !== null && committed !== inputs;

  const runSimulation = () => {
    setRunning(true);
    setCommitted(inputs);
    window.setTimeout(() => setRunning(false), 420);
  };

  const reset = () => {
    const next = defaultInputs(caseData.backlogCount);
    setInputs(next);
    setCommitted(liveCalculate ? null : next);
  };

  const update = <K extends keyof SimulationInputs>(
    key: K,
    value: SimulationInputs[K],
  ) => setInputs((current) => ({ ...current, [key]: value }));

  const verdict = verdictCopy[result.verdict];
  const VerdictIcon = verdict.icon;
  const maxSubjects = Math.max(1, caseData.backlogCount);
  const support = supportLevels[activeInputs.supportIndex];

  return (
    <section className="sim-root px-8 py-8" aria-label="What-if recovery simulator">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
            What-if simulator
          </p>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Predict your recovery
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-lg">
            Move the five levers below to see where your backlogs, promotion
            eligibility and graduation timeline land.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={caseData.live ? "success" : "neutral"}>
            {caseData.live ? `Live case · ${caseData.studentId}` : "Sample case"}
          </StatusBadge>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-5">
        {/* ── Parameters ── */}
        <div className="bg-white/60 rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Your plan
            </p>
            {/* The cool toggle */}
            <label className="sim-switch" title="Recalculate as you drag">
              <input
                type="checkbox"
                checked={liveCalculate}
                onChange={(event) => {
                  const next = event.target.checked;
                  setLiveCalculate(next);
                  if (!next) setCommitted(inputs);
                }}
              />
              <span className="sim-switch-track">
                <span className="sim-switch-thumb">
                  <Zap size={10} />
                </span>
              </span>
              <span className="sim-switch-label">
                {liveCalculate ? "Live calculate" : "Manual run"}
              </span>
            </label>
          </div>

          {/* Scenario segmented toggle */}
          <div
            className="sim-segment"
            role="radiogroup"
            aria-label="Projection scenario"
          >
            <span
              className="sim-segment-glider"
              style={{
                transform: `translateX(${
                  scenarios.findIndex((item) => item.id === inputs.scenario) *
                  100
                }%)`,
              }}
            />
            {scenarios.map((item) => {
              const ScenarioIcon = item.icon;
              const active = inputs.scenario === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update("scenario", item.id)}
                  className={active ? "is-active" : ""}
                >
                  <ScenarioIcon size={13} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-5 mt-5">
            <ParameterSlider
              icon={BookOpen}
              label="Subjects attempted per term"
              hint={`You have ${caseData.backlogCount} pending backlog${caseData.backlogCount === 1 ? "" : "s"}`}
              value={Math.min(inputs.subjectsPerTerm, maxSubjects)}
              display={`${Math.min(inputs.subjectsPerTerm, maxSubjects)}`}
              min={0}
              max={maxSubjects}
              onChange={(value) => update("subjectsPerTerm", value)}
            />
            <ParameterSlider
              icon={Sparkles}
              label="Study hours per week"
              hint={
                inputs.subjectsPerTerm > 0
                  ? `${(inputs.studyHours / inputs.subjectsPerTerm).toFixed(1)} hrs per subject`
                  : "Spread across attempted subjects"
              }
              value={inputs.studyHours}
              display={`${inputs.studyHours} hrs`}
              min={0}
              max={40}
              onChange={(value) => update("studyHours", value)}
            />
            <ParameterSlider
              icon={CalendarClock}
              label="Class attendance"
              hint={
                inputs.attendance >= ATTENDANCE_GATE
                  ? "Above the eligibility gate"
                  : `Below ${ATTENDANCE_GATE}% — exam registration blocked`
              }
              value={inputs.attendance}
              display={`${inputs.attendance}%`}
              min={40}
              max={100}
              onChange={(value) => update("attendance", value)}
            />
            <ParameterSlider
              icon={UsersRound}
              label="Support level"
              hint={support.detail}
              value={inputs.supportIndex}
              display={support.label}
              min={0}
              max={supportLevels.length - 1}
              onChange={(value) => update("supportIndex", value)}
            />
            <ParameterSlider
              icon={GraduationCap}
              label="Terms you are planning for"
              hint="How far ahead this projection runs"
              value={inputs.terms}
              display={`${inputs.terms} term${inputs.terms === 1 ? "" : "s"}`}
              min={1}
              max={4}
              onChange={(value) => update("terms", value)}
            />
          </div>

          {!liveCalculate && (
            <button
              type="button"
              onClick={runSimulation}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
            >
              <FlaskConical size={15} />
              {stale ? "Run simulation" : "Simulation up to date"}
            </button>
          )}
        </div>

        {/* ── Results ── */}
        <div
          className={`flex flex-col gap-4 ${running ? "sim-running" : ""}`}
          aria-live="polite"
        >
          {/* Verdict */}
          <div className={`sim-verdict sim-verdict-${verdict.tone}`}>
            <div className="flex items-start gap-4">
              <span className="sim-verdict-icon">
                <VerdictIcon size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                  Projected after {activeInputs.terms} term
                  {activeInputs.terms === 1 ? "" : "s"}
                </p>
                <h2 className="text-xl font-bold tracking-tight">
                  {verdict.title}
                </h2>
                <p className="text-sm opacity-80 mt-1.5 leading-relaxed">
                  {result.attendanceEligible
                    ? `About ${Math.round(result.clearedTotal * 10) / 10} of ${caseData.backlogCount} backlogs clear, leaving ${Math.max(0, Math.round(result.remainingAtEnd))} against a limit of ${caseData.maxAllowedBacklogs}.`
                    : `Attendance is below ${ATTENDANCE_GATE}%, so most exam registrations are blocked before revision even counts.`}
                </p>
              </div>
            </div>
          </div>

          {/* Result stats */}
          <div className="grid grid-cols-2 gap-3">
            <ResultStat
              label="Pass chance"
              value={`${Math.round(result.passProbability * 100)}%`}
              detail="Per subject attempted"
              tone={
                result.passProbability >= 0.6
                  ? "emerald"
                  : result.passProbability >= 0.4
                    ? "amber"
                    : "rose"
              }
            />
            <ResultStat
              label="Backlogs left"
              value={String(Math.max(0, Math.round(result.remainingAtEnd)))}
              detail={`Limit is ${caseData.maxAllowedBacklogs}`}
              tone={result.promotionEligible ? "emerald" : "rose"}
            />
            <ResultStat
              label="Attempt risk"
              value={`${Math.round(result.exhaustionRisk * 100)}%`}
              detail={`Max ${caseData.maxAttempts} attempts allowed`}
              tone={
                result.exhaustionRisk < 0.2
                  ? "emerald"
                  : result.exhaustionRisk < 0.45
                    ? "amber"
                    : "rose"
              }
            />
            <ResultStat
              label="Clear by"
              value={
                result.termsToClear
                  ? `Term ${result.termsToClear}`
                  : `> ${activeInputs.terms}`
              }
              detail={
                result.termsToClear
                  ? "All backlogs settled"
                  : "Extend the plan window"
              }
              tone={result.termsToClear ? "indigo" : "amber"}
            />
          </div>

          {/* Term-by-term projection */}
          <div className="bg-white/60 rounded-2xl border border-white/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Term by term
              </p>
              <span className="text-[11px] font-semibold text-slate-400">
                Backlogs remaining
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="sim-track-row">
                <span className="sim-track-label">Today</span>
                <div className="sim-track">
                  <span
                    className="sim-track-fill is-base"
                    style={{ width: "100%" }}
                  />
                </div>
                <span className="sim-track-value">
                  {caseData.backlogCount}
                </span>
              </div>
              {result.timeline.map((entry) => {
                const width =
                  caseData.backlogCount > 0
                    ? (entry.remaining / caseData.backlogCount) * 100
                    : 0;
                const settled = entry.remaining < 0.5;
                return (
                  <div key={entry.term} className="sim-track-row">
                    <span className="sim-track-label">Term {entry.term}</span>
                    <div className="sim-track">
                      <span
                        className={`sim-track-fill ${settled ? "is-clear" : ""}`}
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                    <span className="sim-track-value">
                      {settled ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        Math.round(entry.remaining * 10) / 10
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-4 pt-4 border-t border-slate-100">
              Doing nothing leaves all {result.doNothingRemaining} backlogs
              pending and pushes promotion to review.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11px] font-medium text-slate-400 mt-6 max-w-2xl">
        Projections are indicative. They use your institution's regulation
        limits — {caseData.maxAllowedBacklogs} backlogs for promotion and{" "}
        {caseData.maxAttempts} attempts per subject — but outcomes depend on
        exam performance. Confirm any plan with your mentor.
      </p>
    </section>
  );
}
