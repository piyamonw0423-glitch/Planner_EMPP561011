"use client";

import Link from "next/link";
import { useActionState } from "react";
import { authenticate } from "@/app/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [errorMessage, formAction, pending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <form action={formAction} style={{ width: "100%" }}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <label htmlFor="email" style={{ fontSize: 12.5, fontWeight: 600 }}>
        อีเมล
      </label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="you@company.com"
        required
        autoFocus
      />

      <div style={{ marginTop: 14 }}>
        <label htmlFor="password" style={{ fontSize: 12.5, fontWeight: 600 }}>
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="กรอกรหัสผ่าน..."
          required
        />
      </div>

      {errorMessage && (
        <p
          style={{
            color: "var(--red)",
            fontSize: 12,
            marginTop: 10,
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </p>
      )}

      <button type="submit" className="wo-btn" disabled={pending}>
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 14, textAlign: "center" }}>
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  );
}
