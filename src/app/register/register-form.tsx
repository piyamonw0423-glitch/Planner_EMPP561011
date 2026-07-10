"use client";

import Link from "next/link";
import { useState } from "react";
import { registerUser } from "@/app/actions/auth";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setBusy(true);
    const res = await registerUser({ email, name, password });
    setBusy(false);
    if (res.error) setError(res.error);
    else setDone(true);
  }

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🕓</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          สมัครสำเร็จ — รอผู้ดูแลอนุมัติ
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.6 }}>
          บัญชี <b>{email}</b> ถูกสร้างแล้ว แต่ยังเข้าใช้งานไม่ได้จนกว่าผู้ดูแลระบบ
          จะอนุมัติ เมื่อได้รับอนุมัติแล้วจึงเข้าสู่ระบบได้
        </p>
        <Link
          href="/login"
          className="wo-btn"
          style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ width: "100%" }}>
      <label htmlFor="name" style={{ fontSize: 12.5, fontWeight: 600 }}>
        ชื่อ-นามสกุล
      </label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อของคุณ"
        required
        autoFocus
      />

      <div style={{ marginTop: 14 }}>
        <label htmlFor="email" style={{ fontSize: 12.5, fontWeight: 600 }}>
          อีเมล
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <label htmlFor="password" style={{ fontSize: 12.5, fontWeight: 600 }}>
          รหัสผ่าน (อย่างน้อย 8 ตัว)
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="ตั้งรหัสผ่าน..."
          required
          minLength={8}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <label htmlFor="confirm" style={{ fontSize: 12.5, fontWeight: 600 }}>
          ยืนยันรหัสผ่าน
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="กรอกรหัสผ่านอีกครั้ง..."
          required
        />
      </div>

      {error && (
        <p style={{ color: "var(--red)", fontSize: 12, marginTop: 10, fontWeight: 600 }}>
          {error}
        </p>
      )}

      <button type="submit" className="wo-btn" disabled={busy}>
        {busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </button>

      <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 14, textAlign: "center" }}>
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
