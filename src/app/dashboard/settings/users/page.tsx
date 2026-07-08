import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { UserManagement } from "./user-management";

export default async function UsersPage() {
  const me = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <div className="content-main">
      <UserManagement users={users} currentUserId={me.id} />
    </div>
  );
}
