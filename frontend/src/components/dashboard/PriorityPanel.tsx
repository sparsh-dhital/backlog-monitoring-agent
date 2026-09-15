import { ArrowUpRight } from "lucide-react";
import { priorities } from "../../data/dashboard";
import { SurfaceCard } from "./Ui";

export default function PriorityPanel({ onOpenPlan }: { onOpenPlan: () => void }) {
  return (
    <SurfaceCard as="section" className="border-primary-100 bg-primary-50/60 dark:border-dark-tint dark:bg-dark-elevated">
      <p className="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-300">
        Next priority
      </p>
      <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
        What you should do next
      </h3>
      <ol className="mt-4 space-y-3">
        {priorities.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={onOpenPlan}
              className="flex w-full items-start gap-3 rounded-xl bg-surface-card p-3 text-left transition-colors duration-standard hover:bg-white dark:bg-dark-card dark:hover:bg-dark-app"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-dark-tint dark:text-primary-300">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">{item.detail}</span>
              </span>
              <ArrowUpRight size={16} className="mt-1 shrink-0 text-gray-400" />
            </button>
          </li>
        ))}
      </ol>
    </SurfaceCard>
  );
}
