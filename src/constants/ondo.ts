export const OndoApiBaseUrl = "https://api.gm.ondo.finance/v1";
export const OndoChainId = "solana-900";
export const DefaultSlippagePercent = 0.5;
export const MinimumOrderUsdc = 1;
export const QuoteDuration = "short";

export type OndoQuoteSide = "buy" | "sell";

export type OndoSoftQuote = {
  assetAddress?: string;
  price: string;
  side: string;
  symbol: string;
  ticker?: string;
  tokenAmount: string;
};
