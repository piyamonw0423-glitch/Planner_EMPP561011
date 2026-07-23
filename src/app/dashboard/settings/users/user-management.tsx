"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/generated/prisma/enums";
import {
  createUser,
  updateUserRole,
  setUserActive,
  resetUserPassword,
} from "@/app/actions/users";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
};

const ROLE_OPTIONS: Role[] = ["VIEWER", "PLANNER", "ADMIN"];

export function UserManagement({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CreateUserForm onCreated={() => router.refresh()} />

      <div className="card">
      <div className="card-title">
        <span className="card-icon">👥</span> รายชื่อผู้ใช้งาน
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อีเมล</th>
              <th>Role</th>
              <th>สถานะ</th>
              <th>สร้างเมื่อ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRowItem
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                onChanged={() => router.refresh()}
              />
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("VIEWER");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
    null
  );

  async function submit() {
    setBusy(true);
    setMessage(null);
    const res = await createUser({ email, name, role, password });
    setBusy(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "ok", text: `สร้างผู้ใช้ ${email} สำเร็จ` });
      setEmail("");
      setName("");
      setPassword("");
      setRole("VIEWER");
      onCreated();
    }
  }

  return (
    <div className="card">
      <div className="card-title">
        <span className="card-icon">➕</span> สร้างผู้ใช้ใหม่
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ minWidth: 180 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600 }}>อีเมล</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600 }}>ชื่อ</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600 }}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600 }}>รหัสผ่านเริ่มต้น</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 8 ตัวอักษร"
          />
        </div>
        <button
          className="topbtn primary"
          disabled={busy || !email || !name || !password}
          onClick={submit}
        >
          {busy ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
        </button>
      </div>
      {message && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12.5,
            fontWeight: 600,
            color: message.type === "ok" ? "var(--green)" : "var(--red)",
          }}
        >
          {message.type === "ok" ? "✅ " : "❌ "}
          {message.text}
        </div>
      )}
    </div>
  );
}

function UserRowItem({
  user,
  isSelf,
  onChanged,
}: {
  user: UserRow;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function changeRole(role: Role) {
    setBusy(true);
    await updateUserRole({ id: user.id, role });
    setBusy(false);
    onChanged();
  }

  async function toggleActive() {
    setBusy(true);
    await setUserActive({ id: user.id, isActive: !user.isActive });
    setBusy(false);
    onChanged();
  }

  // Set a NEW password for this user (the old one can never be read back).
  async function doReset() {
    setBusy(true);
    setPwMsg(null);
    const res = await resetUserPassword({ id: user.id, password: newPw });
    setBusy(false);
    if (res.error) {
      setPwMsg({ type: "error", text: res.error });
    } else {
      setPwMsg({
        type: "ok",
        text: `ตั้งรหัสใหม่ให้ ${user.email} แล้ว — แจ้งรหัสนี้กับผู้ใช้ และให้เขาเปลี่ยนเองภายหลัง`,
      });
      setNewPw("");
      setResetOpen(false);
    }
  }

  return (
    <tr>
      <td>
        {user.name} {isSelf && <span style={{ color: "var(--text-soft)" }}>(คุณ)</span>}
      </td>
      <td>{user.email}</td>
      <td>
        <select
          value={user.role}
          disabled={isSelf || busy}
          onChange={(e) => changeRole(e.target.value as Role)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td>
        <span className={`pill ${user.isActive ? "pill-completed" : "pill-high"}`}>
          {user.isActive ? "Active" : "🕓 รออนุมัติ"}
        </span>
      </td>
      <td>{new Date(user.createdAt).toLocaleDateString("th-TH")}</td>
      <td>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className={user.isActive ? "topbtn" : "topbtn primary"}
            disabled={isSelf || busy}
            onClick={toggleActive}
          >
            {user.isActive ? "ระงับการใช้งาน" : "✓ อนุมัติ"}
          </button>
          <button
            className="topbtn"
            disabled={busy}
            onClick={() => {
              setResetOpen((o) => !o);
              setPwMsg(null);
            }}
            title="ตั้งรหัสผ่านใหม่ให้ผู้ใช้รายนี้ (ใช้เมื่อผู้ใช้ลืมรหัส)"
          >
            🔑 ตั้งรหัสใหม่
          </button>
        </div>

        {resetOpen && (
          <div
            style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
          >
            <input
              type="text"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="รหัสใหม่ อย่างน้อย 8 ตัว"
              style={{ width: 170 }}
              autoComplete="off"
            />
            <button
              className="topbtn primary"
              disabled={busy || newPw.length < 8}
              onClick={doReset}
            >
              {busy ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              className="topbtn"
              disabled={busy}
              onClick={() => {
                setResetOpen(false);
                setNewPw("");
              }}
            >
              ยกเลิก
            </button>
          </div>
        )}

        {pwMsg && (
          <div
            style={{
              marginTop: 6,
              fontSize: 11.5,
              fontWeight: 600,
              maxWidth: 320,
              color: pwMsg.type === "ok" ? "var(--green)" : "var(--red)",
            }}
          >
            {pwMsg.type === "ok" ? "✅ " : "❌ "}
            {pwMsg.text}
          </div>
        )}
      </td>
    </tr>
  );
}
