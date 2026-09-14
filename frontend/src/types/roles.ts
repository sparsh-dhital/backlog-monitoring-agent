export const userRoles = [
  {
    id: "student",
    label: "Student",
    detail: "My recovery plan",
    icon: "person",
  },
  {
    id: "mentor",
    label: "Teacher / Mentor",
    detail: "My students",
    icon: "mentor",
  },
  {
    id: "hod",
    label: "HOD",
    detail: "Academic command center",
    icon: "command",
  },
  {
    id: "exam",
    label: "Examination Cell",
    detail: "Eligibility and attempts",
    icon: "exam",
  },
  {
    id: "placement",
    label: "Placement Cell",
    detail: "Placement readiness",
    icon: "placement",
  },
] as const;

export type UserRole = (typeof userRoles)[number]["id"];
