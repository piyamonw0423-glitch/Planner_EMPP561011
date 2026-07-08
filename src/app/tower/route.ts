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

// Public read-only dashboard. Anyone can VIEW without logging in; only an
// authenticated Admin/Planner can update data (writes are gated server-side).
function loginBar(user: { name: string; role: string } | null): string {
  const box =
    "position:fixed;top:10px;right:14px;z-index:100000;display:flex;align-items:center;gap:8px;" +
    "font-family:'Sarabun',sans-serif;font-size:12px;";
  if (user) {
    return (
      `<div style="${box}">` +
      `<span style="background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:20px;font-weight:700;">👤 ${user.name} · ${user.role}</span>` +
      `<a href="/logout" style="background:#fee2e2;color:#b91c1c;padding:4px 12px;border-radius:20px;font-weight:700;text-decoration:none;">ออกจากระบบ</a>` +
      `</div>`
    );
  }
  return (
    `<div style="${box}">` +
    `<a href="/login?callbackUrl=/tower" style="background:#1e3a8a;color:#fff;padding:5px 14px;border-radius:20px;font-weight:700;text-decoration:none;box-shadow:0 4px 12px rgba(30,58,138,.35);">🔐 เข้าสู่ระบบ (Admin)</a>` +
    `</div>`
  );
}

export async function GET(request: Request) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;

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

  // __MT_USER__ = the signed-in admin (or null). __MT_CANEDIT__ gates the
  // in-page edit controls; writes are also enforced by the API.
  const inject =
    `<script>window.__MT_USER__=${safeJson(user)};` +
    `window.__MT_CANEDIT__=${user ? "true" : "false"};` +
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
