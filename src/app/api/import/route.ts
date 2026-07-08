import { auth } from "@/auth";
import {
  parseWorkbookBuffer,
  parseCsvText,
  googleSheetUrlToCsv,
} from "@/lib/import/parse";
import { runImport } from "@/lib/import/run-import";

export const maxDuration = 300;

const ROLE_RANK = { VIEWER: 0, PLANNER: 1, ADMIN: 2 } as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ROLE_RANK[session.user.role] < ROLE_RANK.PLANNER) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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
      const csvUrl = googleSheetUrlToCsv(url);
      const resp = await fetch(csvUrl);
      if (!resp.ok) {
        return Response.json(
          { error: `โหลด URL ไม่สำเร็จ: HTTP ${resp.status}` },
          { status: 400 }
        );
      }
      const text = await resp.text();
      const rows = parseCsvText(text);
      if (rows.length === 0) {
        return Response.json(
          { error: "ไม่พบข้อมูล หรือหัวคอลัมน์ไม่ตรง" },
          { status: 400 }
        );
      }
      const batch = await runImport({
        rows,
        fileName: "URL Import",
        source: "URL",
        importedById: session.user.id,
      });
      return Response.json({ ok: true, rowCount: batch.rowCount, batchId: batch.id });
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
