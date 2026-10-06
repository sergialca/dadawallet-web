import { getStockByMint, isCatalogSolanaMint } from "@/constants/stocks";
import { SolanaStablecoins, isSolanaCashMint } from "@/constants/tokens";
import { formatAmount } from "@/lib/format-amount";
import {
  getSolanaBalanceLamports,
  getSplTokenAccounts,
  LAMPORTS_PER_SOL,
  type SplTokenAccountBalance,
} from "@/lib/solana-rpc";

export type WalletHolding = {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  usdValue: string | null;
  raw: string;
};

export type WalletHoldingsResult = {
  holdings: WalletHolding[];
  netWorthUsd: number | null;
};

function isSolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function formatTokenAmount(raw: bigint, decimals: number) {
  const zero = BigInt(0);
  const negative = raw < zero;
  const absolute = negative ? -raw : raw;
  const padded = absolute.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const fraction = padded.slice(padded.length - decimals).replace(/0+$/, "");
  const amount = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  return negative ? `-${amount}` : amount;
}

function formatUsd(value: number) {
  return `$${formatAmount(value, 2)}`;
}

async function fetchSolUsdPrice() {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { solana?: { usd?: number } };
  return typeof payload.solana?.usd === "number" ? payload.solana.usd : null;
}

function tokenToHolding(token: SplTokenAccountBalance): WalletHolding | null {
  const amount = formatTokenAmount(token.raw, token.decimals);
  const stablecoin = SolanaStablecoins.find((item) => item.mint === token.mint);

  if (stablecoin) {
    const usdValue = stablecoin.symbol === "USDC" ? Number(amount) : null;
    return {
      id: stablecoin.id,
      name: stablecoin.name,
      symbol: stablecoin.symbol,
      amount: `${formatAmount(amount, 2)} ${stablecoin.symbol}`,
      usdValue: usdValue == null ? null : formatUsd(usdValue),
      raw: token.raw.toString(),
    };
  }

  const stock = getStockByMint(token.mint);
  if (!stock || !isCatalogSolanaMint(token.mint)) {
    return null;
  }

  return {
    id: stock.id,
    name: stock.name,
    symbol: stock.ticker,
    amount: `${formatAmount(amount, 4)} ${stock.tokenSymbol}`,
    usdValue: null,
    raw: token.raw.toString(),
  };
}

export async function loadWalletHoldings(owner: string): Promise<WalletHoldingsResult> {
  if (!isSolanaAddress(owner)) {
    throw new Error("Invalid Solana address");
  }

  const [lamports, tokenAccounts, solUsd] = await Promise.all([
    getSolanaBalanceLamports(owner),
    getSplTokenAccounts(owner),
    fetchSolUsdPrice().catch(() => null),
  ]);

  const solAmount = formatTokenAmount(BigInt(lamports), 9);
  const solUsdValue = solUsd == null ? null : (lamports / LAMPORTS_PER_SOL) * solUsd;
  const zero = BigInt(0);

  const cashHoldings = SolanaStablecoins.map((stablecoin) => {
    const held = tokenAccounts.find((token) => token.mint === stablecoin.mint);
    return tokenToHolding({
      decimals: held?.decimals ?? stablecoin.decimals,
      mint: stablecoin.mint,
      raw: held?.raw ?? zero,
    });
  }).filter((holding): holding is WalletHolding => holding != null);

  const stockHoldings = tokenAccounts
    .filter((token) => isCatalogSolanaMint(token.mint) && !isSolanaCashMint(token.mint) && token.raw > zero)
    .map(tokenToHolding)
    .filter((holding): holding is WalletHolding => holding != null);

  const holdings: WalletHolding[] = [
    {
      id: "sol",
      name: "SOL",
      symbol: "SOL",
      amount: `${formatAmount(solAmount, 6)} SOL`,
      usdValue: solUsdValue == null ? null : formatUsd(solUsdValue),
      raw: String(lamports),
    },
    ...cashHoldings,
    ...stockHoldings,
  ];

  const knownUsd = holdings.reduce((sum, holding) => {
    if (!holding.usdValue) {
      return sum;
    }
    const numeric = Number(holding.usdValue.replace(/[$,]/g, ""));
    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0);

  return {
    holdings,
    netWorthUsd: solUsdValue == null && cashHoldings.every((holding) => holding.usdValue == null) ? null : knownUsd,
  };
}
