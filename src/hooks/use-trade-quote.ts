"use client";

import { useEffect, useState } from "react";

import { DefaultSlippagePercent, type OndoQuoteSide } from "@/constants/ondo";
import type { TradeQuote } from "@/lib/trade-quote";

const EMPTY_QUOTE: TradeQuote = {
  estimatedShares: 0,
  feeUsdc: 0,
  midPrice: null,
  minShares: 0,
  quotePrice: null,
  slippagePercent: DefaultSlippagePercent,
};

export function useTradeQuote(input: {
  mint?: string;
  notionalUsdc: number;
  side: OndoQuoteSide;
  symbol: string;
  ticker: string;
}) {
  const [quote, setQuote] = useState<TradeQuote>(EMPTY_QUOTE);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const mint = input.mint ?? "";
    if (!input.symbol && !input.ticker && !mint) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const query = new URLSearchParams({
            mint,
            notional: String(input.notionalUsdc),
            side: input.side,
            symbol: input.symbol,
            ticker: input.ticker,
          });
          const response = await fetch(`/api/trade-quote?${query.toString()}`, {
            signal: controller.signal,
          });
          const payload = (await response.json()) as TradeQuote & { error?: string };
          if (!response.ok) {
            throw new Error(payload.error ?? "Could not load a quote.");
          }
          setQuote(payload);
        } catch (caught) {
          if (controller.signal.aborted) {
            return;
          }
          setError(caught instanceof Error ? caught : new Error("Could not load a quote."));
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      })();
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [input.mint, input.notionalUsdc, input.side, input.symbol, input.ticker]);

  return { error, isLoading, quote };
}
