import "server-only";
import { gzipSync, gunzipSync } from "node:zlib";
import { prisma } from "@/lib/prisma";
import { buildFallbackState } from "@/lib/fallback-seed";
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

// Classify a raw sheet status into the dashboard's status groups (mirrors the
// client's statusGroup). Used for the per-Data_Date trend aggregate.
const SNAP_CLOSE = new Set(["CLOSE", "FORCED_CLOSE", "CAN"]);
const SNAP_COMP = new Set(["FINISH", "WACCEPT", "COMP"]);
const SNAP_PLAN = new Set(["WPLAN", "WSCH", "WSHUT"]);
const SNAP_BACK = new Set(["WMATL", "APPR", "WCONTRACTOR", "WCTRLSUP", "WCTRLTEAM"]);
type SnapGroup = "close" | "completed" | "planning" | "backlog" | "inprogress";
function snapGroup(s: string | null): SnapGroup {
  const x = (s || "").trim().toUpperCase();
  if (SNAP_CLOSE.has(x)) return "close";
  if (SNAP_COMP.has(x)) return "completed";
  if (SNAP_PLAN.has(x)) return "planning";
  if (SNAP_BACK.has(x) || x.startsWith("WAPPR")) return "backlog";
  return "inprogress";
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

export type SnapshotTrendPoint = {
  date: string;
  total: number;
  close: number;
  completed: number;
  planning: number;
  backlog: number;
  inprogress: number;
  totalBacklog: number;
  open: number;
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
    // Set by the fallback path when the live DB can't be read (e.g. Neon free
    // tier quota exhausted). The UI shows an honest banner instead of a 500.
    dbUnavailable?: boolean;
    // Per-Data_Date totals across ALL snapshots, for the WO CUMULATIVE TREND
    // "ตาม Data_Date" view (real counts of each weekly data pull).
    snapshotTrend: SnapshotTrendPoint[];
    // Same trend broken down by Plant, so the client can filter the historical
    // trend by plant (the browser only holds the current snapshot's rows).
    // Each plant's array is aligned to the same date axis as snapshotTrend.
    snapshotTrendByPlant?: Record<string, SnapshotTrendPoint[]>;
  };
  // Shared app-managed blobs (reschedule, shutdown, facilitate, ... ) keyed by
  // their original localStorage key.
  appData: Record<string, unknown>;
};

const s = (v: string | null | undefined) => v ?? "";
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

// Neon (free tier) auto-suspends when idle; the first query after a wake can fail
// with P1001 "DatabaseNotReachable" before the compute is ready. Retry transient
// connection errors a few times so the page doesn't 500 on a cold database.
async function withDbRetry<T>(fn: () => Promise<T>, tries = 4, delayMs = 700): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const code = (e as { code?: string })?.code;
      if (code !== "P1001" && code !== "P1017") throw e; // not a cold-start error
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

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

// ---------------------------------------------------------------------------
// Heavy-read cache
//
// The base data (imported snapshots + the trend aggregate) changes ONLY when an
// admin imports, but the dashboard needs all rows to compute its totals. So the
// expensive DB reads (~10k+ rows per open) were repeated on every page load and
// exhausted the free-tier data-transfer quota.
//
// Two layers now keep those heavy reads to "once per import":
//  - Layer 1 (RAM): the computed rows + trend live in server memory, keyed by an
//    import "version". Normal opens read nothing heavy from the DB.
//  - Layer 2 (compact blob): the same payload is persisted gzipped in one AppData
//    row, so a cold server (RAM cleared on restart) re-warms by reading ~1MB
//    instead of re-scanning every row.
// A new import creates a new ImportBatch -> the version changes -> the cache is
// rebuilt lazily on the next load (the one heavy read per import). Small,
// frequently-changing data (planner edits, activity, appData) is always fetched
// fresh so edits show immediately.
// ---------------------------------------------------------------------------

// v3: blob now also carries the per-plant trend breakdown. Bumped so older
// blobs (which lack it) are ignored and recomputed.
const CACHE_KEY = "__dashboard_cache_v3__";

type HeavyCache = {
  version: string;
  trend: SnapshotTrendPoint[];
  trendByPlant: Record<string, SnapshotTrendPoint[]>;
  byDate: Map<string, DraftWoRow[]>;
};

// Survive dev HMR / act as a per-instance singleton in production.
const globalForCache = globalThis as unknown as { __dashRam?: HeavyCache | null };

