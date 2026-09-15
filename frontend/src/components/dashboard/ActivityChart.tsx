import { highlightedActivityDay, weeklyActivity } from "../../data/dashboard";
import { SurfaceCard } from "./Ui";

export default function ActivityChart() {
  const max = Math.max(...weeklyActivity.map((item) => Math.max(item.hours, item.target)));
  const total = weeklyActivity.reduce((sum, item) => sum + item.hours, 0);

  return (
    <SurfaceCard as="section" aria-label="Weekly study activity">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Activity</p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Weekly study hours
          </h3>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {total.toFixed(1)}h
        </p>
      </div>
      <p className="sr-only">
        You studied {total.toFixed(1)} hours this week. Saturday was the most active day.
      </p>
      <div className="mt-6 flex h-36 items-end gap-2 sm:gap-3">
        {weeklyActivity.map((item) => {
          const emphasized = item.day === highlightedActivityDay;
          return (
            <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-28 w-full items-end justify-center">
                <span
                  className="absolute bottom-0 w-full rounded-full border border-dashed border-gray-200 dark:border-dark-border"
                  style={{ height: `${(item.target / max) * 100}%` }}
                  aria-hidden="true"
                />
                <span
                  className={`origin-bottom w-3 rounded-full sm:w-4 ${
                    emphasized
                      ? "bg-primary-500 dark:bg-primary-400"
                      : "bg-secondary-400 dark:bg-secondary-500"
                  } animate-bar-in`}
                  style={{ height: `${(item.hours / max) * 100}%` }}
                />
              </div>
              <span
                className={`text-xs ${
                  emphasized
                    ? "font-medium text-primary-600 dark:text-primary-300"
                    : "text-gray-400"
                }`}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
