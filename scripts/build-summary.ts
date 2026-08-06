import "dotenv/config";
import { rebuildDailySummaryForDays } from "@/lib/import/run-import";
import { prisma } from "@/lib/prisma";

// One-time (idempotent) backfill of the work_order_daily_summary table from the
// existing raw snapshots. Safe to re-run — it TRUNCATEs and rebuilds every day.
// After this, the dashboard trend reads from the tiny summary layer, and the
// summary keeps itself up to date on each future import.
async function main() {
  const t0 = Date.now();
  console.log("กำลังสร้างชั้นสรุป (work_order_daily_summary) จาก snapshots...");
  await rebuildDailySummaryForDays(null);

  // Verify: per-day totals from the summary vs. from the raw snapshots.
  const summ = await prisma.$queryRawUnsafe<Array<{ day: string; total: number }>>(
    `SELECT day, SUM(cnt)::int AS total FROM work_order_daily_summary GROUP BY day ORDER BY day`
  );
  const raw = await prisma.$queryRawUnsafe<Array<{ day: string; total: number }>>(
    `SELECT "dataDate"::date::text AS day, COUNT(*)::int AS total
     FROM work_order_snapshots WHERE "dataDate" IS NOT NULL GROUP BY 1 ORDER BY 1`
  );
  const rawMap = new Map(raw.map((r) => [r.day, Number(r.total)]));

  console.log(`\n${summ.length} วัน (snapshots มี ${raw.length} วัน):`);
  let mismatch = 0;
  for (const r of summ) {
    const rawTotal = rawMap.get(r.day);
    const ok = rawTotal === Number(r.total);
    if (!ok) mismatch++;
    console.log(
      `  ${r.day}  summary=${Number(r.total).toLocaleString()}  raw=${(rawTotal ?? 0).toLocaleString()}  ${ok ? "✓" : "✗ MISMATCH"}`
    );
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    mismatch === 0
      ? `\n✅ สร้างชั้นสรุปสำเร็จ ตรงกับ snapshots ทุกวัน  [${secs}s]`
      : `\n⚠️ พบ ${mismatch} วันที่ไม่ตรง — ตรวจสอบ  [${secs}s]`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ ผิดพลาด:", e instanceof Error ? e.message : e);
  process.exit(1);
});