async function queryWorkOrders(selectedDate: string | null): Promise<DraftWoRow[]> {
  if (selectedDate) {
    // Match by calendar date via ::date. dataDate is `timestamp without time
    // zone`, so an exact-timestamp equality is timezone-dependent and returns
    // nothing on a server whose TZ differs from where the rows were written
    // (e.g. Render/UTC vs a +7 import machine). ::date compares the naive day
    // and is stable everywhere.
    const snaps = await withDbRetry(() =>
      prisma.$queryRawUnsafe<WoLike[]>(
        `SELECT wo, "desc", location, asset, plant, team, priority, "statusAJ", status,
                overdue, supervisor, "workLocation", "woType", "workRefCode",
                "targetStart", "targetFinish", "actualStart", "actualFinish", "dataDate",
                "plannedHours", "actualHours"
         FROM work_order_snapshots WHERE "dataDate"::date = $1::date
         ORDER BY "targetStart" DESC`,
        selectedDate
      )
    );
    return snaps.map(mapRow);
  }
  // No snapshots yet — fall back to the deduped current WorkOrder table.
  const orders = await withDbRetry(() =>
    prisma.workOrder.findMany({ orderBy: { targetStart: "desc" } })
  );
  return orders.map(mapRow);
}

type TrendAgg = { total: number; close: number; completed: number; planning: number; backlog: number; inprogress: number };
const mkTrendAgg = (): TrendAgg => ({ total: 0, close: 0, completed: 0, planning: 0, backlog: 0, inprogress: 0 });
const trendPoint = (date: string, g: TrendAgg): SnapshotTrendPoint => ({
  date,
  total: g.total,
  close: g.close,
  completed: g.completed,
  planning: g.planning,
  backlog: g.backlog,
  inprogress: g.inprogress,
  totalBacklog: g.planning + g.backlog,
  open: g.planning + g.backlog + g.inprogress,
});

// Per-Data_Date trend, both as an all-plants total and broken down by plant so
// the client can filter the historical trend by plant. Each plant's series is
// aligned to the same (sorted) date axis as the total, zero-filled where a plant
// has no rows for a date. Group by ::date (timezone-stable, see queryWorkOrders).
async function computeTrendData(): Promise<{
  total: SnapshotTrendPoint[];
  byPlant: Record<string, SnapshotTrendPoint[]>;
}> {
  const snapAgg = await withDbRetry(() =>
    prisma.$queryRawUnsafe<Array<{ d: string; status: string | null; plant: string | null; n: number }>>(
      `SELECT "dataDate"::date::text AS d, status,
              COALESCE(NULLIF(TRIM(plant), ''), '(ไม่ระบุ)') AS plant, COUNT(*)::int AS n
       FROM work_order_snapshots WHERE "dataDate" IS NOT NULL GROUP BY 1, 2, 3`
    )
  );
  const totalMap = new Map<string, TrendAgg>();
  const plantMap = new Map<string, Map<string, TrendAgg>>(); // plant -> date -> agg
  const dateSet = new Set<string>();
  for (const r of snapAgg) {
    const c = Number(r.n);
    const grp = snapGroup(r.status);
    dateSet.add(r.d);
    let t = totalMap.get(r.d);
    if (!t) { t = mkTrendAgg(); totalMap.set(r.d, t); }
    t.total += c; t[grp] += c;
    const plant = r.plant || "(ไม่ระบุ)";
    let pm = plantMap.get(plant);
    if (!pm) { pm = new Map(); plantMap.set(plant, pm); }
    let pa = pm.get(r.d);
    if (!pa) { pa = mkTrendAgg(); pm.set(r.d, pa); }
    pa.total += c; pa[grp] += c;
  }
  const dates = [...dateSet].sort((a, b) => a.localeCompare(b));
  const toSeries = (m: Map<string, TrendAgg>): SnapshotTrendPoint[] =>
    dates.map((date) => trendPoint(date, m.get(date) ?? mkTrendAgg()));
  const byPlant: Record<string, SnapshotTrendPoint[]> = {};
  for (const [plant, m] of plantMap) byPlant[plant] = toSeries(m);
  return { total: toSeries(totalMap), byPlant };
}

// Layer 2: read/write the compact persisted blob. Best-effort — any failure is
// treated as a cache miss so the page always falls back to a live compute.
type CacheBlob = {
  version: string;
  trend: SnapshotTrendPoint[];
  trendByPlant: Record<string, SnapshotTrendPoint[]>;
  byDate: Record<string, DraftWoRow[]>;
};

