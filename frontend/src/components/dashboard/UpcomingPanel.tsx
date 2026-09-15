import { useMemo, useState } from "react";
import { deadlines, weekDays } from "../../data/dashboard";

const priorityDot: Record<string, string> = {
  High: "bg-danger",
  Medium: "bg-warning",
  Low: "bg-secondary-500",
};

export default function UpcomingPanel() {
  const [dayIndex, setDayIndex] = useState(0);
  const items = useMemo(
    () => deadlines.filter((item) => item.dayIndex === dayIndex),
    [dayIndex],
  );

  return (
    <section
      aria-label="Upcoming deadlines"
      className="flex h-full flex-col rounded-card bg-gradient-to-br from-secondary-400/90 to-primary-500 p-5 text-white dark:from-secondary-800 dark:to-primary-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/75">
            This week
          </p>
          <h3 className="mt-1 text-lg font-semibold">Upcoming deadlines</h3>
        </div>
        <p className="text-sm text-white/80">Sep 8–14</p>
      </div>

      <div className="mt-4 flex gap-1" role="tablist" aria-label="Week days">
        {weekDays.map((day, index) => {
          const active = index === dayIndex;
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDayIndex(index)}
              className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl text-xs font-medium transition-colors duration-standard ${
                active
                  ? "bg-white text-primary-700"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 flex-1 space-y-3">
        {items.length === 0 ? (
          <li className="rounded-2xl bg-white/10 p-4 text-sm text-white/80">
            No deadlines on this day. Use the extra time on a recovery module.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-white/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-xs">
                  <span className={`size-1.5 rounded-full ${priorityDot[item.priority]}`} />
                  {item.priority}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/75">
                {item.course} · {item.time}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
