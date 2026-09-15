export const NAV_PRIMARY = [
  "Dashboard",
  "My Courses",
  "Recovery Plan",
  "Assignments",
  "Assessments",
  "Resources",
  "Progress",
] as const;

export const NAV_SECONDARY = [
  "Notifications",
  "Settings",
  "Help & Support",
] as const;

export const MOBILE_NAV = [
  "Dashboard",
  "My Courses",
  "Recovery Plan",
  "Assignments",
  "Progress",
] as const;

export type NavItem = (typeof NAV_PRIMARY)[number] | (typeof NAV_SECONDARY)[number];

export const studentProfile = {
  name: "Rahul Sharma",
  program: "B.Tech Computer Science",
  cohort: "2026",
  email: "rahul.sharma@university.edu",
  initials: "RS",
};

export const heroCopy = {
  eyebrow: "Your recovery plan",
  title: "Let's get back on track.",
  supportingText: "Here's what needs your attention today.",
  dateLabel: "Week of 8 Sep",
  primaryAction: "Continue Mathematics",
};

export const metrics = [
  {
    id: "progress",
    label: "Recovery progress",
    value: "78%",
    delta: "+12% this term",
    detail: "On pace for term-end clearance",
    highlight: true,
    spark: [42, 48, 51, 58, 63, 70, 78],
  },
  {
    id: "risk",
    label: "Courses at risk",
    value: "2",
    delta: "1 improved",
    detail: "Mathematics and Physics need focus",
    highlight: false,
    spark: [4, 4, 3, 3, 3, 2, 2],
  },
  {
    id: "pending",
    label: "Assignments pending",
    value: "5",
    delta: "2 due this week",
    detail: "One high-priority submission today",
    highlight: false,
    spark: [8, 7, 7, 6, 6, 5, 5],
  },
  {
    id: "streak",
    label: "Current streak",
    value: "12",
    delta: "days studying",
    detail: "Best streak this semester",
    highlight: false,
    spark: [0, 3, 5, 8, 9, 11, 12],
  },
] as const;

export const recoverySummary = {
  percent: 78,
  target: "Clear 3 backlogs by 30 Oct",
  expected: "Expected completion in 7 weeks",
  supporting: "4 of 6 recovery milestones complete",
  remaining: "2 courses still need a passing attempt",
};

export type CourseStatus = "On track" | "Needs attention" | "At risk" | "Completed";

export const courses = [
  {
    code: "MA201",
    name: "Engineering Mathematics",
    progress: 54,
    status: "At risk" as CourseStatus,
    nextAction: "Submit assignment 04",
  },
  {
    code: "PH102",
    name: "Physics II",
    progress: 61,
    status: "Needs attention" as CourseStatus,
    nextAction: "Review midterm feedback",
  },
  {
    code: "CS204",
    name: "Data Structures",
    progress: 82,
    status: "On track" as CourseStatus,
    nextAction: "Continue module 7",
  },
  {
    code: "CS301",
    name: "Database Systems",
    progress: 100,
    status: "Completed" as CourseStatus,
    nextAction: "Archive notes",
  },
];

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const deadlines = [
  {
    id: "d1",
    dayIndex: 0,
    time: "16:00",
    course: "Mathematics",
    title: "Assignment 04 · Sequences",
    priority: "High" as const,
  },
  {
    id: "d2",
    dayIndex: 1,
    time: "11:00",
    course: "Physics",
    title: "Lab report resubmission",
    priority: "Medium" as const,
  },
  {
    id: "d3",
    dayIndex: 2,
    time: "09:30",
    course: "Data Structures",
    title: "Tutorial attendance",
    priority: "Low" as const,
  },
  {
    id: "d4",
    dayIndex: 3,
    time: "14:00",
    course: "Mathematics",
    title: "Mentor check-in",
    priority: "Medium" as const,
  },
  {
    id: "d5",
    dayIndex: 4,
    time: "10:00",
    course: "Physics",
    title: "Supplementary quiz",
    priority: "High" as const,
  },
];

export const weeklyActivity = [
  { day: "Mon", hours: 1.5, target: 2.5 },
  { day: "Tue", hours: 2.2, target: 2.5 },
  { day: "Wed", hours: 3.4, target: 2.5 },
  { day: "Thu", hours: 1.8, target: 2.5 },
  { day: "Fri", hours: 2.9, target: 2.5 },
  { day: "Sat", hours: 4.1, target: 2.5 },
  { day: "Sun", hours: 0.8, target: 2.5 },
];

export const highlightedActivityDay = "Sat";

export const priorities = [
  {
    id: "p1",
    title: "Complete Mathematics assignment",
    detail: "Due today · 16:00 · Sequences & series",
    hrefLabel: "Open assignment",
  },
  {
    id: "p2",
    title: "Review Physics assessment",
    detail: "Midterm feedback · 2 topics below pass",
    hrefLabel: "Start review",
  },
  {
    id: "p3",
    title: "Continue Data Structures module",
    detail: "Module 7 · Trees · 18 minutes remaining",
    hrefLabel: "Resume",
  },
];

export const assessments = [
  ["Physics II midterm", "62%", "Needs attention", "Rework kinematics"],
  ["Mathematics quiz 03", "71%", "On track", "Revise series"],
  ["Data Structures lab", "88%", "Strong", "Keep pace"],
];

export const resources = [
  ["Worked examples · Series", "Mathematics", "42 min", "Recommended"],
  ["Kinematics recap", "Physics", "28 min", "Assigned"],
  ["Binary trees studio", "Data Structures", "18 min", "In progress"],
];

export const planSteps = [
  ["Register supplementary attempt", "18 Sep", "Mathematics", "Next"],
  ["Attend remedial session", "This week", "Physics", "Scheduled"],
  ["Mentor meeting", "20 Sep", "Recovery review", "Pending"],
];

export const notifications = [
  ["Supplementary window open", "Exam cell", "Mathematics registration is live", "New"],
  ["Mentor follow-up", "Prof. S. Dhital", "Meeting requested for Thursday", "Action"],
  ["Plan updated", "Recovery desk", "Physics review added to this week", "Read"],
];
