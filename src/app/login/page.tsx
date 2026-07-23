import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/tower";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--sidebar)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: 360,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 16,
          padding: "28px 26px",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            ⚙️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              Maintenance Operating System
            </div>
            <div style={{ fontSize: 11, color: "var(--text-soft)" }}>
              Dashboard
            </div>
          </div>
        </div>

        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
