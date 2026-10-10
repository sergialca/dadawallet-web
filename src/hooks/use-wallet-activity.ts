"use client";

import { useEffect, useState } from "react";

import { useSolanaWallet } from "@/hooks/use-solana-wallet";
import type { WalletActivityResult } from "@/lib/solana-activity";

type ActivityState =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: WalletActivityResult }
  | { status: "error"; message: string };

export function useWalletActivity() {
  const { address, error: walletError, isLoading: walletLoading } = useSolanaWallet();
  const [state, setState] = useState<ActivityState>({ status: "idle" });

  useEffect(() => {
    if (address || walletLoading) {
      return;
    }

    setState({
      status: "error",
      message: walletError?.message ?? "No Solana wallet on this account",
    });
  }, [address, walletError, walletLoading]);

  useEffect(() => {
    if (!address) {
      return;
    }

    const walletAddress = address;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      try {
        const response = await fetch(`/api/activity?address=${encodeURIComponent(walletAddress)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as WalletActivityResult & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load activity");
        }

        if (!cancelled) {
          setState({ status: "ready", data: payload });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          status: "error",
          message:
            controller.signal.aborted
              ? "Activity request timed out"
              : error instanceof Error
                ? error.message
                : "Failed to load activity",
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [address]);

  return { address, ...state };
}
