"use client";

import { PrivyProvider } from "@privy-io/react-auth";

import { getPrivyAppId, getPrivyClientId } from "@/lib/privy-env";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const appId = getPrivyAppId();
  const clientId = getPrivyClientId();

  if (!appId) {
    return <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId || undefined}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00e7fe" as `#${string}`,
          walletChainType: "solana-only",
        },
        loginMethods: ["email"],
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>
    </PrivyProvider>
  );
}
