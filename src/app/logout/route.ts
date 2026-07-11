import { signOut } from "@/auth";

export const dynamic = "force-dynamic";

// Sign out and return to the dashboard. Relative Location so it resolves to the
// real host (behind Render's proxy request.url is an internal localhost address).
export async function GET() {
  await signOut({ redirect: false });
  return new Response(null, { status: 302, headers: { Location: "/tower" } });
}
