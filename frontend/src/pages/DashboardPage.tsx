import { useState } from "react";
import type { NavItem } from "../data/dashboard";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import BottomNav from "../components/dashboard/BottomNav";
import Hero from "../components/dashboard/Hero";
import MetricStrip from "../components/dashboard/MetricStrip";
import RecoveryProgress from "../components/dashboard/RecoveryProgress";
import CourseProgress from "../components/dashboard/CourseProgress";
import UpcomingPanel from "../components/dashboard/UpcomingPanel";
import ActivityChart from "../components/dashboard/ActivityChart";
import PriorityPanel from "../components/dashboard/PriorityPanel";
import SecondaryView from "../components/dashboard/SecondaryView";
import { NAV_PRIMARY, NAV_SECONDARY } from "../data/dashboard";

export default function DashboardPage() {
  const [active, setActive] = useState<NavItem>("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const select = (item: NavItem) => {
    setActive(item);
    setMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-surface-page px-0 py-0 md:px-4 md:py-6 lg:px-8 dark:bg-dark-page">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block">
        <div className="absolute -left-24 top-10 size-80 rounded-full bg-primary-100 blur-3xl dark:bg-primary-900/30" />
        <div className="absolute right-0 top-24 size-96 rounded-full bg-secondary-100 blur-3xl dark:bg-secondary-900/20" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-shell overflow-hidden border-gray-200 bg-surface-app shadow-none md:min-h-shell md:rounded-3xl md:border md:shadow-shell dark:border-dark-border dark:bg-dark-app">
        <Sidebar active={active} onSelect={select} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={active} onOpenMenu={() => setMenuOpen((open) => !open)} />

          {menuOpen && (
            <div className="border-b border-gray-200 bg-surface-card px-3 py-2 md:hidden dark:border-dark-border dark:bg-dark-card">
              <div className="flex flex-wrap gap-2">
                {[...NAV_PRIMARY, ...NAV_SECONDARY].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => select(item)}
                    className={`rounded-full px-3 py-2 text-xs font-medium ${
                      active === item
                        ? "bg-primary-50 text-primary-700 dark:bg-dark-tint dark:text-primary-300"
                        : "bg-gray-100 text-gray-600 dark:bg-dark-elevated dark:text-gray-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
            {active === "Dashboard" ? (
              <div className="grid gap-4 p-4 sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1.1fr)_20rem]">
                <div className="space-y-4 sm:space-y-5">
                  <Hero onPrimary={() => select("Assignments")} />
                  <MetricStrip />
                  <div className="order-first lg:order-none">
                    <RecoveryProgress />
                  </div>
                  <div className="lg:hidden">
                    <PriorityPanel onOpenPlan={() => select("Recovery Plan")} />
                  </div>
                  <div className="lg:hidden">
                    <UpcomingPanel />
                  </div>
                  <CourseProgress />
                  <ActivityChart />
                </div>
                <aside className="hidden space-y-4 lg:flex lg:flex-col">
                  <UpcomingPanel />
                  <PriorityPanel onOpenPlan={() => select("Recovery Plan")} />
                </aside>
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <SecondaryView view={active} />
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav active={active} onSelect={select} />
    </div>
  );
}
