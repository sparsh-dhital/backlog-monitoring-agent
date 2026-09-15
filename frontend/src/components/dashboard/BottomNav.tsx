import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MOBILE_NAV, type NavItem } from "../../data/dashboard";

const icons: Record<(typeof MOBILE_NAV)[number], LucideIcon> = {
  Dashboard: LayoutDashboard,
  "My Courses": BookOpen,
  "Recovery Plan": Sparkles,
  Assignments: ClipboardList,
  Progress: LineChart,
};

export default function BottomNav({
  active,
  onSelect,
}: {
  active: NavItem;
  onSelect: (item: NavItem) => void;
}) {
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-surface-card/95 px-2 pb-3 pt-2 backdrop-blur md:hidden dark:border-dark-border dark:bg-dark-card/95"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {MOBILE_NAV.map((item) => {
          const Icon = icons[item];
          const isActive = active === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[0.65rem] font-medium ${
                isActive
                  ? "text-primary-600 dark:text-primary-300"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.replace("My ", "")}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
