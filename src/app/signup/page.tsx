import { AuthScreen } from "@/components/auth-screen";
import { GuestGuard } from "@/components/guest-guard";
import { MissingEnvScreen } from "@/components/missing-env-screen";
import { isPrivyClientConfigured } from "@/lib/privy-env";

export default function SignupPage() {
  if (!isPrivyClientConfigured()) {
    return <MissingEnvScreen />;
  }

  return (
    <GuestGuard>
      <AuthScreen mode="signup" />
    </GuestGuard>
  );
}
