import { getStockByMint } from "@/constants/stocks";
import { SolanaCluster, SolanaStablecoins } from "@/constants/tokens";
import { solanaRpc } from "@/lib/solana-rpc";

const ACTIVITY_LIMIT = 25;
const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

export type ActivityKind = "received" | "sent" | "swap" | "other";

export type ActivityChange = {
  amount: string;
  direction: "in" | "out";
  mint: string | null;
  name: string;
  symbol: string;
};

export type WalletActivity = {
  blockTime: number | null;
  changes: ActivityChange[];
  explorerUrl: string;
  kind: ActivityKind;
  primarySymbol: string;
  signature: string;
  status: "failed" | "success";
};

export type WalletActivityResult = {
  activities: WalletActivity[];
};

type ParsedAccountKey = string | { pubkey?: string };

type TokenBalance = {
  mint?: string;
  owner?: string;
  uiTokenAmount?: {
    amount?: string;
    decimals?: number;
  };
};

type AddressTransaction = {
  blockTime?: number | null;
  meta?: {
    err?: unknown;
    fee?: number;
    postBalances?: number[];
    postTokenBalances?: TokenBalance[];
    preBalances?: number[];
    preTokenBalances?: TokenBalance[];
  } | null;
  transaction?: {
    message?: {
      accountKeys?: ParsedAccountKey[];
    };
    signatures?: string[];
  };
};

type AddressTransactionPage = {
  data?: AddressTransaction[];
};

type SignaturePage = {
  data?: Array<{ signature?: string }>;
};

function isSolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function accountPubkey(key: ParsedAccountKey | undefined) {
  if (typeof key === "string") {
    return key;
  }

  return key?.pubkey ?? "";
}

