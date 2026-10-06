"use client";

import { useEffect, useState } from "react";

import { useSolanaWallet } from "@/hooks/use-solana-wallet";
import type { WalletHoldingsResult } from "@/lib/solana-holdings";

type HoldingsState =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: WalletHoldingsResult }
  | { status: "error"; message: string };

export function useWalletHoldings() {
  const { address, error: walletError, isLoading: walletLoading } = useSolanaWallet();
  const [state, setState] = useState<HoldingsState>({ status: "idle" });

  useEffect(() => {
    if (walletLoading) {
      setState({ status: "loading" });
      return;
    }

    if (!address) {
      setState({
        status: "error",
        message: walletError?.message ?? "No Solana wallet on this account",
      });
      return;
    }

    const walletAddress = address;
    const controller = new AbortController();

    async function load() {
      setState({ status: "loading" });

      try {
        const response = await fetch(`/api/holdings?address=${encodeURIComponent(walletAddress)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as WalletHoldingsResult & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load holdings");
        }

        setState({ status: "ready", data: payload });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to load holdings",
        });
      }
    }

    void load();

    return () => controller.abort();
  }, [address, walletError, walletLoading]);

  return { address, ...state };
}
