import { MissingEnvScreen } from "@/components/missing-env-screen";
import { RefreshClient } from "@/components/refresh-client";
import { isPrivyClientConfigured } from "@/lib/privy-env";

export default function RefreshPage() {
  if (!isPrivyClientConfigured()) {
    return <MissingEnvScreen />;
  }

  return <RefreshClient />;
}
