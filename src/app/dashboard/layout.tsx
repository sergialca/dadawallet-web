import { AuthGuard } from "@/components/auth-guard";
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

  return <AuthGuard>{children}</AuthGuard>;
}
