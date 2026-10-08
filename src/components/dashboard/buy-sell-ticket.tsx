"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MinimumOrderUsdc, type OndoQuoteSide } from "@/constants/ondo";
import { SolanaNetworkLabel } from "@/constants/tokens";
import { useFavoriteStock } from "@/hooks/use-favorite-stock";
import { useTradeQuote } from "@/hooks/use-trade-quote";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { formatAmount, parseAmount, sanitizePositiveDecimalInput } from "@/lib/format-amount";
import type { StockAsset } from "@/types/stocks";

function OrderCompletedDialog({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const ignoreCloseRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    dialog.showModal();

    return () => {
      ignoreCloseRef.current = true;
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      aria-labelledby="order-completed-title"
      className="fixed inset-0 z-50 m-0 max-h-none w-full max-w-none bg-transparent p-4 backdrop:bg-black/70 open:flex open:h-full open:items-center open:justify-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
      onClose={() => {
        if (ignoreCloseRef.current) {
          return;
        }

        onDismiss();
      }}
      ref={dialogRef}
    >
      <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-high p-5">
        <p className="text-sm font-semibold text-on-surface" id="order-completed-title">
          Order completed
        </p>
        <p className="data-sm mt-2 text-on-surface-variant">{message}</p>
        <button
          className="label-caps mt-4 w-full rounded-md bg-primary-container px-4 py-3 text-on-primary neon-bloom"
          onClick={onDismiss}
          type="button"
        >
          Done
        </button>
      </div>
    </dialog>
  );
}

function StockLogo({ stock }: { stock: StockAsset }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-container-lowest">
      {failed ? (
        <span className="text-xs font-semibold text-on-surface-variant">{stock.ticker.slice(0, 1)}</span>
      ) : (
        <img
          alt=""
          className="h-6 w-6 object-contain"
          onError={() => setFailed(true)}
          src={stock.logoUrl}
        />
      )}
    </span>
  );
}

function sideFromSearch(value: string | null): OndoQuoteSide {
  return value === "sell" ? "sell" : "buy";
}

