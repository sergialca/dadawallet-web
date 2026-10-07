import {
  DefaultSlippagePercent,
  OndoApiBaseUrl,
  OndoChainId,
  QuoteDuration,
  type OndoQuoteSide,
  type OndoSoftQuote,
} from "@/constants/ondo";

export type TradeQuote = {
  estimatedShares: number;
  feeUsdc: number;
  midPrice: number | null;
  minShares: number;
  quotePrice: number | null;
  slippagePercent: number;
};

const FALLBACK_SPREAD = 0.001;
const ONDO_QUOTE_DECIMALS = 18;

function ondoHeaders() {
  const apiKey = process.env.ONDO_API_KEY ?? process.env.NEXT_PUBLIC_ONDO_API_KEY;
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { "x-api-key": apiKey } : {}),
  };
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `Ondo request failed (${response.status})`);
  }
  return payload;
}

function toNumber(value: string | undefined) {
  if (!value) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function fromOndoUint18(value: string | undefined) {
  if (!value) {
    return null;
  }

  if (value.includes(".") || value.includes("e") || value.includes("E")) {
    return toNumber(value);
  }

  try {
    const raw = BigInt(value);
    const negative = raw < BigInt(0);
    const absolute = (negative ? -raw : raw).toString().padStart(ONDO_QUOTE_DECIMALS + 1, "0");
    const whole = absolute.slice(0, -ONDO_QUOTE_DECIMALS);
    const fraction = absolute.slice(-ONDO_QUOTE_DECIMALS).replace(/0+$/, "");
    const numeric = Number(`${whole}.${fraction || "0"}`);
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return negative ? -numeric : numeric;
  } catch {
    return null;
  }
}

export async function fetchOndoPrice(symbol: string) {
  try {
    const latest = await fetchJson<{
      primaryMarket?: { price?: string };
      underlyingMarket?: { price?: string };
    }>(`${OndoApiBaseUrl}/assets/${symbol}/prices/latest`, { headers: ondoHeaders() });
    return toNumber(latest.primaryMarket?.price) ?? toNumber(latest.underlyingMarket?.price);
  } catch {
    const quickstart = await fetchJson<{
      primaryMarket?: { price?: string };
      price?: string;
    }>(`${OndoApiBaseUrl}/assets/prices/${symbol}`, { headers: ondoHeaders() });
    return toNumber(quickstart.primaryMarket?.price) ?? toNumber(quickstart.price);
  }
}

export async function fetchOndoSoftQuote(input: {
  notionalValue: string;
  side: OndoQuoteSide;
  symbol: string;
}) {
  return fetchJson<OndoSoftQuote>(`${OndoApiBaseUrl}/attestations/soft`, {
    body: JSON.stringify({
      chainId: OndoChainId,
      duration: QuoteDuration,
      notionalValue: input.notionalValue,
      side: input.side,
      symbol: input.symbol,
    }),
    headers: ondoHeaders(),
    method: "POST",
  });
}

async function fetchUnderlyingPrice(ticker: string) {
  const yahoo = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
    { headers: { Accept: "application/json" } },
  ).then(async (response) => {
    if (!response.ok) {
      throw new Error("Yahoo price request failed");
    }
    return response.json() as Promise<{
      chart?: { result?: { meta?: { regularMarketPrice?: number } }[] };
    }>;
  });
  const yahooPrice = yahoo.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof yahooPrice === "number" && Number.isFinite(yahooPrice)) {
    return yahooPrice;
  }
  throw new Error("Yahoo price missing");
}

type DexscreenerPair = {
  baseToken?: { address?: string };
  chainId?: string;
  liquidity?: { usd?: number };
  priceUsd?: string;
  quoteToken?: { symbol?: string };
};

export async function fetchDexscreenerPrice(mint: string) {
  const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`);
  if (!response.ok) {
    throw new Error("Dexscreener price request failed");
  }

  const payload = (await response.json()) as { pairs?: DexscreenerPair[] | null };
  const best = (payload.pairs ?? [])
    .filter((pair) => {
      const price = Number(pair.priceUsd);
      return (
        pair.chainId === "solana" &&
        pair.baseToken?.address === mint &&
        pair.quoteToken?.symbol === "USDC" &&
        Number.isFinite(price) &&
        price > 0
      );
    })
    .sort((left, right) => (right.liquidity?.usd ?? 0) - (left.liquidity?.usd ?? 0))[0];

  const price = Number(best?.priceUsd);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export async function fetchDisplayPrice(symbol: string, ticker: string, mint: string) {
  if (mint) {
    const poolPrice = await fetchDexscreenerPrice(mint).catch(() => null);
    if (poolPrice) {
      return poolPrice;
    }
  }

  if (symbol) {
    const ondoPrice = await fetchOndoPrice(symbol).catch(() => null);
    if (ondoPrice && ondoPrice > 0) {
      return ondoPrice;
    }
  }

  if (!ticker) {
    return null;
  }

  try {
    return await fetchUnderlyingPrice(ticker);
  } catch {
    const finnhub = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=demo`,
    ).then(async (response) => {
      if (!response.ok) {
        return null;
      }
      return response.json() as Promise<{ c?: number }>;
    });
    return typeof finnhub?.c === "number" && finnhub.c > 0 ? finnhub.c : null;
  }
}

export async function loadTradeQuote(input: {
  mint?: string;
  notionalUsdc: number;
  side: OndoQuoteSide;
  symbol: string;
  ticker: string;
}): Promise<TradeQuote> {
  const mint = input.mint ?? "";
  const midPrice = (await fetchDisplayPrice(input.symbol, input.ticker, mint).catch(() => null)) ?? null;

  if (input.notionalUsdc <= 0) {
    return {
      estimatedShares: 0,
      feeUsdc: 0,
      midPrice,
      minShares: 0,
      quotePrice: midPrice,
      slippagePercent: DefaultSlippagePercent,
    };
  }

  let quotePrice = midPrice;
  let estimatedShares = 0;
  let quoted = false;

  if (input.symbol) {
    try {
      const softQuote = await fetchOndoSoftQuote({
        notionalValue: input.notionalUsdc.toString(),
        side: input.side,
        symbol: input.symbol,
      });
      const nextPrice = fromOndoUint18(softQuote.price);
      const nextShares = fromOndoUint18(softQuote.tokenAmount);
      if (nextPrice && nextPrice > 0 && nextShares != null) {
        quotePrice = nextPrice;
        estimatedShares = nextShares;
        quoted = true;
      }
    } catch {
      quoted = false;
    }
  }

  if (!quoted && quotePrice && quotePrice > 0) {
    const signedSpread = input.side === "buy" ? 1 + FALLBACK_SPREAD : 1 - FALLBACK_SPREAD;
    quotePrice *= signedSpread;
    estimatedShares = input.notionalUsdc / quotePrice;
  }

  const feeUsdc =
    midPrice && quotePrice
      ? Math.abs(quotePrice - midPrice) * estimatedShares
      : input.notionalUsdc * FALLBACK_SPREAD;
  const minShares = estimatedShares * (1 - DefaultSlippagePercent / 100);

  return {
    estimatedShares,
    feeUsdc,
    midPrice,
    minShares,
    quotePrice,
    slippagePercent: DefaultSlippagePercent,
  };
}
