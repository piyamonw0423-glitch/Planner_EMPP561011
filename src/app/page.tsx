import { redirect } from "next/navigation";

// The public dashboard is the home page. Admins still reach the management
// UI at /dashboard (user management, etc.) after logging in.
export default function Home() {
  redirect("/tower");
}
