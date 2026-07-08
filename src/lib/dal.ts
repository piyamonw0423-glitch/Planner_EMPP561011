import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";

export const getSession = cache(async () => {
  return auth();
});

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user;
}

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  PLANNER: 1,
  ADMIN: 2,
};

export async function requireRole(minRole: Role) {
  const user = await requireUser();
  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    redirect("/dashboard?error=forbidden");
  }
  return user;
}
