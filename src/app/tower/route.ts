import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { getDraftState } from "@/lib/draft-state";

export const dynamic = "force-dynamic";

// The prototype HTML is bundled inside the app so it deploys with the repo.
// Edit prototype/dashboard.html for future changes. Override the location with
// PROTOTYPE_HTML_PATH if needed (e.g. local dev against the report copy).
function prototypePath(): string {
  return (
    process.env.PROTOTYPE_HTML_PATH ||
    path.join(process.cwd(), "prototype", "dashboard.html")
  );
}

// Safe JSON for inline <script> embedding: escape < > and U+2028/U+2029 so the
// payload can't break out of the script tag or produce invalid JS literals.
function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(
    /[<>\u2028\u2029]/g,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")
  );
}

// Signed-in bar: shows the user + logout, plus a "manage users" link for admins
// (where they approve pending registrations and set roles).
function loginBar(user: { name: string; role: string }): string {
  const box =
    "position:fixed;top:10px;right:14px;z-index:100000;display:flex;align-items:center;gap:8px;" +
    "font-family:'Sarabun',sans-serif;font-size:12px;";
  const adminLink =
    user.role === "ADMIN"
      ? `<a href="/dashboard/settings/users" style="background:#e0e7ff;color:#3730a3;padding:4px 12px;border-radius:20px;font-weight:700;text-decoration:none;">👥 จัดการผู้ใช้</a>`
      : "";
  return (
    `<div style="${box}">` +
    `<span style="background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:20px;font-weight:700;">👤 ${user.name} · ${user.role}</span>` +
    adminLink +
    `<a href="/logout" style="background:#fee2e2;color:#b91c1c;padding:4px 12px;border-radius:20px;font-weight:700;text-decoration:none;">ออกจากระบบ</a>` +
    `</div>`
  );
}

export async function GET(request: Request) {
  const session = await auth();
  // Locked site: must be signed in (and an admin must have approved the account —
  // inactive users are already rejected at login). Anonymous → login page.
  if (!session?.user) {
    return Response.redirect(new URL("/login?callbackUrl=/tower", request.url), 302);
  }
  const user = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
  // Only Planner/Admin may edit; Viewers can view only.
  const canEdit = user.role === "PLANNER" || user.role === "ADMIN";

  let html: string;
  try {
    html = await readFile(prototypePath(), "utf8");
  } catch {
    return new Response(
      `Prototype HTML not found at ${prototypePath()}. Set PROTOTYPE_HTML_PATH.`,
      { status: 500 }
    );
  }

  const requestedDate = new URL(request.url).searchParams.get("date") ?? undefined;
  const state = await getDraftState(requestedDate);

  // __MT_USER__ = the signed-in user. __MT_CANEDIT__ gates in-page edit controls
  // by role; writes are also enforced by the API.
  const inject =
    `<script>window.__MT_USER__=${safeJson(user)};` +
    `window.__MT_CANEDIT__=${canEdit ? "true" : "false"};` +
    `window.__MT_SEED__=${safeJson(state)};</script>`;

  const bar = loginBar(user);

  // Insert the seed BEFORE the main script runs (loadAll reads it at boot),
  // and the login/logout bar at the top of the body.
  let out = html.includes("</head>")
    ? html.replace("</head>", `${inject}</head>`)
    : inject + html;
  out = out.includes("<body")
    ? out.replace(/(<body[^>]*>)/, `$1${bar}`)
    : bar + out;

  return new Response(out, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
