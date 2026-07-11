import { auth } from "@/auth";
import { parseWorkbookBuffer, googleSheetUrlToCsv } from "@/lib/import/parse";
import {
  runImport,
  runIncrementalCsvImport,
  runGvizIncrementalImport,
} from "@/lib/import/run-import";

export const maxDuration = 300;

const ROLE_RANK = { VIEWER: 0, PLANNER: 1, ADMIN: 2 } as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return Response.json(
      { error: "เฉพาะ Admin เท่านั้นที่นำเข้า/รีเฟรชข้อมูลได้" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const url = formData.get("url");

  try {
    if (file instanceof File) {
      const buffer = await file.arrayBuffer();
      const rows = parseWorkbookBuffer(buffer);
      if (rows.length === 0) {
        return Response.json(
          {
            error:
              "ไม่พบข้อมูล หรือหัวคอลัมน์ไม่ตรง (ต้องมีคอลัมน์ Work Order, Description, Status, Team)",
          },
          { status: 400 }
        );
      }
      const batch = await runImport({
        rows,
        fileName: file.name,
        source: "UPLOAD",
        importedById: session.user.id,
      });
      return Response.json({ ok: true, rowCount: batch.rowCount, batchId: batch.id });
    }

    if (typeof url === "string" && url.trim()) {
      // Preferred path: gviz query — download only the NEW Data_Dates, so it
      // scales no matter how large the sheet gets. Fall back to streaming the
      // whole CSV if gviz isn't available for this sheet.
      let result: { id: string | null; rowCount: number; newDates: string[] };
      try {
        result = await runGvizIncrementalImport({
          sheetUrl: url,
          fileName: "URL Import",
          source: "URL",
          importedById: session.user.id,
        });
      } catch (gvizErr) {
        console.warn("gviz import failed, falling back to full CSV:", gvizErr);
        const resp = await fetch(googleSheetUrlToCsv(url));
        if (!resp.ok) {
          return Response.json(
            { error: `โหลด URL ไม่สำเร็จ: HTTP ${resp.status}` },
            { status: 400 }
          );
        }
        result = await runIncrementalCsvImport({
          csv: await resp.text(),
          fileName: "URL Import",
          source: "URL",
          importedById: session.user.id,
        });
      }
      return Response.json({
        ok: true,
        rowCount: result.rowCount,
        newDates: result.newDates,
        batchId: result.id,
      });
    }

    return Response.json(
      { error: "กรุณาแนบไฟล์หรือระบุ URL" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Import error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
