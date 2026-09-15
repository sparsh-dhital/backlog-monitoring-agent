import {
  Archive,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  HandHelping,
  Home,
  LineChart,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { UserRole } from "../types/roles";

/** Sidebar and bottom-bar destinations per role, in display order. */
export const dashboardNavigation = {
  student: [
    ["Dashboard", Home],
    ["My backlogs", Archive],
    ["Recovery simulator", Gauge],
    ["Recovery plan", ClipboardList],
    ["Exams", ClipboardCheck],
    ["Progress", LineChart],
    ["Notifications", Bell],
  ],
  mentor: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Patterns", BarChart3],
    ["Interventions", HandHelping],
    ["Alerts", Bell],
    ["Reports", FileText],
  ],
  hod: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Backlogs", Archive],
    ["Patterns", BarChart3],
    ["Interventions", HandHelping],
    ["Examinations", ClipboardCheck],
    ["Alerts", Bell],
    ["Reports", FileText],
  ],
  exam: [
    ["Dashboard", Home],
    ["Eligibility", ShieldCheck],
    ["Registrations", ClipboardCheck],
    ["Fee clearance", FileText],
    ["Alerts", Bell],
    ["Reports", LineChart],
  ],
  placement: [
    ["Dashboard", Home],
    ["Students", UsersRound],
    ["Backlog constraints", Archive],
    ["Readiness", BriefcaseBusiness],
    ["Alerts", Bell],
    ["Reports", LineChart],
  ],
} as const;

/** Short labels for the phone bottom bar, where each slot is ~70px wide. */
export const mobileTabLabel: Partial<Record<string, string>> = {
  "My backlogs": "Backlogs",
  "Recovery simulator": "Simulator",
  "Recovery plan": "Plan",
  "Backlog constraints": "Constraints",
  "Fee clearance": "Fees",
  Registrations: "Register",
  Interventions: "Support",
  Examinations: "Exams",
};

export const roleBadgeClasses: Record<UserRole, string> = {
  hod: "bg-violet-100 text-violet-700",
  mentor: "bg-blue-100 text-blue-700",
  student: "bg-emerald-100 text-emerald-700",
  exam: "bg-amber-100 text-amber-700",
  placement: "bg-rose-100 text-rose-700",
};
