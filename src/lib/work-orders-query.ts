import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 50;

export type WorkOrdersFilters = {
  search?: string;
  plant?: string;
  team?: string;
  priority?: string;
  status?: string;
  overdue?: string;
  supervisor?: string;
  page?: number;
};

function buildWhere(f: WorkOrdersFilters): Prisma.WorkOrderWhereInput {
  const where: Prisma.WorkOrderWhereInput = {};

  if (f.plant) where.plant = f.plant;
  if (f.team) where.team = f.team;
  if (f.supervisor) where.supervisor = f.supervisor;
  if (f.status) where.status = f.status;
  if (f.overdue) where.overdue = f.overdue;

  if (f.priority) {
    where.priority = f.priority === "3+" ? { in: ["3", "4"] } : f.priority;
  }

  if (f.search) {
    const q = f.search.trim();
    if (q) {
      where.OR = [
        { wo: { contains: q, mode: "insensitive" } },
        { desc: { contains: q, mode: "insensitive" } },
        { asset: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { team: { contains: q, mode: "insensitive" } },
        { supervisor: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  return where;
}

export async function getWorkOrdersPage(filters: WorkOrdersFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      orderBy: { targetStart: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { update: { select: { status: true, progress: true, remark: true, updatedAt: true } } },
    }),
    prisma.workOrder.count({ where }),
  ]);

  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

async function distinctValues(
  field: "plant" | "team" | "supervisor" | "status" | "overdue"
): Promise<string[]> {
  const rows: Array<{ value: string | null }> = await prisma.$queryRaw(
    Prisma.sql([
      `SELECT DISTINCT "${field}" AS value FROM work_orders WHERE "${field}" IS NOT NULL AND "${field}" <> '' ORDER BY "${field}" ASC`,
    ])
  );
  return rows.map((r) => r.value).filter((v): v is string => !!v);
}

export async function getWorkOrdersFilterOptions() {
  const [plants, teams, supervisors, statuses, overdues] = await Promise.all([
    distinctValues("plant"),
    distinctValues("team"),
    distinctValues("supervisor"),
    distinctValues("status"),
    distinctValues("overdue"),
  ]);
  return { plants, teams, supervisors, statuses, overdues };
}
