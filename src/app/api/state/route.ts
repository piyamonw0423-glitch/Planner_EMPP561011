import { auth } from "@/auth";
import { getDraftState } from "@/lib/draft-state";

export const dynamic = "force-dynamic";

// Dashboard state JSON (same shape as the injected window.__MT_SEED__), for
// client-side refresh. Locked site: requires a signed-in user.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requestedDate = new URL(request.url).searchParams.get("date") ?? undefined;
  const state = await getDraftState(requestedDate);
  return Response.json(state, { headers: { "cache-control": "no-store" } });
}
