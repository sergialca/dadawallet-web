"use client";

import { useCallback, useEffect, useState } from "react";

import { SolanaUsdcDecimals, SolanaUsdcMint } from "@/constants/tokens";
import { useSolanaWallet } from "@/hooks/use-solana-wallet";
import { getSplTokenBalance } from "@/lib/solana-rpc";

function toUiAmount(raw: bigint, decimals: number) {
  const negative = raw < BigInt(0);
  const absolute = negative ? -raw : raw;
  const padded = absolute.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const fraction = padded.slice(padded.length - decimals);
  const amount = Number(`${whole}.${fraction}`);
  return negative ? -amount : amount;
}

export function useUsdcBalance() {
  const { address, error: walletError, isLoading: walletLoading } = useSolanaWallet();
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!address) {
      setBalance(0);
      setError(walletError);
      setIsLoading(walletLoading);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getSplTokenBalance(address, SolanaUsdcMint);
      setBalance(toUiAmount(token.raw, token.decimals || SolanaUsdcDecimals));
    } catch (caught) {
      setBalance(0);
      setError(caught instanceof Error ? caught : new Error("Could not load USDC balance."));
    } finally {
      setIsLoading(false);
    }
  }, [address, walletError, walletLoading]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, error, isLoading, refresh };
}
