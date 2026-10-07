"use client";

import { useEffect, useMemo, useState } from "react";

import { useSolanaWallet } from "@/hooks/use-solana-wallet";
import { listFavoriteTickers } from "@/lib/favorite-stocks";
import { isSupabaseConfigured } from "@/lib/supabase-env";

export function useFavoriteTickers() {
  const { address, isLoading: walletLoading } = useSolanaWallet();
  const [tickers, setTickers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!address) {
        setTickers([]);
        setError(null);
        setIsLoading(walletLoading);
        return;
      }

      if (!isSupabaseConfigured()) {
        setTickers([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const favoriteTickers = await listFavoriteTickers(address);
        if (!cancelled) {
          setTickers(favoriteTickers);
        }
      } catch (caught) {
        if (!cancelled) {
          setTickers([]);
          setError(caught instanceof Error ? caught : new Error("Could not load favorites."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [address, walletLoading]);

  const tickerSet = useMemo(() => new Set(tickers), [tickers]);

  return {
    error,
    isLoading: isLoading || walletLoading,
    tickerSet,
    tickers,
  };
}
