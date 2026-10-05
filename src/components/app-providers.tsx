"use client";

import { PrivyProvider } from "@privy-io/react-auth";

import { getPrivyAppId, getPrivyClientId } from "@/lib/privy-env";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const appId = getPrivyAppId();
  const clientId = getPrivyClientId();

  if (!appId) {
    return <>{children}</>;
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
      {children}
    </PrivyProvider>
  );
}
