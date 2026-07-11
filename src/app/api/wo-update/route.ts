import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { draftKeyToEnum } from "@/lib/draft-state";
import { statusLabel } from "@/lib/status-options";

const ROLE_RANK = { VIEWER: 0, PLANNER: 1, ADMIN: 2 } as const;

// Persist a single Work Order status update coming from the prototype UI.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ROLE_RANK[session.user.role] < ROLE_RANK.PLANNER) {
    return Response.json({ error: "ต้องมีสิทธิ์ Planner ขึ้นไป" }, { status: 403 });
  }

  let body: {
    wo?: string;
    statusKey?: string;
    progress?: number;
    remark?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const wo = (body.wo || "").trim();
  if (!wo) return Response.json({ error: "missing wo" }, { status: 400 });

  const status = draftKeyToEnum(body.statusKey || "");
  if (!status) {
    return Response.json(
      { error: `unknown status: ${body.statusKey}` },
      { status: 400 }
    );
  }

  const progress = Math.max(0, Math.min(100, Math.round(Number(body.progress)) || 0));
  const remark = (body.remark || "").trim() || null;

  // Guard: the WorkOrderUpdate FK requires the WorkOrder to exist.
  const existing = await prisma.workOrder.findUnique({
    where: { wo },
    select: { wo: true, status: true },
  });
  if (!existing) {
    return Response.json({ error: `ไม่พบ Work Order: ${wo}` }, { status: 404 });
  }
  // Only Admin may edit a Closed WO; everyone else is limited to non-closed WOs.
  const CLOSED = new Set(["CLOSE", "FORCED_CLOSE", "CAN"]);
  if (
    session.user.role !== "ADMIN" &&
    CLOSED.has((existing.status || "").trim().toUpperCase())
  ) {
    return Response.json(
      { error: "WO นี้ปิดงานแล้ว (Closed) — แก้ไขไม่ได้" },
      { status: 403 }
    );
  }

  await prisma.workOrderUpdate.upsert({
    where: { woId: wo },
    update: { status, progress, remark, updatedById: session.user.id },
    create: { woId: wo, status, progress, remark, updatedById: session.user.id },
  });

  await prisma.activityLog.create({
    data: {
      woId: wo,
      userId: session.user.id,
      action: "STATUS_UPDATE",
      detail: { status, label: statusLabel(status), progress },
    },
  });

  return Response.json({ ok: true });
}
