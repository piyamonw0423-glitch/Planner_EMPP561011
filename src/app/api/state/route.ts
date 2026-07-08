import { getDraftState } from "@/lib/draft-state";

export const dynamic = "force-dynamic";

// Returns the full shared dashboard state as JSON (same shape as the
// server-injected window.__MT_SEED__), for client-side refresh.
export async function GET(request: Request) {
  // Public read-only state (same as the dashboard). `?date=YYYY-MM-DD` selects
  // a Data_Date snapshot; omitted = latest.
  const requestedDate = new URL(request.url).searchParams.get("date") ?? undefined;
  const state = await getDraftState(requestedDate);
  return Response.json(state, { headers: { "cache-control": "no-store" } });
}
