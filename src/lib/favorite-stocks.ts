"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const FavoriteStocksTable = "favorite_stocks";
const UniqueWalletTickerCode = "23505";

export function normalizeFavoriteTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

export async function listFavoriteTickers(walletAddress: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from(FavoriteStocksTable)
    .select("ticker")
    .eq("wallet_address", walletAddress)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeFavoriteTicker(String(row.ticker ?? "")));
}

export async function isFavoriteStock(walletAddress: string, ticker: string) {
  const normalizedTicker = normalizeFavoriteTicker(ticker);
  const { data, error } = await getSupabaseBrowserClient()
    .from(FavoriteStocksTable)
    .select("id")
    .eq("wallet_address", walletAddress)
    .eq("ticker", normalizedTicker)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}

export async function addFavoriteStock(walletAddress: string, ticker: string) {
  const { error } = await getSupabaseBrowserClient().from(FavoriteStocksTable).insert({
    ticker: normalizeFavoriteTicker(ticker),
    wallet_address: walletAddress,
  });

  if (error && error.code !== UniqueWalletTickerCode) {
    throw new Error(error.message);
  }
}

export async function removeFavoriteStock(walletAddress: string, ticker: string) {
  const { error } = await getSupabaseBrowserClient()
    .from(FavoriteStocksTable)
    .delete()
    .eq("wallet_address", walletAddress)
    .eq("ticker", normalizeFavoriteTicker(ticker));

  if (error) {
    throw new Error(error.message);
  }
}
