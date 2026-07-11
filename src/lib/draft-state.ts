import "server-only";
import { prisma } from "@/lib/prisma";
import type { WoStatus } from "@/generated/prisma/enums";

// The standalone prototype (dashboard_3.html) uses lowercase "status keys"
// in its USER_UPDATES map. Map those <-> the DB WoStatus enum.
export const DRAFT_KEY_BY_ENUM: Record<WoStatus, string> = {
  NOT_START: "notstart",
  IN_PROGRESS: "inprogress",
  WAITING_MATERIAL: "waiting",
  WAITING_APPROVAL: "waitingapproval",
  WAITING_SHUTDOWN: "waitingshutdown",
  WAITING_FACILITATE: "waitingfacilitate",
  COMPLETED: "completed",
};

export const ENUM_BY_DRAFT_KEY: Record<string, WoStatus> = {
  notstart: "NOT_START",
  inprogress: "IN_PROGRESS",
  waiting: "WAITING_MATERIAL",
  waitingmaterial: "WAITING_MATERIAL",
  waitingapproval: "WAITING_APPROVAL",
  waitingshutdown: "WAITING_SHUTDOWN",
  waitingfacilitate: "WAITING_FACILITATE",
  completed: "COMPLETED",
};

export function draftKeyToEnum(key: string): WoStatus | null {
  return ENUM_BY_DRAFT_KEY[(key || "").toLowerCase()] ?? null;
}

// Row shape consumed by the prototype's RAW_DATA (matches parseRows output).
export type DraftWoRow = {
  wo: string;
  desc: string;
  location: string;
  asset: string;
  plant: string;
  team: string;
  priority: string;
  statusAJ: string;
  status: string;
  targetStart: string | null;
  targetFinish: string | null;
  actualStart: string | null;
  actualFinish: string | null;
  dataDate: string | null;
  overdue: string;
  supervisor: string;
  workLocation: string;
  woType: string;
  workRefCode: string;
  plannedHours: number;
  actualHours: number;
};

export type DraftState = {
  workOrders: DraftWoRow[];
  userUpdates: Record<
    string,
    { status: string; progress: number; remark: string; who: string; updatedAt: string }
  >;
  activity: Array<{
    wo: string;
    who: string;
    statusLabel: string;
    progress: number | null;
    time: string;
  }>;
  meta: {
    rows: number;
    uploadedAt: string | null;
    fileName: string | null;
    availableDates: string[];
    selectedDate: string | null;
  };
  // Shared app-managed blobs (reschedule, shutdown, facilitate, ... ) keyed by
  // their original localStorage key.
  appData: Record<string, unknown>;
};

const s = (v: string | null | undefined) => v ?? "";
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

// Fields shared by WorkOrder and WorkOrderSnapshot (same scalar columns).
type WoLike = {
  wo: string;
  desc: string | null;
  location: string | null;
  asset: string | null;
  plant: string | null;
  team: string | null;
  priority: string | null;
  statusAJ: string | null;
  status: string | null;
  targetStart: Date | null;
  targetFinish: Date | null;
  actualStart: Date | null;
  actualFinish: Date | null;
  dataDate: Date | null;
  overdue: string | null;
  supervisor: string | null;
  workLocation: string | null;
  woType: string | null;
  workRefCode: string | null;
  plannedHours: number;
  actualHours: number;
};

function mapRow(r: WoLike): DraftWoRow {
  return {
    wo: r.wo,
    desc: s(r.desc),
    location: s(r.location),
    asset: s(r.asset),
    plant: s(r.plant),
    team: s(r.team),
    priority: s(r.priority),
    statusAJ: s(r.statusAJ),
    status: s(r.status),
    targetStart: iso(r.targetStart),
    targetFinish: iso(r.targetFinish),
    actualStart: iso(r.actualStart),
    actualFinish: iso(r.actualFinish),
    dataDate: iso(r.dataDate),
    overdue: s(r.overdue),
    supervisor: s(r.supervisor),
    workLocation: s(r.workLocation),
    woType: s(r.woType),
    workRefCode: s(r.workRefCode),
    plannedHours: r.plannedHours,
    actualHours: r.actualHours,
  };
}

// Read the shared state from Postgres, shaped like the prototype's payload.
// Shows one Data_Date snapshot at a time: `requestedDate` (YYYY-MM-DD) if given
// and available, otherwise the latest snapshot. Falls back to the WorkOrder
// table if no snapshots exist yet (e.g. before the first snapshot-aware import).
export async function getDraftState(requestedDate?: string): Promise<DraftState> {
  const [distinctDates, updates, activity, lastBatch, appDataRows] =
    await Promise.all([
      prisma.workOrderSnapshot.findMany({
        distinct: ["dataDate"],
        select: { dataDate: true },
        orderBy: { dataDate: "desc" },
      }),
      prisma.workOrderUpdate.findMany(),
      prisma.activityLog.findMany({
        where: { action: "STATUS_UPDATE" },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true } } },
      }),
      prisma.importBatch.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.appData.findMany(),
    ]);

  const appData: Record<string, unknown> = {};
  for (const r of appDataRows) appData[r.key] = r.value;

  const availableDates = distinctDates.map((d) =>
    d.dataDate.toISOString().slice(0, 10)
  );
  const selectedDate =
    requestedDate && availableDates.includes(requestedDate)
      ? requestedDate
      : availableDates[0] ?? null;

  let workOrders: DraftWoRow[];
  if (selectedDate) {
    const snaps = await prisma.workOrderSnapshot.findMany({
      where: { dataDate: new Date(`${selectedDate}T00:00:00.000Z`) },
      orderBy: { targetStart: "desc" },
    });
    workOrders = snaps.map(mapRow);
  } else {
    // No snapshots yet — fall back to the deduped current WorkOrder table.
    const orders = await prisma.workOrder.findMany({
      orderBy: { targetStart: "desc" },
    });
    workOrders = orders.map(mapRow);
  }

  const userUpdates: DraftState["userUpdates"] = {};
  for (const u of updates) {
    userUpdates[u.woId] = {
      status: DRAFT_KEY_BY_ENUM[u.status],
      progress: u.progress,
      remark: s(u.remark),
      who: "",
      updatedAt: u.updatedAt.toISOString(),
    };
  }

  const activityOut = activity.map((a) => {
    const detail = (a.detail ?? {}) as { label?: string; progress?: number };
    return {
      wo: s(a.woId),
      who: a.user?.name ?? "ผู้ใช้งาน",
      statusLabel: detail.label ?? "",
      progress: typeof detail.progress === "number" ? detail.progress : null,
      time: a.createdAt.toISOString(),
    };
  });

  return {
    workOrders,
    userUpdates,
    activity: activityOut,
    meta: {
      rows: workOrders.length,
      uploadedAt: lastBatch ? lastBatch.createdAt.toISOString() : null,
      fileName: lastBatch ? lastBatch.fileName : null,
      availableDates,
      selectedDate,
    },
    appData,
  };
}
