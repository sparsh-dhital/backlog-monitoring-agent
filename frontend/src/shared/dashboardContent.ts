import type { UserRole } from "../types/roles";

/** Per-role copy for the dashboard home. */
export const dashboardByRole = {
  student: {
    title: "My Academic Recovery",
    greetingName: "Rahul",
    description:
      "Here is what needs your attention, and the next step that keeps your degree on track.",
    metrics: [
      ["Active backlogs", "3", "Across two semesters"],
      ["Attempts remaining", "2", "Regulation checked"],
      ["At risk", "1", "Needs a decision"],
      ["Recovery progress", "78%", "Up 12% this term"],
    ],
  },
  mentor: {
    title: "My Students",
    greetingName: "mentor",
    description:
      "A focused queue of students who need a conversation, an intervention, or a little more context.",
    metrics: [
      ["Students", "42", "Your current group"],
      ["Need attention", "8", "Priority queue"],
      ["Repeated failures", "5", "Patterns detected"],
      ["Backlogs cleared", "12", "This term"],
    ],
  },
  hod: {
    title: "Academic Command Center",
    greetingName: "HOD",
    description:
      "See the department-wide picture, then open the cases behind the trend before they become harder to recover.",
    metrics: [
      ["Active backlogs", "214", "12% less last term"],
      ["Students affected", "87", "8% less last term"],
      ["Duration risk", "13", "Needs attention"],
      ["Critical cases", "9", "Review required"],
    ],
  },
  exam: {
    title: "Examination Operations",
    greetingName: "examination cell",
    description:
      "Keep supplementary registration, eligibility, fee clearance and attempts together in one operational view.",
    metrics: [
      ["Eligible", "84", "Ready to register"],
      ["Pending fee", "13", "Needs follow-up"],
      ["Condonation", "4", "Under review"],
      ["Detained", "2", "Requires action"],
    ],
  },
  placement: {
    title: "Placement Readiness",
    greetingName: "placement cell",
    description:
      "See which students are ready, which are recovering, and which backlog is blocking the next opportunity.",
    metrics: [
      ["Placement eligible", "438", "Current cohort"],
      ["Backlog constrained", "31", "Needs recovery"],
      ["Recovering", "18", "Intervention active"],
      ["Ready after clearance", "12", "Near-term wins"],
    ],
  },
} as const;

/** The hero's recommended next step: [label, tab it opens]. */
export const dashboardActions: Record<UserRole, readonly [string, string]> = {
  student: ["Review recovery plan", "Recovery plan"],
  mentor: ["Open priority students", "Students"],
  hod: ["Review critical cases", "Students"],
  exam: ["Review registrations", "Registrations"],
  placement: ["Review readiness constraints", "Backlog constraints"],
};

/** Personal next steps on non-HOD dashboards: [action, tab it opens]. */
export const roleNextActions: Record<UserRole, ReadonlyArray<readonly [string, string]>> = {
  student: [
    ["Register for the next supplementary attempt", "Exams"],
    ["Review your Data Structures recovery plan", "Recovery plan"],
    ["Confirm your mentor meeting", "Notifications"],
  ],
  mentor: [
    ["Review the 8 students needing attention", "Students"],
    ["Prepare the next mentor conversation", "Interventions"],
    ["Track active interventions", "Reports"],
  ],
  exam: [
    ["Follow up on pending fee clearance", "Fee clearance"],
    ["Review condonation cases", "Eligibility"],
    ["Open the next supplementary window", "Registrations"],
  ],
  placement: [
    ["Review backlog-constrained students", "Backlog constraints"],
    ["Track recovery milestones", "Readiness"],
    ["Prepare placement readiness report", "Reports"],
  ],
  hod: [],
};

/** The shared recovery journey: [role, title, detail, tab the owner opens]. */
export const journeySteps = [
  ["hod", "HOD identifies", "Department signal", "Students"],
  ["mentor", "Mentor supports", "Recovery plan", "Interventions"],
  ["exam", "Exam validates", "Eligibility + attempt", "Registrations"],
  ["placement", "Placement monitors", "Readiness constraint", "Readiness"],
  ["student", "Student recovers", "Next action", "Recovery plan"],
] as const;

