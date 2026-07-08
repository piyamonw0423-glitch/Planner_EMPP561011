"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import type { WoStatus } from "@/generated/prisma/enums";
import { statusLabel } from "@/lib/status-options";

export async function updateWorkOrderStatus(input: {
  wo: string;
  status: WoStatus;
  progress: number;
  remark: string;
}) {
  const user = await requireRole("PLANNER");

  const progress = Math.max(0, Math.min(100, Math.round(input.progress) || 0));

  await prisma.workOrderUpdate.upsert({
    where: { woId: input.wo },
    update: {
      status: input.status,
      progress,
      remark: input.remark || null,
      updatedById: user.id,
    },
    create: {
      woId: input.wo,
      status: input.status,
      progress,
      remark: input.remark || null,
      updatedById: user.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      woId: input.wo,
      userId: user.id,
      action: "STATUS_UPDATE",
      detail: { status: input.status, label: statusLabel(input.status), progress },
    },
  });

  revalidatePath("/dashboard/work-orders");
  revalidatePath("/dashboard");

  return { ok: true };
}
