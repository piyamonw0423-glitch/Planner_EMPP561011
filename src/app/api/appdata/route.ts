import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ROLE_RANK = { VIEWER: 0, PLANNER: 1, ADMIN: 2 } as const;

// Public read: all shared app-data blobs as { key: value }.
export async function GET() {
  const rows = await prisma.appData.findMany();
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  return Response.json(out, { headers: { "cache-control": "no-store" } });
}

// Admin write: upsert one blob. Body: { key: string, value: any }.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ROLE_RANK[session.user.role] < ROLE_RANK.PLANNER) {
    return Response.json({ error: "ต้องมีสิทธิ์ Planner ขึ้นไป" }, { status: 403 });
  }

  let body: { key?: string; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const key = (body.key || "").trim();
  if (!key) return Response.json({ error: "missing key" }, { status: 400 });

  const value = (body.value ?? null) as import("@/generated/prisma/client").Prisma.InputJsonValue;
  await prisma.appData.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return Response.json({ ok: true });
}