export function BuySellTicket({ stock }: { stock: StockAsset }) {
  const searchParams = useSearchParams();
  const [side, setSide] = useState<OndoQuoteSide>(() => sideFromSearch(searchParams.get("side")));
  const [amountInput, setAmountInput] = useState(() =>
    sanitizePositiveDecimalInput(searchParams.get("amount") ?? ""),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);
  const hasCompletionRef = useRef(false);

  const notionalUsdc = parseAmount(amountInput);
  const { balance: usdcBalance, isLoading: usdcLoading, refresh: refreshBalance } = useUsdcBalance();
  const {
    canToggle: canToggleFavorite,
    error: favoriteError,
    isFavorite,
    toggleFavorite,
  } = useFavoriteStock(stock.ticker);
  const { error: quoteError, isLoading: quoteLoading, quote } = useTradeQuote({
    mint: stock.kind === "pre-IPO stock" ? stock.contractAddress : "",
    notionalUsdc,
    side,
    symbol: stock.kind === "stock" ? stock.tokenSymbol : "",
    ticker: stock.ticker,
  });

  const isBuy = side === "buy";
  const displayPrice = quote.quotePrice ?? quote.midPrice;
  const belowMinimum = notionalUsdc > 0 && notionalUsdc < MinimumOrderUsdc;
  const exceedsUsdc = isBuy && notionalUsdc > usdcBalance;
  const canSubmit =
    notionalUsdc >= MinimumOrderUsdc && !exceedsUsdc && !isSubmitting && isBuy;

  const availableLabel = useMemo(() => {
    if (isBuy) {
      return `Available: ${usdcLoading ? "…" : `${formatAmount(usdcBalance, 2)} USDC`}`;
    }
    return `Available: 0 ${stock.tokenSymbol}`;
  }, [isBuy, stock.tokenSymbol, usdcBalance, usdcLoading]);

  function dismissCompleted() {
    if (!hasCompletionRef.current) {
      return;
    }

    hasCompletionRef.current = false;
    setCompletedMessage(null);
    setAmountInput("");
    void refreshBalance();
  }

  async function onExecute() {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await refreshBalance();
      const message = isBuy
        ? `Purchase completed. Estimated ${formatAmount(quote.estimatedShares, 4)} ${stock.tokenSymbol}.`
        : `Sale completed. Estimated ${formatAmount(notionalUsdc, 2)} USDC.`;
      hasCompletionRef.current = true;
      setCompletedMessage(message);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Trade execution failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface neon-bloom"
          href="/dashboard/stocks"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
            <path
              d="M12.5 4.5 7 10l5.5 5.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
          <span className="sr-only">Back to stocks</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <StockLogo stock={stock} />
          <div className="min-w-0 text-center">
            <p className="truncate text-lg font-semibold tracking-tight text-on-surface">{stock.ticker}</p>
            <p className="data-sm truncate text-on-surface-variant">{stock.name}</p>
          </div>
        </div>

        <button
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container neon-bloom ${
            canToggleFavorite ? "" : "opacity-50"
          }`}
          disabled={!canToggleFavorite}
          onClick={() => {
            void toggleFavorite();
          }}
          type="button"
        >
          <span className={isFavorite ? "text-success" : "text-on-surface-variant"}>{isFavorite ? "★" : "☆"}</span>
        </button>
      </div>
      {favoriteError ? <p className="data-sm text-center text-error">{favoriteError.message}</p> : null}

      <div className="mx-auto flex w-full max-w-md flex-col gap-4 min-[1600px]:w-3/5 min-[1600px]:max-w-none">
      <div className="rounded-lg border border-outline-variant bg-surface-container px-4 py-5 text-center">
        <p className="label-caps text-success">Current price</p>
        <p className="mt-1 flex items-end justify-center gap-2">
          <span className="font-mono text-[34px] font-medium leading-10 tracking-tight text-success">
            {quoteLoading && displayPrice == null ? "…" : `$${displayPrice == null ? "—" : formatAmount(displayPrice, 2)}`}
          </span>
          <span className="data-sm mb-1 text-on-surface-variant">USDC</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container p-4 md:p-5">
        <div className="grid grid-cols-2 gap-1 rounded-md bg-surface-container-lowest p-1">
          <button
            className={`label-caps rounded px-3 py-2.5 ${
              isBuy ? "bg-primary-container text-on-primary" : "text-on-surface-variant"
            }`}
            onClick={() => setSide("buy")}
            type="button"
          >
            Buy {stock.ticker}
          </button>
          <button
            className={`label-caps rounded px-3 py-2.5 ${
              !isBuy ? "bg-error text-on-primary" : "text-on-surface-variant"
            }`}
            onClick={() => setSide("sell")}
            type="button"
          >
            Sell {stock.ticker}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-on-surface">
          <span>Type: Market Order</span>
          <span>Slippage: {quote.slippagePercent}%</span>
        </div>

        <p className="label-caps text-on-surface-variant">Order value</p>
        <p className="data-sm text-right text-secondary">{availableLabel}</p>

        <label className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3">
          <span className="text-xl font-semibold text-on-surface-variant">$</span>
          <input
            className="min-w-0 flex-1 bg-transparent font-mono text-[34px] font-medium leading-10 tracking-tight text-primary-container outline-none"
            inputMode="decimal"
            onChange={(event) => setAmountInput(sanitizePositiveDecimalInput(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "-" || event.key === "+" || event.key === "e" || event.key === "E") {
                event.preventDefault();
              }
            }}
            pattern="[0-9]*[.,]?[0-9]*"
            placeholder="0"
            value={amountInput}
          />
          <span className="label-caps text-on-surface-variant">USDC</span>
        </label>

        <div className="flex flex-col gap-1">
          <p className="flex justify-between gap-4 data-sm text-on-surface">
            <span>Estimated shares received</span>
            <span>
              {quoteLoading ? "…" : `≈ ${formatAmount(quote.estimatedShares, 4)} ${stock.tokenSymbol}`}
            </span>
          </p>
          <p className="flex justify-between gap-4 data-sm text-on-surface">
            <span>Estimated fees / spread</span>
            <span>{formatAmount(quote.feeUsdc, 4)} USDC</span>
          </p>
          <p className="flex justify-between gap-4 data-sm text-on-surface">
            <span>Min shares after slippage</span>
            <span>
              {formatAmount(quote.minShares, 4)} {stock.tokenSymbol}
            </span>
          </p>
        </div>

        {belowMinimum ? (
          <p className="data-sm text-error">Minimum order size is {MinimumOrderUsdc} USDC.</p>
        ) : null}
        {exceedsUsdc ? <p className="data-sm text-error">Amount exceeds available USDC.</p> : null}
        {!isBuy ? (
          <p className="data-sm text-error">{stock.tokenSymbol} is not held on this Solana wallet.</p>
        ) : null}
        {actionError ? <p className="data-sm text-error">{actionError}</p> : null}
        {quoteError ? <p className="data-sm text-error">{quoteError.message}</p> : null}

        <button
          className={`label-caps mt-1 min-h-[52px] rounded-md px-4 py-3 ${
            isBuy ? "bg-primary-container text-on-primary" : "bg-error text-on-primary"
          } ${canSubmit ? "neon-bloom" : "opacity-50"}`}
          disabled={!canSubmit}
          onClick={() => {
            void onExecute();
          }}
          type="button"
        >
          {isSubmitting ? "Working…" : isBuy ? `Buy ${stock.ticker}` : `Sell ${stock.ticker}`}
        </button>

        <p className="data-sm text-center text-on-surface-variant">
          {SolanaNetworkLabel} · Ondo Global Markets · Gas varies
        </p>
      </div>

      {completedMessage ? (
        <OrderCompletedDialog message={completedMessage} onDismiss={dismissCompleted} />
      ) : null}
      </div>
    </section>
  );
}
