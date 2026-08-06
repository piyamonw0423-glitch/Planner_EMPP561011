import "dotenv/config";
import { pruneOldSnapshots, SNAPSHOT_RETENTION_MONTHS } from "@/lib/import/run-import";
import { prisma } from "@/lib/prisma";

// Preview (default) or apply pruning of old raw work_order_snapshots. The trend
// history is preserved in work_order_daily_summary, so this only removes the
// redundant per-Data_Date detail rows older than the retention window.
//   npm run prune            -> dry-run (shows what WOULD be deleted)
//   npm run prune -- --apply -> actually delete
const apply = process.argv.includes("--apply");

async function main() {
  const r = await pruneOldSnapshots({ dryRun: !apply });
  console.log(`retention: ${SNAPSHOT_RETENTION_MONTHS} เดือน | cutoff: ${r.cutoff ?? "(ไม่มีข้อมูล)"}`);
  if (r.deletedDays.length === 0) {
    console.log("✅ ไม่มีข้อมูลถึงเกณฑ์ลบ (0 วัน) — ข้อมูลยังไม่เกินช่วงเก็บ");
  } else {
    console.log(
      `${apply ? "🗑️  ลบแล้ว" : "(dry-run) จะลบ"} ${r.deletedDays.length} วัน, ${r.deletedRows.toLocaleString()} แถว:`
    );
    for (const d of r.deletedDays) console.log("   " + d);
    if (!apply) console.log("\nรันจริงด้วย:  npm run prune -- --apply");
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ ผิดพลาด:", e instanceof Error ? e.message : e);
  process.exit(1);
});
