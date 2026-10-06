import type { PreviewHolding } from "@/lib/preview-holdings";

function IconShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${className ?? "bg-[#001a28]"}`}
    >
      {children}
    </span>
  );
}

export function AssetIcon({ symbol }: { symbol: PreviewHolding["symbol"] }) {
  if (symbol === "SOL") {
    return (
      <IconShell className="bg-[#0b1220]">
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="sol-bars" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#9945FF" />
              <stop offset="100%" stopColor="#14F195" />
            </linearGradient>
          </defs>
          <path
            d="M6.2 7.2h10.4c.5 0 .8.6.5 1.1L15.8 10H5.4c-.5 0-.8-.6-.5-1.1l1.3-1.7Z"
            fill="url(#sol-bars)"
          />
          <path
            d="M6.2 11.2h10.4c.5 0 .8.6.5 1.1L15.8 14H5.4c-.5 0-.8-.6-.5-1.1l1.3-1.7Z"
            fill="url(#sol-bars)"
          />
          <path
            d="M6.2 15.2h10.4c.5 0 .8.6.5 1.1L15.8 18H5.4c-.5 0-.8-.6-.5-1.1l1.3-1.7Z"
            fill="url(#sol-bars)"
          />
        </svg>
      </IconShell>
    );
  }

  if (symbol === "USDC") {
    return (
      <IconShell className="bg-[#0a1c3a]">
        <span className="text-sm font-semibold text-[#4ea8de]">$</span>
      </IconShell>
    );
  }

  if (symbol === "BTC") {
    return (
      <IconShell className="bg-[#2a1c08]">
        <span className="text-sm font-semibold text-[#f7931a]">₿</span>
      </IconShell>
    );
  }

  return (
    <IconShell className="bg-[#001a33]">
      <span className="text-[10px] font-bold tracking-wide text-secondary">
        {symbol.slice(0, 2)}
      </span>
    </IconShell>
  );
}