/** Reference content for each workspace tab (used when live rows are absent). */
export const tabContent = {
  Students: {
    eyebrow: "Student directory",
    title: "Students needing context",
    description:
      "Move from department signals to the student record behind the signal.",
    rows: [
      ["Rahul Sharma", "CSE · 2026", "3 active backlogs", "Critical"],
      ["Priya Rao", "CSE · 2026", "2 active backlogs", "Review"],
      ["Kiran Das", "IT · 2026", "1 active backlog", "Recovering"],
      ["Ananya Singh", "CSE · 2025", "2 active backlogs", "Duration risk"],
    ],
  },
  Backlogs: {
    eyebrow: "Arrear register",
    title: "Backlog portfolio",
    description:
      "Understand volume, repeated failures, and the cases closest to a missed recovery window.",
    rows: [
      ["Data Structures", "41 students", "3.2 average attempts", "High pressure"],
      ["DBMS", "52 students", "2.1 average attempts", "Watch"],
      ["Mathematics", "68 students", "1.8 average attempts", "Monitor"],
      ["Operating Systems", "29 students", "1.6 average attempts", "Stable"],
    ],
  },
  Patterns: {
    eyebrow: "Academic intelligence",
    title: "Patterns worth acting on",
    description:
      "The platform surfaces recurring failure and duration signals for human review.",
    rows: [
      ["Repeated core-course failure", "23 students", "Data Structures + DBMS", "Escalate"],
      ["Attempt pressure", "14 students", "One attempt remaining", "Urgent"],
      ["Duration pressure", "13 students", "Two semesters remaining", "Review"],
      ["Recovery momentum", "12 students", "Backlogs cleared this term", "Positive"],
    ],
  },
  Interventions: {
    eyebrow: "Human decisions",
    title: "Intervention queue",
    description:
      "Review recommendations, assign ownership, and track whether support is working.",
    rows: [
      ["Rahul Sharma", "Structured remedial", "Mentor sign-off", "Pending"],
      ["Kiran Das", "Mentor meeting", "In progress", "Active"],
      ["Priya Rao", "Supplementary registration", "Exam cell", "Ready"],
    ],
  },
  Examinations: {
    eyebrow: "Examination operations",
    title: "Eligibility and attempts",
    description:
      "Keep registration, fee clearance, and regulation checks in one operational view.",
    rows: [
      ["Eligible to register", "84 students", "Next supplementary", "Ready"],
      ["Pending fee clearance", "13 students", "Payment follow-up", "Action"],
      ["Condonation review", "4 students", "HOD decision", "Review"],
      ["Detained / debarred", "3 students", "Regulation check", "Restricted"],
    ],
  },
  Alerts: {
    eyebrow: "Signals and notifications",
    title: "Recent alerts",
    description:
      "A focused stream of changes that may require a decision or a student conversation.",
    rows: [
      ["Attempt pressure", "14 students", "One attempt remaining", "2h ago"],
      ["Duration risk", "6 students", "Near maximum duration", "5h ago"],
      ["Recovery milestone", "12 students", "Backlog cleared", "Today"],
    ],
  },
  Reports: {
    eyebrow: "Evidence package",
    title: "Academic reports",
    description:
      "Export a clear record of facts, calculations, recommendations, and outcomes.",
    rows: [
      ["Department recovery report", "August 2026", "214 active backlogs", "Export"],
      ["Intervention effectiveness", "Term to date", "72% clearance rate", "Export"],
      ["Regulation compliance", "Academic Regulation 2025", "All cohorts", "Export"],
    ],
  },
  "My backlogs": {
    eyebrow: "My academic record",
    title: "Active backlogs",
    description:
      "See each course, attempt, and the next action available to you.",
    rows: [
      ["Data Structures", "2 attempts", "One attempt remaining", "Urgent"],
      ["DBMS", "1 attempt", "Supplementary eligible", "Ready"],
      ["Mathematics", "1 attempt", "Recovery plan active", "In progress"],
    ],
  },
  "Recovery plan": {
    eyebrow: "Recommended next steps",
    title: "My recovery plan",
    description:
      "A clear sequence of actions built from your academic record and regulation checks.",
    rows: [
      ["Register for supplementary exam", "18 Sept", "Data Structures", "Next"],
      ["Attend remedial class", "This week", "Core programming", "Scheduled"],
      ["Meet your mentor", "20 Sept", "Review progress", "Pending"],
    ],
  },
  Exams: {
    eyebrow: "Exam opportunities",
    title: "Supplementary exams",
    description:
      "Track eligibility, registration windows, and fee clearance for your next attempt.",
    rows: [
      ["Data Structures", "Attempt 3", "Registration open", "Eligible"],
      ["DBMS", "Attempt 2", "Fee paid", "Registered"],
      ["Mathematics", "Attempt 2", "Window opens soon", "Watch"],
    ],
  },
  Progress: {
    eyebrow: "Recovery journey",
    title: "Progress over time",
    description:
      "Follow your backlog movement, completed interventions, and upcoming milestones.",
    rows: [
      ["Backlog clearance", "78%", "Up 12% this term", "Positive"],
      ["Mentor actions", "4 of 5", "One meeting pending", "Active"],
      ["Next milestone", "1 course", "Clear before placement review", "Focus"],
    ],
  },
  Notifications: {
    eyebrow: "Your notifications",
    title: "Recent updates",
    description:
      "Important changes from examinations, mentors, and your recovery plan.",
    rows: [
      ["Supplementary registration", "Exam cell", "Registration window is open", "New"],
      ["Mentor follow-up", "Prof. S. Dhital", "Meeting requested", "Action"],
      ["Recovery milestone", "Academic support", "Plan updated with evidence", "Read"],
    ],
  },
  Registrations: {
    eyebrow: "Registration desk",
    title: "Supplementary registrations",
    description:
      "Monitor registration status, attempt number, fees, and exceptions across the cohort.",
    rows: [
      ["Rahul Sharma", "Data Structures", "Attempt 3", "Paid"],
      ["Priya Rao", "DBMS", "Attempt 2", "Pending fee"],
      ["Kiran Das", "Mathematics", "Attempt 2", "Eligible"],
    ],
  },
  Eligibility: {
    eyebrow: "Regulation checks",
    title: "Eligibility review",
    description:
      "See which students satisfy the current regulation and which cases require review.",
    rows: [
      ["Eligible", "84 students", "All criteria met", "Ready"],
      ["Review required", "4 students", "Condonation needed", "Review"],
      ["Restricted", "3 students", "Detained or debarred", "Action"],
    ],
  },
  "Fee clearance": {
    eyebrow: "Finance checkpoint",
    title: "Fee clearance",
    description:
      "Keep registration decisions aligned with payment status and the next exam window.",
    rows: [
      ["Paid", "71 students", "Registration can proceed", "Clear"],
      ["Pending", "13 students", "Reminder required", "Action"],
      ["Exception", "2 students", "Manual review", "Review"],
    ],
  },
  Readiness: {
    eyebrow: "Placement readiness",
    title: "Student readiness",
    description:
      "Understand how backlog status affects placement preparation and opportunity access.",
    rows: [
      ["Ready", "438 students", "No blocking backlog", "Eligible"],
      ["Recovering", "18 students", "Intervention active", "Track"],
      ["Constrained", "31 students", "Backlog affects opportunities", "Review"],
    ],
  },
  "Backlog constraints": {
    eyebrow: "Placement constraints",
    title: "Backlog-constrained students",
    description:
      "Coordinate recovery visibility with placement timelines without making placement decisions automatically.",
    rows: [
      ["DBMS clearance", "12 students", "Next hiring window", "Priority"],
      ["Duration pressure", "8 students", "Final placement cycle", "Urgent"],
      ["Recovery active", "11 students", "Mentor follow-up", "Track"],
    ],
  },
} as const;
