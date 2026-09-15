import type { AssistantAction, AssistantReply } from "../types/agent";
import type { UserRole } from "../types/roles";

// Helpers the voice assistant uses to act on whatever is on screen, plus a
// keyword fallback for when the AI interpreter cannot be reached.

const CONTROL_SELECTOR = "button, a[href], [role='button']";

function controlLabel(element: HTMLElement) {
  return (element.getAttribute("aria-label") || element.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function visibleControls() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CONTROL_SELECTOR),
  ).filter(
    (element) =>
      element.getClientRects().length > 0 &&
      !element.hasAttribute("disabled") &&
      !element.closest("[data-voice-assistant]"),
  );
}

/** Labels of the controls currently on screen, so the assistant can press any of them. */
export function visibleControlLabels() {
  const labels = visibleControls()
    .map(controlLabel)
    .filter((label) => label && label.length <= 60);
  return [...new Set(labels)].slice(0, 80);
}

/** Presses the on-screen control whose label best matches; false when none does. */
export function clickControl(label: string) {
  const target = label.replace(/\s+/g, " ").trim().toLowerCase();
  if (!target) return false;
  const controls = visibleControls();
  const match =
    controls.find((element) => controlLabel(element).toLowerCase() === target) ??
    controls.find((element) =>
      controlLabel(element).toLowerCase().includes(target),
    );
  match?.click();
  return Boolean(match);
}

/** The dashboard scrolls inside a panel rather than the window, so move the largest one. */
export function scrollWorkspace(direction: "up" | "down" | "top" | "bottom") {
  const panel: Element =
    Array.from(document.querySelectorAll<HTMLElement>("main .overflow-y-auto"))
      .filter((element) => element.scrollHeight > element.clientHeight + 4)
      .sort(
        (a, b) =>
          b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight,
      )[0] ??
    document.scrollingElement ??
    document.documentElement;
  const step = panel.clientHeight * 0.8;
  const top =
    direction === "top"
      ? 0
      : direction === "bottom"
        ? panel.scrollHeight
        : panel.scrollTop + (direction === "down" ? step : -step);
  panel.scrollTo({ top, behavior: "smooth" });
}

const backlogWords = ["backlog", "back log", "arrear", "failed subject", "pending subject"];

const tabKeywords: Record<string, string[]> = {
  Dashboard: ["dashboard", "home", "overview", "main page"],
  "My backlogs": backlogWords,
  Backlogs: backlogWords,
  "Backlog constraints": [...backlogWords, "constraint", "blocked"],
  "Recovery simulator": ["recovery simulator", "simulat", "what if", "predict"],
  "Recovery plan": ["recovery plan", "plan", "recover"],
  Exams: ["exam", "supplementary"],
  Examinations: ["exam", "supplementary"],
  Registrations: ["registration", "register", "supplementary"],
  Progress: ["progress", "improvement"],
  Notifications: ["notification", "alert", "warning", "update"],
  Alerts: ["alert", "notification", "warning"],
  Students: ["student", "learner", "class"],
  Patterns: ["pattern", "trend", "course"],
  Interventions: ["intervention", "support", "approval"],
  Reports: ["report", "summary"],
  Eligibility: ["eligib", "promotion", "condonation", "detain"],
  "Fee clearance": ["fee", "payment", "dues"],
  Readiness: ["readiness", "ready", "placement"],
  Profile: ["profile", "account"],
  Settings: ["setting", "preference"],
};

const roleKeywords: Array<[UserRole, RegExp]> = [
  ["hod", /\b(hod|h o d|head of (the )?department)\b/],
  ["mentor", /\b(mentor|teacher|faculty)\b/],
  ["exam", /\bexam(ination)?s?\b/],
  ["placement", /\bplacement\b/],
  ["student", /\bstudents?\b/],
];

/** Example requests shown in the assistant panel, tuned to each role. */
export const voiceSuggestions: Record<UserRole, string[]> = {
  student: [
    "Am I eligible for promotion?",
    "Show my backlogs",
    "What if I clear two subjects?",
    "Turn on dark mode",
  ],
  mentor: [
    "Which students need attention?",
    "Show the latest alerts",
    "Open interventions",
    "Scroll down",
  ],
  hod: [
    "How many critical cases are there?",
    "Which course has the most backlogs?",
    "Show interventions",
    "Switch to dark mode",
  ],
  exam: [
    "Open fee clearance",
    "Show registrations",
    "Any alerts today?",
    "Take me to eligibility",
  ],
  placement: [
    "Which students are blocked by backlogs?",
    "Open readiness",
    "Show alerts",
    "Go to reports",
  ],
};

/** Offline interpretation of the most common requests, used when the AI call fails. */
export function interpretLocally(
  utterance: string,
  availableTabs: string[],
): AssistantReply {
  const text = utterance
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const plan = (reply: string, ...actions: AssistantAction[]) => ({
    reply,
    actions,
  });

  if (/\b(log ?out|sign ?out)\b/.test(text)) {
    return plan("Logging you out.", { type: "logout" });
  }
  if (/\b(dark|night)\b/.test(text)) {
    return plan("Switching to dark mode.", { type: "theme", mode: "dark" });
  }
  if (/\b(light|bright|day)\b.*\b(mode|theme)\b/.test(text)) {
    return plan("Switching to light mode.", { type: "theme", mode: "light" });
  }

  const direction = text.match(/\b(up|down|top|bottom)\b/)?.[1] as
    | "up"
    | "down"
    | "top"
    | "bottom"
    | undefined;
  if (direction && /\b(scroll|move|go|page)\b/.test(text)) {
    return plan("Scrolling.", { type: "scroll", direction });
  }

  if (/\b(switch|change|swap)\b/.test(text)) {
    const role = roleKeywords.find(([, pattern]) => pattern.test(text))?.[0];
    if (role) return plan("Switching views.", { type: "switch_role", role });
  }

  const studentId = text
    .replace(/\s+/g, "")
    .match(/stu\d{3,}|\d{2}[a-z]{2,4}\d{2,4}/)?.[0]
    ?.toUpperCase();
  if (studentId) {
    return plan(`Opening ${studentId}.`, {
      type: "open_student",
      student_id: studentId,
    });
  }

  const clickTarget = text.match(
    /\b(?:click|press|tap|hit)\b(?: on)?(?: the)? (.+?)(?: button)?$/,
  )?.[1];
  if (clickTarget) {
    return plan(`Pressing ${clickTarget}.`, { type: "click", label: clickTarget });
  }

  if (/\b(close|go back)\b/.test(text)) {
    return plan("Closing that.", { type: "close_student" });
  }

  const tab = availableTabs
    .map((name) => ({
      name,
      score: (tabKeywords[name] ?? [name.toLowerCase()])
        .filter((keyword) => new RegExp(`\\b${keyword}`).test(text))
        .reduce((total, keyword) => total + keyword.length, 0),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  if (tab) return plan(`Opening ${tab.name}.`, { type: "navigate", tab: tab.name });

  return plan(
    "I can't reach the AI service right now, so I can only handle simple requests like opening a section, changing the theme, or scrolling.",
  );
}
