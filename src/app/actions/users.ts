"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import type { Role } from "@/generated/prisma/enums";

export async function createUser(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
}) {
  await requireRole("ADMIN");

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name || input.password.length < 8) {
    return { error: "กรุณากรอกอีเมล ชื่อ และรหัสผ่านอย่างน้อย 8 ตัวอักษร" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้มีผู้ใช้งานอยู่แล้ว" };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.create({
    data: { email, name, role: input.role, passwordHash },
  });

  revalidatePath("/dashboard/settings/users");
  return { ok: true };
}

export async function updateUserRole(input: { id: string; role: Role }) {
  const me = await requireRole("ADMIN");
  if (me.id === input.id) {
    return { error: "ไม่สามารถเปลี่ยน role ของบัญชีตัวเองได้" };
  }
  await prisma.user.update({ where: { id: input.id }, data: { role: input.role } });
  revalidatePath("/dashboard/settings/users");
  return { ok: true };
}

export async function setUserActive(input: { id: string; isActive: boolean }) {
  const me = await requireRole("ADMIN");
  if (me.id === input.id) {
    return { error: "ไม่สามารถปิดการใช้งานบัญชีตัวเองได้" };
  }
  await prisma.user.update({
    where: { id: input.id },
    data: { isActive: input.isActive },
  });
  revalidatePath("/dashboard/settings/users");
  return { ok: true };
}
