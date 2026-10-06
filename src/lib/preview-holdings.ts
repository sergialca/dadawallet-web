export const PREVIEW_HOLDINGS = [
  {
    symbol: "SOL",
    name: "SOL",
    ticker: "SOL",
    amount: "1,240.50 SOL",
    usdValue: "$186,075.00",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    ticker: "BTC",
    amount: "1.82 BTC",
    usdValue: "$122,125.00",
  },
  {
    symbol: "NVDA",
    name: "Nvidia Synth",
    ticker: "NVDA",
    amount: "85 Shares",
    usdValue: "$112,575.00",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    ticker: "USDC",
    amount: "82,135.45 USDC",
    usdValue: "$62,135.45",
  },
] as const;

export type PreviewHolding = (typeof PREVIEW_HOLDINGS)[number];
