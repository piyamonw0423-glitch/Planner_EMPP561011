import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  classifyStatus,
  classifyStatusCase,
  isDoneStatusCase,
  isSameDay,
  daysBetween,
  statusGroup,
  type StatusKey,
} from "@/lib/wo-status";
import { detectCategory } from "@/lib/category";

export type OverviewFilters = {
  plant?: string;
  status?: string; // 'backlog'|'inprogress'|'notactive'|'close'|'completed' or 'raw:XXX'
  workType?: string;
  priority?: string;
  team?: string;
  supervisor?: string;
  from?: string;
  to?: string;
};

type Row = Awaited<ReturnType<typeof getAllRows>>[number];

// Memoized per-request: both getOverviewFilterOptions() and getOverviewData()
// need the full row set, but should only hit the DB once per request.
const getAllRows = cache(async () => {
  return prisma.workOrder.findMany({
    select: {
      wo: true,
      desc: true,
      plant: true,
      team: true,
      priority: true,
      statusAJ: true,
      status: true,
      overdue: true,
      supervisor: true,
      woType: true,
      targetStart: true,
      targetFinish: true,
      actualStart: true,
      actualFinish: true,
      update: { select: { status: true } },
    },
  });
});

function applyFilters(rows: Row[], f: OverviewFilters): Row[] {
  const from = f.from ? new Date(f.from) : null;
  const to = f.to ? new Date(f.to) : null;
  if (to) to.setHours(23, 59, 59, 999);

  return rows.filter((r) => {
    if (f.plant && (r.plant || "").trim() !== f.plant) return false;
    if (f.team && (r.team || "").trim() !== f.team) return false;
    if (f.supervisor && (r.supervisor || "").trim() !== f.supervisor) return false;
    if (f.priority && (r.priority || "").trim() !== f.priority) return false;
    if (f.workType && detectCategory(r) !== f.workType) return false;
    if (from && (!r.targetStart || r.targetStart < from)) return false;
    if (to && (!r.targetStart || r.targetStart > to)) return false;
    if (f.status) {
      if (f.status.startsWith("raw:")) {
        if ((r.status || "").trim().toUpperCase() !== f.status.slice(4)) return false;
      } else if (statusGroup(r.status) !== f.status) {
        return false;
      }
    }
    return true;
  });
}

export async function getOverviewFilterOptions() {
  const rows = await getAllRows();
  const plants = new Set<string>();
  const teams = new Set<string>();
  const supervisors = new Set<string>();
  const workTypes = new Set<string>();
  const rawStatuses = new Set<string>();
  for (const r of rows) {
    if (r.plant?.trim()) plants.add(r.plant.trim());
    if (r.team?.trim()) teams.add(r.team.trim());
    if (r.supervisor?.trim()) supervisors.add(r.supervisor.trim());
    workTypes.add(detectCategory(r));
    if (r.status?.trim()) rawStatuses.add(r.status.trim().toUpperCase());
  }
  return {
    plants: [...plants].sort(),
    teams: [...teams].sort(),
    supervisors: [...supervisors].sort(),
    workTypes: [...workTypes].sort(),
    rawStatuses: [...rawStatuses].sort(),
  };
}

function buildTeamCard(team: string, rows: Row[], isTotal: boolean) {
  const wo = rows.length;
  const closeCount = rows.filter((r) => statusGroup(r.status) === "close").length;
  const compCount = rows.filter((r) => statusGroup(r.status) === "completed").length;
  const backlog = Math.max(0, wo - closeCount - compCount);
  const overdue = rows.filter(
    (r) =>
      r.overdue === "Overdue" &&
      statusGroup(r.status) !== "close" &&
      statusGroup(r.status) !== "completed"
  ).length;
  const ratio = wo ? Math.round((backlog / wo) * 1000) / 10 : 0;
  const healthColor = ratio > 70 ? "#ef4444" : ratio > 40 ? "#f59e0b" : "#10b981";
  const healthBg = ratio > 70 ? "#fee2e2" : ratio > 40 ? "#fef3c7" : "#d1fae5";
  const healthLabel = ratio > 70 ? "CRITICAL" : ratio > 40 ? "WARNING" : "HEALTHY";

  return { team, isTotal, wo, backlog, closeCount, overdue, ratio, healthColor, healthBg, healthLabel };
}

