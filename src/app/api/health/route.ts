// Lightweight liveness probe. No DB, no auth — just enough to wake the Render
// free-tier instance from spin-down so the first real visitor isn't kept
// waiting ~20-50s. Pinged on a schedule by .github/workflows/keep-warm.yml.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, ts: new Date().toISOString() });
}
