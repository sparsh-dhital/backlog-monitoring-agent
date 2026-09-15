import { assessments, courses, notifications, planSteps, resources } from "../../data/dashboard";
import { StatusChip, SurfaceCard } from "./Ui";
import type { NavItem } from "../../data/dashboard";

function SimpleTable({
  title,
  eyebrow,
  rows,
}: {
  title: string;
  eyebrow: string;
  rows: string[][];
}) {
  return (
    <SurfaceCard as="section">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
      <ul className="mt-4 divide-y divide-gray-100 dark:divide-dark-border">
        {rows.map((row) => (
          <li
            key={row.join("-")}
            className="grid gap-1 py-3 sm:grid-cols-4 sm:items-center sm:gap-3"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{row[0]}</p>
            <p className="text-sm text-gray-500">{row[1]}</p>
            <p className="text-sm text-gray-500">{row[2]}</p>
            <div className="sm:justify-self-start">
              <StatusChip status={row[3]} />
            </div>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}

export default function SecondaryView({ view }: { view: NavItem }) {
  if (view === "My Courses") {
    return (
      <SimpleTable
        eyebrow="Enrolled recovery courses"
        title="Your academic load"
        rows={courses.map((course) => [
          course.name,
          course.code,
          `${course.progress}% complete`,
          course.status,
        ])}
      />
    );
  }
  if (view === "Recovery Plan") {
    return (
      <SimpleTable
        eyebrow="Recommended sequence"
        title="This week's recovery plan"
        rows={planSteps.map((row) => [...row])}
      />
    );
  }
  if (view === "Assignments") {
    return (
      <SimpleTable
        eyebrow="Pending work"
        title="Assignments"
        rows={courses
          .filter((course) => course.status !== "Completed")
          .map((course) => [course.nextAction, course.name, `${course.progress}%`, course.status])}
      />
    );
  }
  if (view === "Assessments") {
    return (
      <SimpleTable
        eyebrow="Recent results"
        title="Assessment feedback"
        rows={assessments.map((row) => [...row])}
      />
    );
  }
  if (view === "Resources") {
    return (
      <SimpleTable
        eyebrow="Recommended learning"
        title="Resources"
        rows={resources.map((row) => [...row])}
      />
    );
  }
  if (view === "Progress") {
    return (
      <SimpleTable
        eyebrow="Term movement"
        title="Recovery progress"
        rows={[
          ["Backlog clearance", "78%", "Up 12% this term", "On track"],
          ["Mentor actions", "4 of 5", "One meeting pending", "Needs attention"],
          ["Next milestone", "1 course", "Clear before placement review", "At risk"],
        ]}
      />
    );
  }
  if (view === "Notifications") {
    return (
      <SimpleTable
        eyebrow="Inbox"
        title="Notifications"
        rows={notifications.map((row) => [...row])}
      />
    );
  }
  if (view === "Settings") {
    return (
      <SurfaceCard>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Settings</h2>
        <p className="mt-2 text-sm text-gray-500">
          Profile, notification, and study-reminder preferences stay in this quiet workspace.
        </p>
      </SurfaceCard>
    );
  }
  return (
    <SurfaceCard>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Help & Support</h2>
      <p className="mt-2 text-sm text-gray-500">
        Contact your mentor or examination cell without leaving the recovery workspace.
      </p>
    </SurfaceCard>
  );
}