function weekBuckets(rows: Row[]) {
  const dates = rows.map((r) => r.targetStart).filter((d): d is Date => !!d);
  if (dates.length === 0) {
    return { labels: [] as string[], wo: [] as number[], closeArr: [] as number[], compArr: [] as number[], inprogress: [] as number[], backlog: [] as number[] };
  }
  const minD = new Date(Math.min(...dates.map((d) => d.getTime())));
  minD.setHours(0, 0, 0, 0);
  const maxD = new Date(Math.max(...dates.map((d) => d.getTime())));
  const totalDays = Math.max(1, Math.ceil((maxD.getTime() - minD.getTime()) / 86400000));
  let bucketDays = Math.max(7, Math.ceil(totalDays / 12));
  bucketDays = Math.ceil(bucketDays / 7) * 7;

  const buckets: Array<{ start: Date; end: Date }> = [];
  const cursor = new Date(minD);
  while (cursor <= maxD) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + bucketDays);
    buckets.push({ start: new Date(cursor), end });
    cursor.setDate(cursor.getDate() + bucketDays);
  }

  const fmtOpt: Intl.DateTimeFormatOptions =
    bucketDays > 25 ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" };
  const labels = buckets.map((b) => b.start.toLocaleDateString("th-TH", fmtOpt));

  const wo = buckets.map(
    (b) =>
      new Set(
        rows.filter((r) => r.targetStart && r.targetStart >= b.start && r.targetStart < b.end).map((r) => r.wo)
      ).size
  );
  const closeArr = buckets.map(
    (b) =>
      new Set(
        rows
          .filter((r) => {
            if (statusGroup(r.status) !== "close") return false;
            const d = r.actualFinish || r.targetFinish;
            return !!d && d >= b.start && d < b.end;
          })
          .map((r) => r.wo)
      ).size
  );
  const compArr = buckets.map(
    (b) =>
      new Set(
        rows
          .filter((r) => {
            if (statusGroup(r.status) !== "completed") return false;
            const d = r.actualFinish || r.targetFinish;
            return !!d && d >= b.start && d < b.end;
          })
          .map((r) => r.wo)
      ).size
  );
  const inprogress = buckets.map(
    (b) =>
      new Set(
        rows
          .filter((r) => !!(r.targetStart && r.targetStart < b.end) && statusGroup(r.status) === "inprogress")
          .map((r) => r.wo)
      ).size
  );
  let running = 0;
  const backlog = buckets.map((b, i) => {
    running += wo[i] - closeArr[i] - compArr[i];
    return Math.max(0, running);
  });

  return { labels, wo, closeArr, compArr, inprogress, backlog };
}

function recordCountByTeam(rows: Row[]) {
  const groups = new Map<string, { closed: number; overdue: number; onDue: number; total: number }>();
  for (const r of rows) {
    const team = (r.team || "OTHER").toString();
    if (!groups.has(team)) groups.set(team, { closed: 0, overdue: 0, onDue: 0, total: 0 });
    const g = groups.get(team)!;
    const st = classifyStatusCase(r.status);
    g.total++;
    if (isDoneStatusCase(st.key)) g.closed++;
    else if (r.overdue === "Overdue") g.overdue++;
    else g.onDue++;
  }
  const entries = [...groups.entries()].sort((a, b) => b[1].total - a[1].total);
  const totals = entries.reduce(
    (acc, [, g]) => ({
      closed: acc.closed + g.closed,
      overdue: acc.overdue + g.overdue,
      onDue: acc.onDue + g.onDue,
      total: acc.total + g.total,
    }),
    { closed: 0, overdue: 0, onDue: 0, total: 0 }
  );
  return { entries, totals };
}

function agingByCase(rows: Row[], today: Date) {
  const buckets = { b1: 0, b2: 0, b3: 0, b4: 0 };
  for (const r of rows) {
    if (classifyStatusCase(r.status).key === "backlog" && r.targetStart) {
      const age = daysBetween(r.targetStart, today);
      if (age <= 7) buckets.b1++;
      else if (age <= 30) buckets.b2++;
      else if (age <= 90) buckets.b3++;
      else buckets.b4++;
    }
  }
  return buckets;
}

