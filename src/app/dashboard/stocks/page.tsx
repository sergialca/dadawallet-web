import Link from "next/link";

import { StocksList } from "@/components/dashboard/stocks-list";

export default function StocksPage() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <Link
          className="inline-flex items-center gap-2 rounded text-on-surface neon-bloom"
          href="/dashboard"
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
          <span className="sr-only">Back to dashboard</span>
        </Link>
        <p className="label-caps mt-3 text-on-surface-variant">Catalog</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-on-surface">Stocks</h1>
      </div>
      <StocksList />
    </section>
  );
}
