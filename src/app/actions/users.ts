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

// Admin sets a NEW password for a user who forgot theirs. Passwords are stored
// as one-way bcrypt hashes, so the old one can never be read back — resetting
// is the correct (and only) way to help a user who is locked out.
export async function resetUserPassword(input: { id: string; password: string }) {
  await requireRole("ADMIN");

  if (!input.password || input.password.length < 8) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  const user = await prisma.user.findUnique({
    where: { id: input.id },
    select: { id: true, email: true },
  });
  if (!user) return { error: "ไม่พบผู้ใช้รายนี้" };

  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.update({ where: { id: input.id }, data: { passwordHash } });

  revalidatePath("/dashboard/settings/users");
  return { ok: true, email: user.email };
}

// A signed-in user changes their own password (must confirm the current one).
export async function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const me = await requireRole("VIEWER"); // any signed-in role

  if (!input.newPassword || input.newPassword.length < 8) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "ไม่พบบัญชีผู้ใช้" };

  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!ok) return { error: "รหัสผ่านเดิมไม่ถูกต้อง" };

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash } });
  return { ok: true };
}
