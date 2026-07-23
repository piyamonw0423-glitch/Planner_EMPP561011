"use client";

import { useState } from "react";
import { changeMyPassword } from "@/app/actions/users";

export function ChangePasswordForm({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
    null
  );

  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const canSubmit =
    !busy && currentPassword.length > 0 && newPassword.length >= 8 && confirm === newPassword;

  async function submit() {
    setBusy(true);
    setMessage(null);
    const res = await changeMyPassword({ currentPassword, newPassword });
    setBusy(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "ok", text: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <div className="card-title">
        <span className="card-icon">🔑</span> เปลี่ยนรหัสผ่านของฉัน
      </div>

      <p style={{ fontSize: 12, color: "var(--text-soft)", marginBottom: 12 }}>
        บัญชี: <b>{email}</b>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label htmlFor="cur" style={{ fontSize: 11.5, fontWeight: 600 }}>
            รหัสผ่านเดิม
          </label>
          <input
            id="cur"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div>
          <label htmlFor="new" style={{ fontSize: 11.5, fontWeight: 600 }}>
            รหัสผ่านใหม่
          </label>
          <input
            id="new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            autoComplete="new-password"
          />
          {tooShort && (
            <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
              ต้องมีอย่างน้อย 8 ตัวอักษร
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirm" style={{ fontSize: 11.5, fontWeight: 600 }}>
            ยืนยันรหัสผ่านใหม่
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && (
            <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
              รหัสผ่านใหม่ไม่ตรงกัน
            </div>
          )}
        </div>

        <button className="topbtn primary" disabled={!canSubmit} onClick={submit}>
          {busy ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
      </div>

      {message && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12.5,
            fontWeight: 600,
            color: message.type === "ok" ? "var(--green)" : "var(--red)",
          }}
        >
          {message.type === "ok" ? "✅ " : "❌ "}
          {message.text}
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 14, lineHeight: 1.5 }}>
        💡 ระบบเก็บรหัสผ่านแบบเข้ารหัสทางเดียว (bcrypt) — ไม่มีใครดูรหัสของคุณได้
        แม้แต่ผู้ดูแลระบบ หากลืมรหัส ให้แจ้งผู้ดูแลตั้งรหัสใหม่ให้
      </p>
    </div>
  );
}
