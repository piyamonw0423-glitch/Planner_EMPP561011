"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

// Public self-registration. Creates a PENDING account (isActive=false) with the
// lowest role (VIEWER). An admin must approve it (activate + set role) in
// Settings → Users before the person can sign in — the login check already
// rejects inactive users.
export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ ok?: true; error?: string }> {
  const email = (input.email || "").trim().toLowerCase();
  const name = (input.name || "").trim();
  const password = input.password || "";
  if (!email || !name || password.length < 8) {
    return { error: "กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร" };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้มีผู้ใช้งานอยู่แล้ว" };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, name, passwordHash, role: "VIEWER", isActive: false },
  });
  return { ok: true };
}

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: (formData.get("callbackUrl") as string) || "/tower",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "เข้าสู่ระบบไม่สำเร็จ — อีเมล/รหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่ได้รับการอนุมัติจากผู้ดูแล";
        default:
          return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
