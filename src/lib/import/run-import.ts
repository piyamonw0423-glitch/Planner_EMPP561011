import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  parseRows,
  streamCsv,
  parseSheetRef,
  gvizUrl,
  gvizDateToIso,
  type ParsedWorkOrder,
} from "./parse";

const BATCH_SIZE = 500;

// Rebuild the current WorkOrder table from the latest snapshot per WO, entirely
// in the database (no app memory). Run after snapshots change.
async function rebuildWorkOrdersFromSnapshots() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO work_orders (
      wo, "desc", location, asset, plant, team, priority, "statusAJ", status,
      overdue, supervisor, "workLocation", "woType", "targetStart",
      "targetFinish", "actualStart", "actualFinish", "dataDate",
      "plannedHours", "actualHours", "importBatchId", "createdAt", "updatedAt"
    )
    SELECT DISTINCT ON (wo)
      wo, "desc", location, asset, plant, team, priority, "statusAJ", status,
      overdue, supervisor, "workLocation", "woType", "targetStart",
      "targetFinish", "actualStart", "actualFinish", "dataDate",
      "plannedHours", "actualHours", "importBatchId", now(), now()
    FROM work_order_snapshots
    ORDER BY wo, "dataDate" DESC
    ON CONFLICT (wo) DO UPDATE SET
      "desc" = EXCLUDED."desc", location = EXCLUDED.location, asset = EXCLUDED.asset,
      plant = EXCLUDED.plant, team = EXCLUDED.team, priority = EXCLUDED.priority,
      "statusAJ" = EXCLUDED."statusAJ", status = EXCLUDED.status, overdue = EXCLUDED.overdue,
      supervisor = EXCLUDED.supervisor, "workLocation" = EXCLUDED."workLocation",
      "woType" = EXCLUDED."woType", "targetStart" = EXCLUDED."targetStart",
      "targetFinish" = EXCLUDED."targetFinish", "actualStart" = EXCLUDED."actualStart",
      "actualFinish" = EXCLUDED."actualFinish", "dataDate" = EXCLUDED."dataDate",
      "plannedHours" = EXCLUDED."plannedHours", "actualHours" = EXCLUDED."actualHours",
      "importBatchId" = EXCLUDED."importBatchId", "updatedAt" = now()
  `);
}

// Incremental, low-memory CSV import (for large Google-Sheet URL refreshes on a
// small server): stream-parse, keep only rows for Data_Dates not already stored,
// upsert those snapshots, then rebuild WorkOrder from snapshots in SQL.
export async function runIncrementalCsvImport(opts: {
  csv: string;
  fileName: string;
  source: "UPLOAD" | "URL";
  importedById: string;
}): Promise<{ id: string | null; rowCount: number; newDates: string[] }> {
  const { csv, fileName, source, importedById } = opts;

  const existingDatesRows = await prisma.workOrderSnapshot.findMany({
    distinct: ["dataDate"],
    select: { dataDate: true },
  });
  const existing = new Set(existingDatesRows.map((d) => d.dataDate.toISOString()));

  // Stream the CSV; keep only rows whose Data_Date is new (dedup on wo+dataDate).
  const newRows = new Map<string, ParsedWorkOrder>();
  const newDates = new Set<string>();
  streamCsv(csv, (raw) => {
    const p = parseRows([raw])[0];
    if (!p || !p.dataDate) return;
    const iso = p.dataDate.toISOString();
    if (existing.has(iso)) return;
    newDates.add(iso);
    newRows.set(`${p.wo}|${iso}`, p);
  });

  const snapRows = [...newRows.values()];
  if (snapRows.length === 0) {
    return { id: null, rowCount: 0, newDates: [] };
  }

  const batch = await prisma.importBatch.create({
    data: { fileName, source, rowCount: snapRows.length, importedById },
  });
  for (const part of chunk(snapRows, BATCH_SIZE)) {
    await upsertSnapshotBatch(part, batch.id);
  }
  await rebuildWorkOrdersFromSnapshots();

  await prisma.activityLog.create({
    data: {
      userId: importedById,
      action: "IMPORT",
      detail: {
        fileName,
        source,
        snapshots: snapRows.length,
        newDates: [...newDates].map((d) => d.slice(0, 10)),
        batchId: batch.id,
      },
    },
  });

  return {
    id: batch.id,
    rowCount: snapRows.length,
    newDates: [...newDates].map((d) => d.slice(0, 10)),
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function upsertBatch(rows: ParsedWorkOrder[], importBatchId: string) {
  if (rows.length === 0) return;

  const values = Prisma.join(
    rows.map(
      (r) =>
        Prisma.sql`(${r.wo}, ${r.desc}, ${r.location}, ${r.asset}, ${r.plant}, ${r.team}, ${r.priority}, ${r.statusAJ}, ${r.status}, ${r.overdue}, ${r.supervisor}, ${r.workLocation}, ${r.woType}, ${r.targetStart}, ${r.targetFinish}, ${r.actualStart}, ${r.actualFinish}, ${r.dataDate}, ${r.plannedHours}, ${r.actualHours}, ${importBatchId}, now(), now())`
    )
  );

  await prisma.$executeRaw`
    INSERT INTO work_orders (
      wo, "desc", location, asset, plant, team, priority, "statusAJ", status, overdue,
      supervisor, "workLocation", "woType", "targetStart", "targetFinish",
      "actualStart", "actualFinish", "dataDate", "plannedHours", "actualHours",
      "importBatchId", "createdAt", "updatedAt"
    )
    VALUES ${values}
    ON CONFLICT (wo) DO UPDATE SET
      "desc" = EXCLUDED."desc",
      location = EXCLUDED.location,
      asset = EXCLUDED.asset,
      plant = EXCLUDED.plant,
      team = EXCLUDED.team,
      priority = EXCLUDED.priority,
      "statusAJ" = EXCLUDED."statusAJ",
      status = EXCLUDED.status,
      overdue = EXCLUDED.overdue,
      supervisor = EXCLUDED.supervisor,
      "workLocation" = EXCLUDED."workLocation",
      "woType" = EXCLUDED."woType",
      "targetStart" = EXCLUDED."targetStart",
      "targetFinish" = EXCLUDED."targetFinish",
      "actualStart" = EXCLUDED."actualStart",
      "actualFinish" = EXCLUDED."actualFinish",
      "dataDate" = EXCLUDED."dataDate",
      "plannedHours" = EXCLUDED."plannedHours",
      "actualHours" = EXCLUDED."actualHours",
      "importBatchId" = EXCLUDED."importBatchId",
      "updatedAt" = now()
  `;
}

async function upsertSnapshotBatch(
  rows: ParsedWorkOrder[],
  importBatchId: string
) {
  if (rows.length === 0) return;

  const values = Prisma.join(
    rows.map(
      (r) =>
        Prisma.sql`(gen_random_uuid()::text, ${r.wo}, ${r.dataDate}, ${r.desc}, ${r.location}, ${r.asset}, ${r.plant}, ${r.team}, ${r.priority}, ${r.statusAJ}, ${r.status}, ${r.overdue}, ${r.supervisor}, ${r.workLocation}, ${r.woType}, ${r.targetStart}, ${r.targetFinish}, ${r.actualStart}, ${r.actualFinish}, ${r.plannedHours}, ${r.actualHours}, ${importBatchId}, now())`
    )
  );

  await prisma.$executeRaw`
    INSERT INTO work_order_snapshots (
      id, wo, "dataDate", "desc", location, asset, plant, team, priority,
      "statusAJ", status, overdue, supervisor, "workLocation", "woType",
      "targetStart", "targetFinish", "actualStart", "actualFinish",
      "plannedHours", "actualHours", "importBatchId", "createdAt"
    )
    VALUES ${values}
    ON CONFLICT (wo, "dataDate") DO UPDATE SET
      "desc" = EXCLUDED."desc",
      location = EXCLUDED.location,
      asset = EXCLUDED.asset,
      plant = EXCLUDED.plant,
      team = EXCLUDED.team,
      priority = EXCLUDED.priority,
      "statusAJ" = EXCLUDED."statusAJ",
      status = EXCLUDED.status,
      overdue = EXCLUDED.overdue,
      supervisor = EXCLUDED.supervisor,
      "workLocation" = EXCLUDED."workLocation",
      "woType" = EXCLUDED."woType",
      "targetStart" = EXCLUDED."targetStart",
      "targetFinish" = EXCLUDED."targetFinish",
      "actualStart" = EXCLUDED."actualStart",
      "actualFinish" = EXCLUDED."actualFinish",
      "plannedHours" = EXCLUDED."plannedHours",
      "actualHours" = EXCLUDED."actualHours",
      "importBatchId" = EXCLUDED."importBatchId"
  `;
}

// Scalable incremental import via the gviz query API: ask Google which
// Data_Dates exist (tiny response), then download ONLY the dates we don't have
// yet. Stays fast no matter how large the whole sheet grows.
export async function runGvizIncrementalImport(opts: {
  sheetUrl: string;
  fileName: string;
  source: "UPLOAD" | "URL";
  importedById: string;
}): Promise<{ id: string | null; rowCount: number; newDates: string[] }> {
  const ref = parseSheetRef(opts.sheetUrl);
  if (!ref) throw new Error("not a Google Sheets URL");

  // 1) Which Data_Dates does the sheet have? (BL = Data_Date column)
  const countCsv = await (
    await fetch(gvizUrl(ref.id, ref.gid, "select BL, count(A) group by BL"))
  ).text();
  const sheetDates: string[] = [];
  streamCsv(countCsv, (r) => {
    const raw = String(r["Data_Date"] ?? Object.values(r)[0] ?? "");
    const iso = gvizDateToIso(raw);
    if (iso) sheetDates.push(iso);
  });
  if (sheetDates.length === 0) throw new Error("gviz returned no dates");

  // 2) Skip dates already stored.
  const existingRows = await prisma.workOrderSnapshot.findMany({
    distinct: ["dataDate"],
    select: { dataDate: true },
  });
  const existing = new Set(
    existingRows.map((d) => d.dataDate.toISOString().slice(0, 10))
  );
  const newDates = sheetDates.filter((d) => !existing.has(d));
  if (newDates.length === 0) return { id: null, rowCount: 0, newDates: [] };

  // 3) Download only the new dates' rows.
  const snap = new Map<string, ParsedWorkOrder>();
  for (const iso of newDates) {
    const csv = await (
      await fetch(gvizUrl(ref.id, ref.gid, `select * where BL = date '${iso}'`))
    ).text();
    streamCsv(csv, (raw) => {
      const p = parseRows([raw])[0];
      if (p && p.dataDate) snap.set(`${p.wo}|${p.dataDate.toISOString()}`, p);
    });
  }
  const snapRows = [...snap.values()];
  if (snapRows.length === 0) return { id: null, rowCount: 0, newDates: [] };

  const batch = await prisma.importBatch.create({
    data: {
      fileName: opts.fileName,
      source: opts.source,
      rowCount: snapRows.length,
      importedById: opts.importedById,
    },
  });
  for (const part of chunk(snapRows, BATCH_SIZE)) {
    await upsertSnapshotBatch(part, batch.id);
  }
  await rebuildWorkOrdersFromSnapshots();
  await prisma.activityLog.create({
    data: {
      userId: opts.importedById,
      action: "IMPORT",
      detail: {
        fileName: opts.fileName,
        source: opts.source,
        via: "gviz",
        snapshots: snapRows.length,
        newDates,
        batchId: batch.id,
      },
    },
  });
  return { id: batch.id, rowCount: snapRows.length, newDates };
}

export async function runImport(opts: {
  rows: ParsedWorkOrder[];
  fileName: string;
  source: "UPLOAD" | "URL";
  importedById: string;
}) {
  const { fileName, source, importedById } = opts;

  // The sheet stacks daily snapshots: the same Work Order appears once per
  // Data_Date. WorkOrder keeps only the LATEST snapshot per WO (for current
  // state + planner updates); WorkOrderSnapshot keeps every (WO, Data_Date).
  const latest = new Map<string, ParsedWorkOrder>();
  for (const row of opts.rows) {
    const prev = latest.get(row.wo);
    if (!prev) {
      latest.set(row.wo, row);
      continue;
    }
    const a = row.dataDate?.getTime() ?? -Infinity;
    const b = prev.dataDate?.getTime() ?? -Infinity;
    if (a >= b) latest.set(row.wo, row);
  }
  const woRows = [...latest.values()];

  // All rows with a Data_Date -> snapshots (dedup on wo+dataDate, keep last).
  const snapMap = new Map<string, ParsedWorkOrder>();
  for (const row of opts.rows) {
    if (!row.dataDate) continue;
    snapMap.set(`${row.wo}|${row.dataDate.toISOString()}`, row);
  }
  const snapRows = [...snapMap.values()];

  const batch = await prisma.importBatch.create({
    data: { fileName, source, rowCount: woRows.length, importedById },
  });

  for (const part of chunk(woRows, BATCH_SIZE)) {
    await upsertBatch(part, batch.id);
  }
  for (const part of chunk(snapRows, BATCH_SIZE)) {
    await upsertSnapshotBatch(part, batch.id);
  }

  await prisma.activityLog.create({
    data: {
      userId: importedById,
      action: "IMPORT",
      detail: {
        fileName,
        source,
        rowCount: woRows.length,
        snapshots: snapRows.length,
        batchId: batch.id,
      },
    },
  });

  return batch;
}
