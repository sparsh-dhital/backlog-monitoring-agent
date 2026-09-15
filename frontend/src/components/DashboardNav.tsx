import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Bell,
  CircleUserRound,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  X,
} from "lucide-react";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import { supabaseAuth } from "../supabaseClient";
import { readOtpSession } from "../shared/authSession";
import { userRoles, type UserRole } from "../types/roles";
import {
  dashboardNavigation,
  mobileTabLabel,
  roleBadgeClasses,
} from "../shared/dashboardNavigation";
import "../styles/dashboard-nav.css";

const MOBILE_QUERY = "(max-width: 680px)";

/* ── Sidebar: collapsible rail on desktop/tablet, drawer on phones ── */

export function DashboardSidebar({
  role,
  activeTab,
  onSelect,
  onLogout,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  role: UserRole;
  activeTab: string;
  onSelect: (tab: string) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const roleLabel = userRoles.find((item) => item.id === role)?.label;
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Drawer behaviour: lock the page behind it, focus it, close on Escape or
  // when the viewport grows back to the rail layout.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    const query = window.matchMedia(MOBILE_QUERY);
    const onViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches) onCloseMobile();
    };
    window.addEventListener("keydown", onKeyDown);
    query.addEventListener("change", onViewportChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      query.removeEventListener("change", onViewportChange);
    };
  }, [mobileOpen, onCloseMobile]);

  // Labels are hidden in the collapsed rail; name each icon on hover/focus.
  // Rendered outside the scrolling nav so it is never clipped.
  const showTooltip = (label: string, target: HTMLElement) => {
    if (!collapsed || window.matchMedia(MOBILE_QUERY).matches) return;
    const box = target.getBoundingClientRect();
    setTooltip({ label, top: box.top + box.height / 2 });
  };
  const hideTooltip = () => setTooltip(null);

  const renderItem = (
    label: string,
    Icon: LucideIcon,
    options: { badge?: string; danger?: boolean; onClick?: () => void } = {},
  ) => {
    const active = activeTab === label;
    return (
      <button
        type="button"
        className={`dash-nav-item${active ? " is-active" : ""}${options.danger ? " is-danger" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          hideTooltip();
          if (options.onClick) {
            options.onClick();
            return;
          }
          onSelect(label);
          onCloseMobile();
        }}
        onMouseEnter={(event) => showTooltip(label, event.currentTarget)}
        onMouseLeave={hideTooltip}
        onFocus={(event) => showTooltip(label, event.currentTarget)}
        onBlur={hideTooltip}
      >
        <Icon size={18} aria-hidden="true" />
        <span className="dash-nav-label">{label}</span>
        {options.badge && <span className="dash-nav-badge">{options.badge}</span>}
      </button>
    );
  };

  return (
    <>
      <div
        className={`dash-scrim${mobileOpen ? " is-open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        id="dashboard-navigation"
        className={`dash-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-open" : ""}`}
        aria-label="Dashboard navigation"
      >
        <div className="dash-sidebar-head">
          <Brand compact />
          <div className="dash-sidebar-brand">
            <span className="dash-sidebar-name">EduRecover</span>
            <span className={`dash-sidebar-role ${roleBadgeClasses[role]}`}>
              {roleLabel}
            </span>
          </div>
          <button
            type="button"
            className="dash-sidebar-toggle"
            onClick={() => {
              hideTooltip();
              onToggleCollapsed();
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-controls="dashboard-navigation"
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
          </button>
          <button
            ref={closeRef}
            type="button"
            className="dash-sidebar-close"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="dash-sidebar-nav" aria-label="Workspace">
          <p className="dash-sidebar-heading">Workspace</p>
          <ul>
            {dashboardNavigation[role].map(([label, Icon]) => (
              <li key={label}>
                {renderItem(label, Icon, {
                  badge: label === "Alerts" ? "3" : undefined,
                })}
              </li>
            ))}
          </ul>
        </nav>

        <div className="dash-sidebar-actions">
          {renderItem("Settings", Settings)}
          {renderItem("Logout", ArrowLeft, { danger: true, onClick: onLogout })}
        </div>
      </aside>
      {tooltip && collapsed && (
        <div className="dash-nav-tooltip" style={{ top: tooltip.top }} role="tooltip">
          {tooltip.label}
        </div>
      )}
    </>
  );
}

/* ── Phone bottom bar: Dashboard first, then the next three, then Menu ── */

export function DashboardBottomNav({
  role,
  activeTab,
  onSelect,
  onOpenMenu,
  menuOpen,
}: {
  role: UserRole;
  activeTab: string;
  onSelect: (tab: string) => void;
  onOpenMenu: () => void;
  menuOpen: boolean;
}) {
  const all = dashboardNavigation[role];
  const items = all.slice(0, 4);
  const activeInMenu = !items.some(([label]) => label === activeTab);
  const alertsInMenu =
    !items.some(([label]) => label === "Alerts") &&
    all.some(([label]) => label === "Alerts");

  return (
    <nav className="dash-bottom-nav" aria-label="Quick navigation">
      {items.map(([label, Icon]) => {
        const active = activeTab === label;
        return (
          <button
            key={label}
            type="button"
            className={active ? "is-active" : undefined}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(label)}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{mobileTabLabel[label] ?? label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={activeInMenu || menuOpen ? "is-active" : undefined}
        aria-expanded={menuOpen}
        aria-controls="dashboard-navigation"
        onClick={onOpenMenu}
      >
        <Menu size={20} aria-hidden="true" />
        <span>Menu</span>
        {alertsInMenu && (
          <b className="dash-bottom-badge" aria-label="3 alerts">
            3
          </b>
        )}
      </button>
    </nav>
  );
}

/* ── Top bar ── */

export function DashboardTopbar({
  role,
  onProfile,
}: {
  role: UserRole;
  onProfile: () => void;
}) {
  const roleLabel = userRoles.find((item) => item.id === role)?.label;
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const [{ data: userData }, { data: sessionData }] = await Promise.all([
        supabaseAuth.auth.getUser(),
        supabaseAuth.auth.getSession(),
      ]);
      if (!active) return;
      if (!userData.user) {
        // Registration-number sessions carry no Supabase profile.
        const otpSession = readOtpSession();
        if (otpSession) {
          setProfileName(otpSession.registrationNumber);
          setProfileEmail("Signed in with registration number");
        }
        return;
      }
      const user = userData.user;
      const identityMetadata =
        (user.identities?.find((identity) => identity.provider === "azure")
          ?.identity_data as Record<string, unknown> | undefined) ?? {};
      const metadata = {
        ...identityMetadata,
        ...(user.user_metadata ?? {}),
      };
      const constructedName =
        metadata.given_name && metadata.family_name
          ? `${metadata.given_name} ${metadata.family_name}`
          : null;
      let graphName: string | null = null;
      const isAzureSession =
        user.app_metadata?.provider === "azure" ||
        user.identities?.some((identity) => identity.provider === "azure");
      if (sessionData.session?.provider_token && isAzureSession) {
        try {
          const response = await fetch(
            "https://graph.microsoft.com/v1.0/me?$select=displayName,givenName,surname",
            {
              headers: {
                Authorization: `Bearer ${sessionData.session.provider_token}`,
              },
            },
          );
          if (response.ok) {
            const graphProfile = (await response.json()) as {
              displayName?: string;
              givenName?: string;
              surname?: string;
            };
            graphName =
              graphProfile.displayName ||
              (graphProfile.givenName && graphProfile.surname
                ? `${graphProfile.givenName} ${graphProfile.surname}`
                : null) ||
              null;
          }
        } catch {
          graphName = null;
        }
      }
      const name =
        graphName ||
        metadata.full_name ||
        metadata.name ||
        constructedName ||
        metadata.display_name ||
        metadata.user_name ||
        metadata.preferred_username ||
        user.email?.split("@")[0].toUpperCase() ||
        "Authenticated User";
      setProfileName(String(name));
      setProfileEmail(user.email || "");
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="dashboard-topbar h-16 bg-white border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between gap-4 px-8">
      {/* Brand: phones only, where the sidebar is a hidden drawer */}
      <div className="dash-topbar-brand">
        <Brand compact />
        <span>EduRecover</span>
      </div>

      {/* Search */}
      <div className="dashboard-search flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 h-10 w-80 max-w-full focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition">
        <Search size={15} className="text-slate-400 shrink-0" aria-hidden="true" />
        <input
          aria-label="Search dashboard"
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full h-full placeholder:text-slate-400"
          placeholder="Search students, courses, or IDs..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition duration-150"
          >
            <Bell size={19} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>
          {notificationsOpen && (
            <div className="dashboard-notifications absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Alerts</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Recent academic signals
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                  3 new
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  [
                    "Attempt pressure",
                    "14 students have one attempt remaining",
                    "2h ago",
                    "bg-rose-500",
                  ],
                  [
                    "Duration risk",
                    "6 students are nearing maximum duration",
                    "5h ago",
                    "bg-amber-500",
                  ],
                  [
                    "Recovery milestone",
                    "12 backlogs cleared this term",
                    "Today",
                    "bg-emerald-500",
                  ],
                ].map(([title, detail, time, tone]) => (
                  <button
                    type="button"
                    key={title}
                    onClick={() => setNotificationsOpen(false)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-700">
                        {title}
                      </span>
                      <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                        {detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {time}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="w-full rounded-lg bg-slate-50 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                  Close alerts
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-7 bg-slate-200" />

        {/* Profile */}
        <button
          type="button"
          onClick={onProfile}
          aria-label="Open profile"
          className="flex items-center gap-3 cursor-pointer group text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-200 transition duration-200">
            <CircleUserRound size={19} />
          </div>
          <div className="dashboard-profile-copy flex flex-col leading-tight">
            <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
              {profileName || roleLabel}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {profileEmail || `${roleLabel} · EduRecover`}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