function formatRaw(raw: bigint, decimals: number) {
  const negative = raw < BigInt(0);
  const absolute = negative ? -raw : raw;
  const scale = decimals > 0 ? BigInt(10) ** BigInt(decimals) : BigInt(1);
  const whole = (absolute / scale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction =
    decimals > 0 ? (absolute % scale).toString().padStart(decimals, "0").replace(/0+$/, "") : "";
  const amount = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  return negative ? `-${amount}` : amount;
}

function describeMint(mint: string) {
  const stablecoin = SolanaStablecoins.find((token) => token.mint === mint);
  if (stablecoin) {
    return { mint, name: stablecoin.name, symbol: stablecoin.symbol };
  }

  const stock = getStockByMint(mint);
  if (stock) {
    return { mint, name: stock.name, symbol: stock.ticker };
  }

  if (mint === WRAPPED_SOL_MINT) {
    return { mint, name: "Wrapped SOL", symbol: "WSOL" };
  }

  return { mint, name: "Token", symbol: `${mint.slice(0, 4)}…${mint.slice(-4)}` };
}

function tokenTotals(balances: TokenBalance[] | undefined, owner: string) {
  const totals = new Map<string, { decimals: number; raw: bigint }>();

  for (const balance of balances ?? []) {
    if (balance.owner !== owner || !balance.mint || !balance.uiTokenAmount?.amount) {
      continue;
    }

    const raw = BigInt(balance.uiTokenAmount.amount);
    const decimals = balance.uiTokenAmount.decimals ?? 0;
    const existing = totals.get(balance.mint);
    if (existing) {
      existing.raw += raw;
    } else {
      totals.set(balance.mint, { decimals, raw });
    }
  }

  return totals;
}

function pushChange(changes: ActivityChange[], raw: bigint, asset: Omit<ActivityChange, "amount" | "direction"> & { decimals: number }) {
  if (raw === BigInt(0)) {
    return;
  }

  changes.push({
    amount: formatRaw(raw < BigInt(0) ? -raw : raw, asset.decimals),
    direction: raw > BigInt(0) ? "in" : "out",
    mint: asset.mint,
    name: asset.name,
    symbol: asset.symbol,
  });
}

export function transactionsToActivity(owner: string, transactions: AddressTransaction[]): WalletActivity[] {
  const activities: WalletActivity[] = [];

  for (const entry of transactions) {
    const signature = entry.transaction?.signatures?.[0];
    const meta = entry.meta;
    if (!signature || !meta) {
      continue;
    }

    const accountKeys = entry.transaction?.message?.accountKeys ?? [];
    const walletIndex = accountKeys.findIndex((key) => accountPubkey(key) === owner);
    const changes: ActivityChange[] = [];

    if (walletIndex >= 0) {
      const pre = BigInt(meta.preBalances?.[walletIndex] ?? 0);
      const post = BigInt(meta.postBalances?.[walletIndex] ?? 0);
      let delta = post - pre;
      if (accountPubkey(accountKeys[0]) === owner) {
        delta += BigInt(meta.fee ?? 0);
      }

      pushChange(changes, delta, {
        decimals: 9,
        mint: null,
        name: "Solana",
        symbol: "SOL",
      });
    }

    const before = tokenTotals(meta.preTokenBalances, owner);
    const after = tokenTotals(meta.postTokenBalances, owner);

    for (const mint of new Set([...before.keys(), ...after.keys()])) {
      const previous = before.get(mint);
      const next = after.get(mint);
      const decimals = next?.decimals ?? previous?.decimals ?? 0;
      const delta = (next?.raw ?? BigInt(0)) - (previous?.raw ?? BigInt(0));
      const asset = describeMint(mint);
      pushChange(changes, delta, { ...asset, decimals });
    }

    const incoming = changes.some((change) => change.direction === "in");
    const outgoing = changes.some((change) => change.direction === "out");
    const kind: ActivityKind =
      incoming && outgoing ? "swap" : incoming ? "received" : outgoing ? "sent" : "other";
    const primary =
      changes.find((change) => change.symbol !== "SOL") ?? changes[0];

    activities.push({
      blockTime: entry.blockTime ?? null,
      changes,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${SolanaCluster}`,
      kind,
      primarySymbol: primary?.symbol ?? "SOL",
      signature,
      status: meta.err ? "failed" : "success",
    });
  }

  return activities;
}

async function mapPool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await task(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function loadSignatureList(owner: string, signal: AbortSignal) {
  try {
    const page = await solanaRpc<SignaturePage>(
      "getTransactionsForAddress",
      [
        owner,
        {
          commitment: "confirmed",
          filters: {
            status: "any",
            tokenAccounts: "balanceChanged",
          },
          limit: ACTIVITY_LIMIT,
          sortOrder: "desc",
          transactionDetails: "signatures",
        },
      ],
      signal,
    );

    return (page.data ?? [])
      .map((item) => item.signature)
      .filter((signature): signature is string => Boolean(signature));
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
  }

  const legacy = await solanaRpc<Array<{ signature: string }>>(
    "getSignaturesForAddress",
    [owner, { commitment: "confirmed", limit: ACTIVITY_LIMIT }],
    signal,
  );
  return legacy.map((item) => item.signature);
}

async function loadParsedTransactions(signatures: string[], signal: AbortSignal) {
  return mapPool(signatures, 4, async (signature) => {
    try {
      return await solanaRpc<AddressTransaction | null>(
        "getTransaction",
        [
          signature,
          {
            commitment: "confirmed",
            encoding: "jsonParsed",
            maxSupportedTransactionVersion: 0,
          },
        ],
        signal,
      );
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
      return null;
    }
  });
}

export async function loadWalletActivity(owner: string): Promise<WalletActivityResult> {
  if (!isSolanaAddress(owner)) {
    throw new Error("Invalid Solana address");
  }

  try {
    const signal = AbortSignal.timeout(20_000);
    const signatures = await loadSignatureList(owner, signal);
    const transactions = await loadParsedTransactions(signatures, signal);
    return {
      activities: transactionsToActivity(
        owner,
        transactions.filter((transaction): transaction is AddressTransaction => transaction != null),
      ),
    };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("Activity request timed out");
    }
    throw error;
  }
}
