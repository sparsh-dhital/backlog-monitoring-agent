import { ArrowUpRight } from "lucide-react";
import { heroCopy } from "../../data/dashboard";

export default function Hero({ onPrimary }: { onPrimary: () => void }) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary-600 dark:text-primary-300">
          {heroCopy.eyebrow}
        </p>
        <h2 className="text-2xl font-medium tracking-tight text-gray-900 sm:text-3xl dark:text-gray-50">
          {heroCopy.title}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {heroCopy.supportingText}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-surface-card px-3 text-sm text-gray-600 dark:border-dark-border dark:bg-dark-card dark:text-gray-300">
          {heroCopy.dateLabel}
        </span>
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white transition-colors duration-standard hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400"
        >
          {heroCopy.primaryAction}
          <ArrowUpRight size={16} />
        </button>
      </div>
    </section>
  );
}
