import "server-only";
import type { DraftState } from "@/lib/draft-state";

// Verified snapshot trend (queried directly from the DB on 2026-07-24, before the
// Neon free-tier data-transfer quota blocked reads). This is bundled so the WO
// CUMULATIVE TREND chart — the headline "+30% backlog" story — keeps working even
// when the live database is temporarily unreachable. Kept in sync with
// PROJECT_CONTEXT.md Appendix A; re-verify and update after each new snapshot.
type TrendSeed = {
  date: string;
  total: number;
  close: number;
  completed: number;
  planning: number;
  backlog: number;
  inprogress: number;
};

const TREND_SEED: TrendSeed[] = [
  { date: "2026-04-07", total: 5537, close: 3502, completed: 175, planning: 1250, backlog: 289, inprogress: 321 },
  { date: "2026-04-16", total: 5644, close: 3514, completed: 324, planning: 1098, backlog: 349, inprogress: 359 },
  { date: "2026-04-23", total: 6042, close: 3605, completed: 558, planning: 1099, backlog: 359, inprogress: 421 },
  { date: "2026-05-07", total: 6980, close: 4641, completed: 209, planning: 1390, backlog: 335, inprogress: 405 },
  { date: "2026-05-14", total: 7456, close: 4801, completed: 348, planning: 1467, backlog: 374, inprogress: 466 },
  { date: "2026-05-21", total: 7843, close: 4985, completed: 497, planning: 1451, backlog: 399, inprogress: 511 },
  { date: "2026-05-28", total: 8193, close: 5154, completed: 727, planning: 1368, backlog: 394, inprogress: 550 },
  { date: "2026-06-04", total: 8601, close: 5766, completed: 434, planning: 1519, backlog: 391, inprogress: 491 },
  { date: "2026-06-20", total: 9393, close: 6449, completed: 459, planning: 1454, backlog: 456, inprogress: 575 },
  { date: "2026-07-08", total: 10454, close: 7549, completed: 303, planning: 1529, backlog: 499, inprogress: 574 },
  { date: "2026-07-14", total: 10706, close: 7635, completed: 445, planning: 1517, backlog: 501, inprogress: 608 },
  { date: "2026-07-21", total: 10940, close: 7793, completed: 535, planning: 1505, backlog: 495, inprogress: 612 },
];

// Build a valid, non-throwing DraftState for when the live DB can't be read.
// Rows are empty (row-level data lives only in the DB), but the verified trend
// keeps the flagship chart intact, and meta.dbUnavailable lets the UI show an
// honest banner instead of a broken/empty-looking dashboard or an HTTP 500.
export function buildFallbackState(): DraftState {
  const snapshotTrend = TREND_SEED.map((t) => ({
    date: t.date,
    total: t.total,
    close: t.close,
    completed: t.completed,
    planning: t.planning,
    backlog: t.backlog,
    inprogress: t.inprogress,
    totalBacklog: t.planning + t.backlog,
    open: t.planning + t.backlog + t.inprogress,
  }));
  const latest = TREND_SEED[TREND_SEED.length - 1];
  return {
    workOrders: [],
    userUpdates: {},
    activity: [],
    meta: {
      rows: 0,
      uploadedAt: null,
      fileName: null,
      availableDates: TREND_SEED.map((t) => t.date),
      selectedDate: latest.date,
      snapshotTrend,
      // Read by /tower to render a status banner. Not part of the normal payload.
      dbUnavailable: true,
    } as DraftState["meta"] & { dbUnavailable: true },
    appData: {},
  };
}
