"use client";

import { useCreateWallet, useWallets } from "@privy-io/react-auth/solana";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";

import { getWalletAddress } from "@/lib/wallet-address";

export function useSolanaWallet() {
  const { authenticated, ready: privyReady, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { ready: walletsReady, wallets } = useWallets();
  const [error, setError] = useState<Error | null>(null);
  const createAttemptedForUser = useRef<string | null>(null);

  const userId = user?.id ?? null;
  const address = wallets[0]?.address ?? getWalletAddress(user);
  const ready = privyReady && walletsReady;

  useEffect(() => {
    if (!ready || !authenticated || !userId || address) {
      return;
    }

    if (createAttemptedForUser.current === userId) {
      return;
    }

    createAttemptedForUser.current = userId;
    setError(null);

    void createWallet().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught : new Error("Could not create a Solana wallet."));
    });
  }, [address, authenticated, createWallet, ready, userId]);

  return {
    address,
    error: address ? null : error,
    isLoading: !ready || (authenticated && !address && !error),
  };
}
