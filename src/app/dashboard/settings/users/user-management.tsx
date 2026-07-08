"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/generated/prisma/enums";
import { createUser, updateUserRole, setUserActive } from "@/app/actions/users";

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
          {user.isActive ? "Active" : "Deactivated"}
        </span>
      </td>
      <td>{new Date(user.createdAt).toLocaleDateString("th-TH")}</td>
      <td>
        <button
          className="topbtn"
          disabled={isSelf || busy}
          onClick={toggleActive}
        >
          {user.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
        </button>
      </td>
    </tr>
  );
}
