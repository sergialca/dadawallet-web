"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { listedStocks } from "@/constants/stocks";
import { useFavoriteTickers } from "@/hooks/use-favorite-tickers";
import {
  ALPHABET,
  filterStocks,
  filterStocksByKind,
  groupStocksByNameLetter,
  type StockListFilter,
} from "@/lib/stock-list";
import type { StockAsset } from "@/types/stocks";

const LIST_FILTERS: { id: Exclude<StockListFilter, "favorites">; label: string }[] = [
  { id: "all", label: "All" },
  { id: "stock", label: "Stocks" },
  { id: "pre-IPO stock", label: "Pre-IPO" },
];

function StockLogo({ stock }: { stock: StockAsset }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest md:h-12 md:w-12">
      {failed ? (
        <span className="text-xs font-semibold text-on-surface-variant">
          {stock.ticker.slice(0, 1)}
        </span>
      ) : (
        <img
          alt=""
          className="h-7 w-7 object-contain md:h-8 md:w-8"
          onError={() => setFailed(true)}
          src={stock.logoUrl}
        />
      )}
    </span>
  );
}

function scrollToLetter(letter: string) {
  document.getElementById(`stock-section-${letter}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function StocksList() {
  const [query, setQuery] = useState("");
  const [listFilter, setListFilter] = useState<StockListFilter>("all");
  const { error: favoritesError, isLoading: favoritesLoading, tickerSet } = useFavoriteTickers();

  const sections = useMemo(() => {
    const visible = filterStocksByKind(listedStocks, listFilter, tickerSet);
    return groupStocksByNameLetter(filterStocks(visible, query));
  }, [listFilter, query, tickerSet]);

  const populatedLetters = useMemo(
    () => new Set(sections.map((section) => section.title)),
    [sections],
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <label className="relative w-full max-w-xl">
        <span className="sr-only">Search stocks</span>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
          fill="none"
          viewBox="0 0 16 16"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeLinecap="round" />
        </svg>
        <input
          className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-2.5 pl-9 pr-4 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary-container"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search stocks"
          type="search"
          value={query}
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {LIST_FILTERS.map((filter) => {
          const selected = listFilter === filter.id;
          return (
            <button
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                selected
                  ? "border-primary-container bg-primary-container text-on-primary"
                  : "border-outline-variant text-on-surface-variant hover:text-on-surface"
              }`}
              key={filter.id}
              onClick={() => setListFilter(filter.id)}
              type="button"
            >
              {selected ? (
                <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />
              ) : null}
              {filter.label}
            </button>
          );
        })}
        <button
          aria-label="Favorites"
          aria-pressed={listFilter === "favorites"}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg ${
            listFilter === "favorites"
              ? "border-primary-container bg-primary-container text-on-primary"
              : "border-outline-variant text-on-surface-variant hover:text-on-surface"
          }`}
          onClick={() => setListFilter("favorites")}
          type="button"
        >
          <span aria-hidden="true">{listFilter === "favorites" ? "★" : "☆"}</span>
        </button>
      </div>

      <div className="relative flex gap-3 md:gap-5">
        <div className="min-w-0 flex-1 pr-5">
          {listFilter === "favorites" && favoritesLoading ? (
            <p className="pt-4 text-sm text-on-surface-variant">Loading favorites…</p>
          ) : listFilter === "favorites" && favoritesError ? (
            <p className="pt-4 text-sm text-error">{favoritesError.message}</p>
          ) : sections.length === 0 ? (
            <p className="pt-4 text-sm text-on-surface-variant">
              {listFilter === "favorites" && !query.trim()
                ? "No favorite stocks yet. Star a stock on its buy/sell page."
                : "No matching stocks"}
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {sections.map((section) => (
                <section
                  className="scroll-mt-4"
                  id={`stock-section-${section.title}`}
                  key={section.title}
                >
                  <h2 className="mb-2 text-sm font-semibold text-primary-container">
                    {section.title}
                  </h2>
                  <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {section.data.map((stock) => (
                      <li key={stock.id}>
                        <Link
                          className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 neon-bloom"
                          href={`/dashboard/stocks/${stock.id}`}
                        >
                          <StockLogo stock={stock} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-on-surface md:text-base">
                              {stock.name}
                            </p>
                            <p className="data-sm text-on-surface-variant">{stock.ticker}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <nav
          aria-label="Jump to letter"
          className="sticky top-4 flex h-fit shrink-0 flex-col items-center gap-0.5 py-1"
        >
          {ALPHABET.map((letter) => {
            const enabled = populatedLetters.has(letter);
            return (
              <button
                className={`text-[10px] font-semibold leading-4 md:text-[11px] md:leading-5 ${
                  enabled ? "text-primary-container" : "text-outline-variant"
                }`}
                disabled={!enabled}
                key={letter}
                onClick={() => scrollToLetter(letter)}
                type="button"
              >
                {letter}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
