"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import type { Role } from "@/generated/prisma/enums";

type NavLink = {
  href: string;
  label: string;
  icon: string;
  minRole?: Role;
};

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/work-orders", label: "Work Orders", icon: "🗂️" },
  {
    href: "/dashboard/settings/import",
    label: "Import Data",
    icon: "⬆️",
    minRole: "PLANNER",
  },
  {
    href: "/dashboard/settings/users",
    label: "Users",
    icon: "👤",
    minRole: "ADMIN",
  },
];

const ROLE_RANK: Record<Role, number> = { VIEWER: 0, PLANNER: 1, ADMIN: 2 };
const ROLE_LABEL: Record<Role, string> = {
  VIEWER: "Viewer",
  PLANNER: "Planner",
  ADMIN: "Admin",
};

export function AppShell({
  user,
  children,
}: {
  user: { name: string; role: Role };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = NAV_LINKS.filter(
    (l) => !l.minRole || ROLE_RANK[user.role] >= ROLE_RANK[l.minRole]
  );

  return (
    <div className="app">
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-logo">
          <div className="ico">⚙️</div>
          <div>
            <div className="txt">Maintenance Tracking</div>
            <div className="sub">Dashboard</div>
          </div>
        </div>
        <nav className="nav-section">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item${pathname === link.href ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="ic">{link.icon}</span> {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ marginTop: "auto" }}>
          <b>Maintenance Dashboard</b>
          v0.1 — MVP
        </div>
      </aside>
      <div
        className={`sb-overlay${open ? " show" : ""}`}
        onClick={() => setOpen(false)}
      />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div className="page-title">Maintenance Tracking</div>
          </div>
          <div className="topbar-right">
            <div className="user-chip">
              <div className="avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="name">{user.name}</div>
                <div className="role">{ROLE_LABEL[user.role]}</div>
              </div>
            </div>
            <form action={logout}>
              <button type="submit" className="topbtn">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
