import { metrics } from "../../data/dashboard";
import { SurfaceCard } from "./Ui";

function Spark({ values, invert }: { values: readonly number[]; invert?: boolean }) {
  const max = Math.max(...values);
  return (
    <div className="mt-3 flex h-8 items-end gap-0.5" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={`w-1.5 rounded-full ${
            invert ? "bg-white/50" : "bg-primary-200 dark:bg-primary-800"
          } ${index === values.length - 1 ? (invert ? "bg-white" : "bg-primary-500 dark:bg-primary-400") : ""}`}
          style={{ height: `${Math.max(20, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function MetricStrip() {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
      {metrics.map((metric) =>
        metric.highlight ? (
          <article
            key={metric.id}
            className="min-w-[16rem] rounded-2xl bg-gradient-to-br from-primary-500 to-primary-400 p-5 text-white shadow-glow sm:min-w-0 dark:from-primary-700 dark:to-primary-500"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-white/80">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-medium tracking-tight">{metric.value}</p>
            <p className="mt-1 text-xs text-white/80">{metric.delta}</p>
            <p className="mt-2 text-sm text-white/90">{metric.detail}</p>
            <Spark values={metric.spark} invert />
          </article>
        ) : (
          <SurfaceCard key={metric.id} className="min-w-[16rem] sm:min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-50">
              {metric.value}
            </p>
            <p className="mt-1 text-xs font-medium text-secondary-600 dark:text-secondary-400">
              {metric.delta}
            </p>
            <p className="mt-2 text-sm text-gray-500">{metric.detail}</p>
            <Spark values={metric.spark} />
          </SurfaceCard>
        ),
      )}
    </div>
  );
}
