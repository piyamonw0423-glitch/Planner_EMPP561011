import type { WoStatus } from "@/generated/prisma/enums";

export const STATUS_OPTIONS: Array<{
  key: WoStatus;
  label: string;
  icon: string;
  bg: string;
  fg: string;
}> = [
  { key: "NOT_START", label: "Not Start", icon: "○", bg: "#f1f5f9", fg: "#475569" },
  { key: "IN_PROGRESS", label: "In Progress", icon: "▶", bg: "#dbeafe", fg: "#1d4ed8" },
  { key: "WAITING_MATERIAL", label: "Waiting Material", icon: "📦", bg: "#fef3c7", fg: "#92400e" },
  { key: "WAITING_APPROVAL", label: "Waiting Approval", icon: "⏳", bg: "#fef3c7", fg: "#92400e" },
  { key: "WAITING_SHUTDOWN", label: "Waiting Shutdown", icon: "⚡", bg: "#1e3a5f", fg: "#bfdbfe" },
  { key: "WAITING_FACILITATE", label: "Waiting Facilitate Service", icon: "🛠", bg: "#fdf4ff", fg: "#a21caf" },
  { key: "COMPLETED", label: "Completed", icon: "✓", bg: "#dcfce7", fg: "#15803d" },
];

export const STATUS_PILL_CLASS_FULL: Record<WoStatus, string> = {
  NOT_START: "pill-notstart",
  IN_PROGRESS: "pill-inprogress",
  WAITING_MATERIAL: "pill-waiting",
  WAITING_APPROVAL: "pill-waiting",
  WAITING_SHUTDOWN: "pill-waitingshutdown",
  WAITING_FACILITATE: "pill-waitingfacilitate",
  COMPLETED: "pill-completed",
};

export function statusLabel(key: WoStatus): string {
  return STATUS_OPTIONS.find((s) => s.key === key)?.label ?? key;
}
