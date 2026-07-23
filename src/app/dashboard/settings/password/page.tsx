import { requireUser } from "@/lib/dal";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const me = await requireUser();

  return (
    <div className="content-main">
      <ChangePasswordForm email={me.email} />
    </div>
  );
}
