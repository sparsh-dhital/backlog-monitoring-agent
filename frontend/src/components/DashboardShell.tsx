import { useState, useEffect } from "react";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ClipboardCheck,
  Ellipsis,
  Home,
  LineChart,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
  CircleUserRound,
  FileText
} from "lucide-react";
import { userRoles, type UserRole } from "../types/roles";
import { supabaseAuth } from "../supabaseClient";
import Brand from "./Brand";

export const dashboardNavigation = {
  student: [
    ["Dashboard", Home],
    ["My backlogs", Archive],
    ["Recovery plan", Sparkles],
    ["Exams", ClipboardCheck],
    ["Progress", LineChart],
    ["Notifications", Bell],
  ],
  mentor: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Interventions", Sparkles],
    ["Patterns", BarChart3],
    ["Alerts", Bell],
    ["Reports", FileText],
  ],
  hod: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Backlogs", Archive],
    ["Patterns", BarChart3],
    ["Interventions", Sparkles],
    ["Examinations", ClipboardCheck],
    ["Alerts", Bell],
    ["Reports", FileText],
  ],
  exam: [
    ["Dashboard", Home],
    ["Registrations", ClipboardCheck],
    ["Eligibility", ShieldCheck],
    ["Fee clearance", FileText],
    ["Alerts", Bell],
    ["Reports", LineChart],
  ],
  placement: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Readiness", BriefcaseBusiness],
    ["Backlog constraints", Archive],
    ["Alerts", Bell],
    ["Reports", LineChart],
  ],
} as const;

export function DashboardSidebar({
  role,
  activeTab,
  onSelect,
  onLogout,
}: {
  role: UserRole;
  activeTab: string;
  onSelect: (tab: string) => void;
  onLogout: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const roleLabel = userRoles.find((item) => item.id === role)?.label;
  const roleBadgeColors: Record<string, string> = {
    hod: "bg-brand-100 text-brand-700",
    mentor: "bg-secondary/10 text-secondary",
    student: "bg-positive/10 text-positive",
    exam: "bg-warning/10 text-warning",
    placement: "bg-critical/10 text-critical",
  };
  
  const navItems = dashboardNavigation[role] || dashboardNavigation.student;
  const mobilePrimaryItems = navItems.slice(0, 4);
  // const mobileMoreItems = navItems.slice(4);

  const selectMobileItem = (label: string) => {
    setMoreOpen(false);
    onSelect(label);
  };

  return (
    <aside
      className="dashboard-sidebar flex flex-col w-64 shrink-0 h-full bg-surface border-r border-border-light z-20"
      aria-label="Dashboard navigation"
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
        <Brand compact />
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-brand-900 tracking-tight">
            EduRecover
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 self-start ${roleBadgeColors[role] ?? "bg-slate-100 text-slate-600"}`}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="px-3 mb-3 text-[11px] font-bold text-text-secondary uppercase tracking-widest">
          Workspace
        </p>
        <div className="flex flex-col gap-1">
          {navItems.map(([label, Icon]) => {
            const LabelIcon = Icon as any;
            return (
              <button
                key={label as string}
                type="button"
                aria-current={activeTab === label ? "page" : undefined}
                onClick={() => onSelect(label as string)}
                className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium tracking-tight transition-all duration-150 ${
                  activeTab === label
                    ? "bg-brand-500 text-white shadow-subtle"
                    : "text-text-secondary hover:bg-brand-50 hover:text-brand-900"
                }`}
              >
                <LabelIcon
                  size={18}
                  className={
                    activeTab === label
                      ? "text-brand-100"
                      : "text-text-secondary group-hover:text-brand-600"
                  }
                />
                <span className="flex-1 text-left">{label as string}</span>
                {label === "Alerts" && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTab === label
                        ? "bg-white/20 text-white"
                        : "bg-critical/10 text-critical"
                    }`}
                  >
                    3
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-border-light flex flex-col gap-1 hidden lg:flex">
        <button
          type="button"
          onClick={() => onSelect("Settings")}
          aria-current={activeTab === "Settings" ? "page" : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium tracking-tight transition-all duration-150 ${
            activeTab === "Settings"
              ? "bg-brand-500 text-white"
              : "text-text-secondary hover:bg-brand-50 hover:text-brand-900"
          }`}
        >
          <Settings
            size={18}
            className={
              activeTab === "Settings" ? "text-brand-100" : "text-text-secondary"
            }
          />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium tracking-tight text-text-secondary hover:bg-critical/10 hover:text-critical transition-all duration-150"
        >
          <ArrowLeft size={18} />
          <span>Logout</span>
        </button>
      </div>

      <div className="dashboard-mobile-nav lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border-light flex justify-around p-2 z-50">
        {mobilePrimaryItems.map(([label, Icon]) => {
          const LabelIcon = Icon as any;
          return (
            <button
              key={label as string}
              type="button"
              aria-current={activeTab === label ? "page" : undefined}
              onClick={() => selectMobileItem(label as string)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                activeTab === label ? "text-brand-600" : "text-text-secondary"
              }`}
            >
              <LabelIcon size={20} />
              <span className="text-[10px] font-medium mt-1">
                {label === "Dashboard" ? "Overview" : label as string}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((current) => !current)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            moreOpen ? "text-brand-600" : "text-text-secondary"
          }`}
        >
          {moreOpen ? <X size={20} /> : <Ellipsis size={20} />}
          <span className="text-[10px] font-medium mt-1">More</span>
        </button>
      </div>
    </aside>
  );
}

export function DashboardTopbar({ role }: { role: UserRole }) {
  const roleLabel = userRoles.find((item) => item.id === role)?.label;
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  useEffect(() => {
    let active = true;
    supabaseAuth.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      const metadata = data.user.user_metadata ?? {};
      const name =
        metadata.full_name ||
        metadata.name ||
        metadata.user_name ||
        metadata.preferred_username ||
        data.user.email?.split("@")[0] ||
        "Authenticated user";
      setProfileName(String(name));
      setProfileEmail(data.user.email || "");
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="dashboard-topbar h-16 bg-surface border-b border-border-light sticky top-0 z-10 flex items-center justify-between px-6 lg:px-8">
      <div className="dashboard-search flex items-center gap-3 bg-brand-50 border border-border-light rounded-lg px-4 h-10 w-full max-w-sm focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300 transition-all">
        <Search size={16} className="text-text-secondary shrink-0" />
        <input
          aria-label="Search dashboard"
          className="bg-transparent border-none outline-none text-sm text-text-primary w-full placeholder:text-text-secondary"
          placeholder="Search students, courses..."
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 text-text-secondary hover:text-brand-900 hover:bg-brand-50 rounded-lg transition-all duration-150"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full ring-2 ring-surface" />
        </button>

        <div className="w-px h-6 bg-border-light hidden sm:block" />

        <div className="hidden sm:flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 transition-all duration-200">
            <CircleUserRound size={18} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-text-primary group-hover:text-brand-600 transition-colors">
              {profileName || roleLabel}
            </span>
            {profileEmail && (
              <span className="text-xs text-text-secondary">{profileEmail}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function DashboardShell({
  role,
  activeTab,
  onSelect,
  onLogout,
  children,
}: {
  role: UserRole;
  activeTab: string;
  onSelect: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] bg-brand-50 text-text-primary font-sans overflow-hidden">
      <div className="hidden lg:block">
        <DashboardSidebar
          role={role}
          activeTab={activeTab}
          onSelect={onSelect}
          onLogout={onLogout}
        />
      </div>
      <div className="flex flex-col flex-1 h-full min-w-0">
        <DashboardTopbar role={role} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
