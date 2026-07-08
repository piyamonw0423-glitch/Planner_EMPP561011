import { signOut } from "@/auth";

export const dynamic = "force-dynamic";

// Sign the admin out and return to the public dashboard (same origin).
export async function GET(request: Request) {
  await signOut({ redirect: false });
  return Response.redirect(new URL("/tower", request.url), 302);
}
