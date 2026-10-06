import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/dashboard/app-shell";
import { MissingEnvScreen } from "@/components/missing-env-screen";
import { isPrivyClientConfigured } from "@/lib/privy-env";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isPrivyClientConfigured()) {
    return <MissingEnvScreen />;
  }

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
