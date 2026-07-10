import "dotenv/config";
import { runGvizIncrementalImport } from "@/lib/import/run-import";
import { prisma } from "@/lib/prisma";

// Local data-refresh tool: runs on your PC with full resources and writes to the
// SAME cloud database the website reads from — so the online dashboard (and the
// team) sees the new data immediately. Pass a sheet URL, or set SHEET_URL, or
// fall back to the default below.
const DEFAULT_URL =
  "https://docs.google.com/spreadsheets/d/1QIg4xNmYjx9iDY_DfY50XRhzI7yct_P2D8ksYhSYWhY/edit?gid=1813264978";

async function main() {
  const url = process.argv[2] || process.env.SHEET_URL || DEFAULT_URL;
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("ไม่พบบัญชี ADMIN ในฐานข้อมูล");

  console.log("กำลังนำเข้าจาก:", url);
  const t0 = Date.now();
  const r = await runGvizIncrementalImport({
    sheetUrl: url,
    fileName: "Local Import",
    source: "URL",
    importedById: admin.id,
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  if (r.rowCount === 0) {
    console.log(`✅ ข้อมูลเป็นปัจจุบันแล้ว (ไม่มีวันใหม่)  [${secs}s]`);
  } else {
    console.log(
      `✅ นำเข้า ${r.rowCount.toLocaleString()} แถว | วันใหม่: ${r.newDates.join(
        ", "
      )}  [${secs}s]`
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ ผิดพลาด:", e instanceof Error ? e.message : e);
  process.exit(1);
});
