import type { WoStatus } from "@/generated/prisma/enums";

export type StatusKey =
  | "notstart"
  | "inprogress"
  | "waiting"
  | "waitingapproval"
  | "completed";

export const STATUS_LABEL: Record<StatusKey, string> = {
  notstart: "Not Start",
  inprogress: "In Progress",
  waiting: "Waiting Material",
  waitingapproval: "Waiting Approval",
  completed: "Completed",
};

export const STATUS_PILL_CLASS: Record<StatusKey, string> = {
  notstart: "pill-notstart",
  inprogress: "pill-inprogress",
  waiting: "pill-waiting",
  waitingapproval: "pill-waiting",
  completed: "pill-completed",
};

// Only these WorkOrderUpdate statuses map onto the 5 aggregation buckets.
// WAITING_SHUTDOWN / WAITING_FACILITATE belong to phase-2 features (Shutdown
// Plan / Facilitate Service) and fall back to the statusAJ-derived bucket
// here, matching the original app's behavior.
const OVERRIDE_MAP: Partial<Record<WoStatus, StatusKey>> = {
  NOT_START: "notstart",
  IN_PROGRESS: "inprogress",
  WAITING_MATERIAL: "waiting",
  WAITING_APPROVAL: "waitingapproval",
  COMPLETED: "completed",
};

export type WoForStatus = {
  statusAJ: string | null;
  update?: { status: WoStatus } | null;
};

export function classifyStatus(wo: WoForStatus): {
  key: StatusKey;
  label: string;
} {
  const overrideKey = wo.update ? OVERRIDE_MAP[wo.update.status] : undefined;
  if (overrideKey) return { key: overrideKey, label: STATUS_LABEL[overrideKey] };

  const t = wo.statusAJ || "";
  if (/เสร็จ|complete|closed/i.test(t))
    return { key: "completed", label: STATUS_LABEL.completed };
  if (/รอวัสดุ|รออะไหล่|material/i.test(t))
    return { key: "waiting", label: STATUS_LABEL.waiting };
  if (/รออนุมัติ|approve/i.test(t))
    return { key: "waitingapproval", label: STATUS_LABEL.waitingapproval };
  if (/กำลังดำเนินการ|in progress|inprogress/i.test(t))
    return { key: "inprogress", label: STATUS_LABEL.inprogress };
  if (/ยังไม่ได้ทำ|not start|backlog/i.test(t))
    return { key: "notstart", label: STATUS_LABEL.notstart };
  return { key: "notstart", label: STATUS_LABEL.notstart };
}

export function priPillClass(p: string | null): string {
  const n = parseInt(p ?? "", 10);
  return n === 1 ? "pill-p1" : n === 2 ? "pill-p2" : n === 3 ? "pill-p3" : "pill-p4";
}

export function priLabel(p: string | null): string {
  const n = parseInt(p ?? "", 10);
  return isNaN(n) ? "P-" : "P" + n;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export const TEAM_COLORS: Record<string, string> = {
  "MECH CM": "#2563eb",
  "ELEC CM": "#16a34a",
  "AUTO CM": "#f59e0b",
  "INST CM": "#7c3aed",
  "CIVIL CM": "#0d9488",
};

// ===== Raw-status (r.status) based classification, used by the Executive
// Overview page. Distinct from classifyStatus() above, which derives from
// statusAJ text and honors planner WorkOrderUpdate overrides.

const CLOSE_STATUSES = new Set(["CLOSE", "FORCED_CLOSE", "CAN"]);
const COMP_STATUSES = new Set(["FINISH", "WACCEPT", "COMP"]);
const NOT_INPROGRESS = new Set([
  "CLOSE",
  "FORCED_CLOSE",
  "CAN",
  "WPLAN",
  "WSCH",
  "WSHUT",
  "FINISH",
  "WACCEPT",
  "COMP",
]);

export type StatusGroup = "close" | "completed" | "notactive" | "inprogress";

export function statusGroup(status: string | null): StatusGroup {
  const s = (status || "").trim().toUpperCase();
  if (CLOSE_STATUSES.has(s)) return "close";
  if (COMP_STATUSES.has(s)) return "completed";
  if (NOT_INPROGRESS.has(s)) return "notactive";
  return "inprogress";
}

export type StatusCaseKey = "backlog" | "close" | "completed";

export function classifyStatusCase(status: string | null): {
  key: StatusCaseKey;
  label: string;
} {
  const s = (status || "").trim().toUpperCase();
  if (CLOSE_STATUSES.has(s)) return { key: "close", label: "Close" };
  if (COMP_STATUSES.has(s)) return { key: "completed", label: "Completed" };
  return { key: "backlog", label: "Backlog" };
}

export function isDoneStatusCase(key: StatusCaseKey): boolean {
  return key === "close" || key === "completed";
}