async function loadBlob(): Promise<CacheBlob | null> {
  try {
    const row = await withDbRetry(() =>
      prisma.appData.findUnique({ where: { key: CACHE_KEY } })
    );
    const gz = (row?.value as { gz?: string } | null)?.gz;
    if (!gz) return null;
    const json = gunzipSync(Buffer.from(gz, "base64")).toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function saveBlob(blob: CacheBlob): Promise<void> {
  try {
    const gz = gzipSync(Buffer.from(JSON.stringify(blob), "utf8")).toString("base64");
    await prisma.appData.upsert({
      where: { key: CACHE_KEY },
      create: { key: CACHE_KEY, value: { gz } },
      update: { value: { gz } },
    });
  } catch {
    // Persisting the warm cache is an optimization; never fail the request over it.
  }
}

async function ramWorkOrders(selectedDate: string | null): Promise<DraftWoRow[]> {
  const ram = globalForCache.__dashRam!;
  const key = selectedDate ?? "";
  const cached = ram.byDate.get(key);
  if (cached) return cached;
  const wo = await queryWorkOrders(selectedDate);
  ram.byDate.set(key, wo);
  return wo;
}

async function getHeavy(
  version: string,
  selectedDate: string | null
): Promise<{
  trend: SnapshotTrendPoint[];
  trendByPlant: Record<string, SnapshotTrendPoint[]>;
  workOrders: DraftWoRow[];
}> {
  // Layer 1: RAM hit — no heavy DB read at all.
  const ram = globalForCache.__dashRam;
  if (ram && ram.version === version) {
    return { trend: ram.trend, trendByPlant: ram.trendByPlant, workOrders: await ramWorkOrders(selectedDate) };
  }

  // Layer 2: warm from the compact persisted blob (cheap re-warm after restart).
  const blob = await loadBlob();
  if (blob && blob.version === version) {
    globalForCache.__dashRam = {
      version,
      trend: blob.trend,
      trendByPlant: blob.trendByPlant ?? {},
      byDate: new Map(Object.entries(blob.byDate)),
    };
    return { trend: blob.trend, trendByPlant: blob.trendByPlant ?? {}, workOrders: await ramWorkOrders(selectedDate) };
  }

  // Miss (new import or cold with no valid blob): the one heavy read. Compute,
  // fill RAM, and persist the blob for the next cold start.
  const { total: trend, byPlant: trendByPlant } = await computeTrendData();
  const workOrders = await queryWorkOrders(selectedDate);
  const key = selectedDate ?? "";
  globalForCache.__dashRam = {
    version,
    trend,
    trendByPlant,
    byDate: new Map([[key, workOrders]]),
  };
  await saveBlob({ version, trend, trendByPlant, byDate: { [key]: workOrders } });
  return { trend, trendByPlant, workOrders };
}

// Read the shared state from Postgres, shaped like the prototype's payload.
// Shows one Data_Date snapshot at a time: `requestedDate` (YYYY-MM-DD) if given
// and available, otherwise the latest snapshot. Heavy reads are cached (see
// above); planner edits/activity/appData are always fresh.
export async function getDraftState(requestedDate?: string): Promise<DraftState> {
  try {
    return await getDraftStateCached(requestedDate);
  } catch (err) {
    // The live DB is unreachable (Neon free-tier data-transfer quota exhausted,
    // cold-start that never woke, etc.). Serve a valid fallback so the page opens
    // with the verified trend + an honest banner instead of an HTTP 500.
    console.error("[getDraftState] falling back to bundled seed:", err);
    return buildFallbackState();
  }
}

async function getDraftStateCached(requestedDate?: string): Promise<DraftState> {
  // Light queries — small and always fetched fresh so edits appear immediately.
  // The big cache blob is excluded from the appData fetch so we don't transfer
  // it on every request (it's read only when re-warming, in loadBlob).
  const [dateRows, updates, activity, lastBatch, appDataRows] = await withDbRetry(() =>
    Promise.all([
      // Distinct calendar dates via ::date (timezone-stable), newest first.
      prisma.$queryRawUnsafe<Array<{ d: string }>>(
        `SELECT DISTINCT "dataDate"::date::text AS d
         FROM work_order_snapshots WHERE "dataDate" IS NOT NULL ORDER BY d DESC`
      ),
      prisma.workOrderUpdate.findMany(),
      prisma.activityLog.findMany({
        where: { action: "STATUS_UPDATE" },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true } } },
      }),
      prisma.importBatch.findFirst({ orderBy: { createdAt: "desc" } }),
      // Exclude any cache blob (all versions) so it's never sent on a normal load.
      prisma.appData.findMany({ where: { NOT: { key: { startsWith: "__dashboard_cache_" } } } }),
    ])
  );

  const appData: Record<string, unknown> = {};
  for (const r of appDataRows) appData[r.key] = r.value;

  const availableDates = dateRows.map((d) => d.d);
  const selectedDate =
    requestedDate && availableDates.includes(requestedDate)
      ? requestedDate
      : availableDates[0] ?? null;

  // Cache version: the latest import batch id. A new import -> new batch id ->
  // the heavy cache is rebuilt once on the next load.
  const version = lastBatch ? lastBatch.id : `nobatch:${availableDates.length}`;

  const heavy = await getHeavy(version, selectedDate);

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
    workOrders: heavy.workOrders,
    userUpdates,
    activity: activityOut,
    meta: {
      rows: heavy.workOrders.length,
      uploadedAt: lastBatch ? lastBatch.createdAt.toISOString() : null,
      fileName: lastBatch ? lastBatch.fileName : null,
      availableDates,
      selectedDate,
      snapshotTrend: heavy.trend,
      snapshotTrendByPlant: heavy.trendByPlant,
    },
    appData,
  };
}
