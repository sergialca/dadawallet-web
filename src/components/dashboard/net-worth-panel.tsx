"use client";

import { AssetIcon } from "@/components/dashboard/asset-icon";
import { useWalletHoldings } from "@/hooks/use-wallet-holdings";

function formatNetWorth(value: number | null) {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function NetWorthPanel() {
  const holdings = useWalletHoldings();

  return (
    <aside className="flex max-h-[70vh] min-h-0 w-full flex-col gap-5 overflow-y-auto overscroll-contain border-t border-outline-variant bg-surface-container-low p-5 rail:h-full rail:max-h-none rail:w-[360px] rail:shrink-0 rail:border-t-0 rail:border-l-2 rail:border-l-primary-container">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="label-caps text-on-surface-variant">Unified net worth</p>
        </div>
        <p className="mt-2 font-mono text-[34px] font-medium leading-10 tracking-tight text-on-surface">
          {holdings.status === "ready" ? formatNetWorth(holdings.data.netWorthUsd) : "—"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          className="flex flex-col items-center gap-1 rounded bg-primary-container px-2 py-3 text-on-primary neon-bloom"
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
            <path d="M4 12 12 4M12 4H6.5M12 4v5.5" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <span className="label-caps">Send</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 rounded border border-outline-variant bg-surface-container px-2 py-3 text-on-surface neon-bloom"
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
            <path d="M8 3v8M5 8.5 8 12l3-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="label-caps">Receive</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 rounded border border-outline-variant bg-surface-container px-2 py-3 text-on-surface neon-bloom"
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
            <rect height="10" rx="1" stroke="currentColor" width="12" x="2" y="4" />
            <path d="M5 4V3h6v1" stroke="currentColor" />
          </svg>
          <span className="label-caps">Buy</span>
        </button>
      </div>

      <div>
        <p className="label-caps mb-3 text-on-surface-variant">Live holdings</p>
        {holdings.status === "error" ? (
          <p className="text-sm text-on-surface-variant">{holdings.message}</p>
        ) : holdings.status === "ready" ? (
          <ul className="flex flex-col gap-2">
            {holdings.data.holdings.map((holding) => (
              <li
                key={holding.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AssetIcon symbol={holding.symbol} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface">{holding.name}</p>
                    <p className="data-sm text-on-surface-variant">{holding.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="data-lg text-on-surface">{holding.amount}</p>
                  <p className="data-sm mt-0.5 text-on-surface-variant">{holding.usdValue ?? "—"}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-on-surface-variant">Loading holdings</p>
        )}
      </div>
    </aside>
  );
}
