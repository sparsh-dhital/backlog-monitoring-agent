import { ArrowUpRight } from "lucide-react";
import { courses } from "../../data/dashboard";
import { StatusChip, SurfaceCard } from "./Ui";

export default function CourseProgress() {
  return (
    <SurfaceCard as="section" aria-label="Course progress" className="p-0">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Courses</p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Recovery by subject
          </h3>
        </div>
      </div>
      <ul className="mt-3 divide-y divide-gray-100 dark:divide-dark-border">
        {courses.map((course) => (
          <li key={course.code} className="flex items-center gap-3 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xs font-semibold text-primary-700 dark:bg-dark-tint dark:text-primary-300">
              {course.code.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {course.name}
                </p>
                <StatusChip status={course.status} />
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-elevated">
                <div
                  className="h-full rounded-full bg-secondary-500 dark:bg-secondary-400"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                {course.progress}% · {course.nextAction}
                <ArrowUpRight size={12} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}
