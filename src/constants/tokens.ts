export const SolanaNetworkLabel = "Solana Devnet";
export const SolanaCluster = "devnet";
export const SolanaNativeDecimals = 9;
export const SolanaNativeName = "Solana";
export const SolanaNativeSymbol = "SOL";
export const SolanaUsdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const SolanaUsdcDecimals = 6;
export const SolanaEurcMint = "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr";
export const SolanaEurcDecimals = 6;

export const SolanaNativeAsset = {
  decimals: SolanaNativeDecimals,
  icon: "sol" as const,
  id: "sol",
  mint: null,
  name: SolanaNativeName,
  symbol: SolanaNativeSymbol,
  usdPeg: false,
} as const;

export const SolanaStablecoins = [
  {
    decimals: SolanaUsdcDecimals,
    icon: "usdc" as const,
    id: "usdc",
    mint: SolanaUsdcMint,
    name: "USD Coin",
    symbol: "USDC",
    usdPeg: true,
  },
  {
    decimals: SolanaEurcDecimals,
    icon: "eurc" as const,
    id: "eurc",
    mint: SolanaEurcMint,
    name: "Euro Coin",
    symbol: "EURC",
    usdPeg: false,
  },
] as const;

export const SolanaWalletAssets = [SolanaNativeAsset, ...SolanaStablecoins] as const;

export type SolanaWalletAsset = (typeof SolanaWalletAssets)[number];

export function isSolanaCashMint(mint: string) {
  return SolanaStablecoins.some((token) => token.mint === mint);
}
