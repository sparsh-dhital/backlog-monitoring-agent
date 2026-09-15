import { recoverySummary } from "../../data/dashboard";

export default function RecoveryProgress() {
  return (
    <section
      aria-label="Overall recovery progress"
      className="rounded-card bg-gradient-to-br from-secondary-400 to-primary-500 p-6 text-white dark:from-secondary-700 dark:to-primary-700"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-white/80">
        Overall recovery
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-4xl font-medium tracking-tight">{recoverySummary.percent}%</p>
        <p className="max-w-[12rem] text-right text-sm text-white/85">
          {recoverySummary.target}
        </p>
      </div>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-valuenow={recoverySummary.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Recovery completion"
      >
        <div
          className="h-full rounded-full bg-white animate-progress-in"
          style={{
            ["--progress" as string]: `${recoverySummary.percent}%`,
            width: `${recoverySummary.percent}%`,
          }}
        />
      </div>
      <div className="mt-4 grid gap-3 text-sm text-white/90 sm:grid-cols-2">
        <p>{recoverySummary.expected}</p>
        <p>{recoverySummary.supporting}</p>
      </div>
      <p className="mt-3 text-xs text-white/75">{recoverySummary.remaining}</p>
    </section>
  );
}