function p1Report(rows: Row[], today: Date) {
  const p1 = rows.filter((r) => (r.priority || "").trim() === "1");
  const p1Open = p1.filter((r) => classifyStatusCase(r.status).key === "backlog");
  const p1Overdue = p1Open.filter((r) => r.overdue === "Overdue");
  const p1OnDue = p1Open.filter((r) => r.overdue !== "Overdue");
  const p1NoStart = p1Open.filter((r) => !r.actualStart);
  const age = (r: Row) => (r.targetStart ? daysBetween(r.targetStart, today) : 0);
  const p1gt30 = p1Open.filter((r) => age(r) > 30);
  const p1gt14 = p1Open.filter((r) => age(r) > 14 && age(r) <= 30);
  const p1gt7 = p1Open.filter((r) => age(r) > 7 && age(r) <= 14);
  const p1gt3 = p1Open.filter((r) => age(r) > 3 && age(r) <= 7);
  return {
    open: p1Open.length,
    overdue: p1Overdue.length,
    onDue: p1OnDue.length,
    noStart: p1NoStart.length,
    gt3: p1gt3.length,
    gt7: p1gt7.length,
    gt14: p1gt14.length,
    gt30: p1gt30.length,
  };
}

function categoryBreakdown(rows: Row[]) {
  const cats = new Map<string, number>();
  for (const r of rows) {
    const c = detectCategory(r);
    cats.set(c, (cats.get(c) || 0) + 1);
  }
  return [...cats.entries()].sort((a, b) => b[1] - a[1]);
}

export async function getOverviewData(filters: OverviewFilters = {}) {
  const allRows = await getAllRows();
  const rows = applyFilters(allRows, filters);
  const today = new Date();

  // ----- Work Order Performance style KPIs (statusAJ + planner override based) -----
  let open = 0;
  let overdue = 0;
  let dueToday = 0;
  let completedToday = 0;
  let waitingMaterial = 0;
  const statusBuckets: Record<StatusKey, number> = {
    notstart: 0,
    inprogress: 0,
    waiting: 0,
    waitingapproval: 0,
    completed: 0,
  };
  const teamCounts = new Map<string, number>();
  const agingBuckets = { b1: 0, b2: 0, b3: 0, b4: 0 };
  let agingTotal = 0;

  for (const r of rows) {
    const st = classifyStatus(r);
    statusBuckets[st.key]++;
    const isOpen = st.key !== "completed";
    if (isOpen) open++;
    if (isOpen && r.overdue === "Overdue") overdue++;
    if (isOpen && r.targetFinish && isSameDay(r.targetFinish, today)) dueToday++;
    if (st.key === "completed" && r.actualFinish && isSameDay(r.actualFinish, today)) completedToday++;
    if (st.key === "waiting") waitingMaterial++;
    if (isOpen) {
      const team = r.team || "OTHER";
      teamCounts.set(team, (teamCounts.get(team) || 0) + 1);
    }
    if (isOpen && r.targetStart) {
      const age = daysBetween(r.targetStart, today);
      agingTotal++;
      if (age <= 7) agingBuckets.b1++;
      else if (age <= 30) agingBuckets.b2++;
      else if (age <= 90) agingBuckets.b3++;
      else agingBuckets.b4++;
    }
  }

  const workload = [...teamCounts.entries()].sort((a, b) => b[1] - a[1]).map(([team, count]) => ({ team, count }));
  const workloadMax = Math.max(1, ...workload.map((w) => w.count));

  // ----- Executive Overview: team breakdown cards (top 3 + total) -----
  const teamGroups = new Map<string, Row[]>();
  for (const r of rows) {
    const team = (r.team || "OTHER").toString();
    if (!teamGroups.has(team)) teamGroups.set(team, []);
    teamGroups.get(team)!.push(r);
  }
  const topTeams = [...teamGroups.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3);
  const teamCards = [
    ...topTeams.map(([team, list]) => buildTeamCard(team, list, false)),
    buildTeamCard("TOTAL (ALL CM)", rows, true),
  ];

  const trend = weekBuckets(rows);
  const recordCount = recordCountByTeam(rows);
  const overviewAging = agingByCase(rows, today);
  const p1 = p1Report(rows, today);
  const categories = categoryBreakdown(rows);

  return {
    kpi: { open, overdue, dueToday, completedToday, waitingMaterial },
    statusBuckets,
    statusTotal: rows.length,
    workload,
    workloadMax,
    aging: agingBuckets,
    agingTotal,
    teamCards,
    trend,
    recordCount,
    overviewAging,
    p1,
    categories,
  };
}
