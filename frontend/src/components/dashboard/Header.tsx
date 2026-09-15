import { Bell, Command, Search } from "lucide-react";
import ThemeSwitch from "../ThemeSwitch";
import { studentProfile, type NavItem } from "../../data/dashboard";
import { IconButton } from "./Ui";
import Brand from "../Brand";

export default function Header({
  title,
  onOpenMenu,
}: {
  title: NavItem;
  onOpenMenu: () => void;
}) {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-surface-app px-4 sm:h-18 sm:px-6 dark:border-dark-border dark:bg-dark-app">
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 md:hidden dark:border-dark-border dark:text-gray-300"
        aria-label="Open navigation"
        onClick={onOpenMenu}
      >
        <Brand compact />
      </button>

      <div className="min-w-0 flex-1">
        <p className="hidden text-xs text-gray-500 sm:block">Student recovery</p>
        <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg dark:text-gray-50">
          {title}
        </h1>
      </div>

      <label className="relative hidden min-w-0 flex-1 md:block md:max-w-sm lg:max-w-md">
        <span className="sr-only">Search courses, assignments, or resources</span>
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          placeholder="Search courses or deadlines"
          className="h-10 w-full rounded-xl border border-gray-200 bg-surface-alt pl-9 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-dark-border dark:bg-dark-elevated dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-primary-800"
        />
        <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400 lg:inline-flex dark:border-dark-border">
          <Command size={12} /> K
        </span>
      </label>

      <div className="flex items-center gap-2">
        <ThemeSwitch />
        <IconButton label="Notifications">
          <Bell size={18} strokeWidth={1.8} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger" />
        </IconButton>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-xl py-1 pl-1 pr-2 sm:flex"
          aria-label="Account menu"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-dark-tint dark:text-primary-300">
            {studentProfile.initials}
          </span>
          <span className="hidden text-left lg:block">
            <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
              {studentProfile.name.split(" ")[0]}
            </span>
            <span className="block text-xs text-gray-500">Student</span>
          </span>
        </button>
      </div>
    </header>
  );
}
