import {
  Bell,
  BookOpen,
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Settings,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Brand from "../Brand";
import {
  NAV_PRIMARY,
  NAV_SECONDARY,
  studentProfile,
  type NavItem,
} from "../../data/dashboard";

const icons: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  "My Courses": BookOpen,
  "Recovery Plan": Sparkles,
  Assignments: ClipboardList,
  Assessments: GraduationCap,
  Resources: CalendarCheck,
  Progress: LineChart,
  Notifications: Bell,
  Settings: Settings,
  "Help & Support": CircleHelp,
};

export default function Sidebar({
  active,
  onSelect,
}: {
  active: NavItem;
  onSelect: (item: NavItem) => void;
}) {
  return (
    <aside className="hidden h-full flex-col border-r border-gray-200 bg-surface-app md:flex md:w-18 lg:w-56 dark:border-dark-border dark:bg-dark-app">
      <div className="flex h-18 items-center gap-3 border-b border-gray-200 px-3 lg:px-5 dark:border-dark-border">
        <Brand compact />
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            EduRecover
          </p>
          <p className="truncate text-xs text-gray-500">Student workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4 lg:px-3" aria-label="Primary">
        {NAV_PRIMARY.map((item) => {
          const Icon = icons[item];
          const isActive = active === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item}
              className={`flex h-10 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-standard lg:justify-start ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-dark-tint dark:text-primary-300"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-dark-elevated dark:hover:text-gray-200"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="hidden truncate lg:inline">{item}</span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-gray-200 px-2 py-3 lg:px-3 dark:border-dark-border">
        {NAV_SECONDARY.map((item) => {
          const Icon = icons[item];
          const isActive = active === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              aria-label={item}
              className={`flex h-10 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-standard lg:justify-start ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-dark-tint dark:text-primary-300"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-dark-elevated"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="hidden truncate lg:inline">{item}</span>
            </button>
          );
        })}
        <div className="hidden items-center gap-3 px-3 pt-3 lg:flex">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-dark-tint dark:text-primary-300">
            {studentProfile.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
              {studentProfile.name}
            </p>
            <p className="truncate text-xs text-gray-500">{studentProfile.program}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
