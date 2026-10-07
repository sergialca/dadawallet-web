"use client";

import { useCallback, useEffect, useState } from "react";

import { useSolanaWallet } from "@/hooks/use-solana-wallet";
import {
  addFavoriteStock,
  isFavoriteStock,
  removeFavoriteStock,
} from "@/lib/favorite-stocks";
import { isSupabaseConfigured } from "@/lib/supabase-env";

export function useFavoriteStock(ticker: string) {
  const { address, isLoading: walletLoading } = useSolanaWallet();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorite() {
      if (!address) {
        setIsFavorite(false);
        setError(null);
        setIsLoading(walletLoading);
        return;
      }

      if (!isSupabaseConfigured()) {
        setIsFavorite(false);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const favorite = await isFavoriteStock(address, ticker);
        if (!cancelled) {
          setIsFavorite(favorite);
        }
      } catch (caught) {
        if (!cancelled) {
          setIsFavorite(false);
          setError(caught instanceof Error ? caught : new Error("Could not load favorite."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorite();

    return () => {
      cancelled = true;
    };
  }, [address, ticker, walletLoading]);

  const toggleFavorite = useCallback(async () => {
    if (!address || isSaving || isLoading) {
      return;
    }

    const nextFavorite = !isFavorite;
    setIsSaving(true);
    setIsFavorite(nextFavorite);
    setError(null);

    try {
      if (nextFavorite) {
        await addFavoriteStock(address, ticker);
      } else {
        await removeFavoriteStock(address, ticker);
      }
    } catch (caught) {
      setIsFavorite(!nextFavorite);
      setError(caught instanceof Error ? caught : new Error("Could not update favorite."));
    } finally {
      setIsSaving(false);
    }
  }, [address, isFavorite, isLoading, isSaving, ticker]);

  return {
    canToggle: Boolean(address) && !isLoading && !isSaving,
    error,
    isFavorite,
    isLoading: isLoading || walletLoading,
    isSaving,
    toggleFavorite,
  };
}
