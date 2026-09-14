export type DemoEventKind =
  | "supplementary_registered"
  | "registration_blocked"
  | "hod_alert"
  | "simulation_completed";

export interface DemoEvent {
  id: string;
  kind: DemoEventKind;
  studentId: string;
  message: string;
  sourceRole: "student" | "mentor" | "hod";
  createdAt: string;
  read: boolean;
}

const EVENTS_KEY = "edurecover-demo-events";
const EVENTS_SIGNAL = "edurecover-demo-events-updated";

function readEvents(): DemoEvent[] {
  try {
    return JSON.parse(sessionStorage.getItem(EVENTS_KEY) || "[]") as DemoEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: DemoEvent[]) {
  sessionStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-50)));
  window.dispatchEvent(new Event(EVENTS_SIGNAL));
}

export function listDemoEvents() {
  return readEvents().sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function addDemoEvent(
  event: Omit<DemoEvent, "id" | "createdAt" | "read">,
) {
  const nextEvent: DemoEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  writeEvents([...readEvents(), nextEvent]);
  return nextEvent;
}

export function markDemoEventRead(id: string) {
  writeEvents(readEvents().map((event) => (event.id === id ? { ...event, read: true } : event)));
}

export function subscribeToDemoEvents(listener: () => void) {
  window.addEventListener(EVENTS_SIGNAL, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENTS_SIGNAL, listener);
    window.removeEventListener("storage", listener);
  };
}
