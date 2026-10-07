const PUBLIC_SOLANA_DEVNET_RPC_URL = "https://api.devnet.solana.com";

export const LAMPORTS_PER_SOL = 1_000_000_000;
export const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const SPL_TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

type SolanaRpcResponse<T> = {
  error?: { message?: string };
  result?: T;
};

type ParsedTokenAccount = {
  account: {
    data: {
      parsed?: {
        info?: {
          mint?: string;
          tokenAmount?: {
            amount?: string;
            decimals?: number;
          };
        };
      };
    };
  };
};

export type SplTokenAccountBalance = {
  decimals: number;
  mint: string;
  raw: bigint;
};

export function getSolanaRpcUrl() {
  return (
    process.env.SOLANA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
    PUBLIC_SOLANA_DEVNET_RPC_URL
  );
}

export async function solanaRpc<T>(method: string, params: unknown[] = []) {
  const response = await fetch(getSolanaRpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });

  const payload = (await response.json()) as SolanaRpcResponse<T>;
  if (!response.ok || payload.error || payload.result === undefined) {
    throw new Error(payload.error?.message ?? `Solana RPC ${method} failed (${response.status})`);
  }

  return payload.result;
}

export async function getSolanaBalanceLamports(address: string) {
  const result = await solanaRpc<{ value: number }>("getBalance", [address, { commitment: "confirmed" }]);
  return result.value;
}

export async function getSplTokenBalance(owner: string, mint: string) {
  const result = await solanaRpc<{ value: ParsedTokenAccount[] }>("getTokenAccountsByOwner", [
    owner,
    { mint },
    { encoding: "jsonParsed" },
  ]);

  let raw = BigInt(0);
  let decimals = 6;

  for (const account of result.value) {
    const tokenAmount = account.account.data.parsed?.info?.tokenAmount;
    if (!tokenAmount?.amount) {
      continue;
    }

    raw += BigInt(tokenAmount.amount);
    if (typeof tokenAmount.decimals === "number") {
      decimals = tokenAmount.decimals;
    }
  }

  return { decimals, mint, raw };
}

async function getTokenAccountsForProgram(owner: string, programId: string) {
  const result = await solanaRpc<{ value: ParsedTokenAccount[] }>("getTokenAccountsByOwner", [
    owner,
    { programId },
    { encoding: "jsonParsed" },
  ]);
  return result.value;
}

export async function getSplTokenAccounts(owner: string): Promise<SplTokenAccountBalance[]> {
  const [legacyAccounts, token2022Accounts] = await Promise.all([
    getTokenAccountsForProgram(owner, SPL_TOKEN_PROGRAM_ID).catch(() => []),
    getTokenAccountsForProgram(owner, SPL_TOKEN_2022_PROGRAM_ID).catch(() => []),
  ]);

  const byMint = new Map<string, SplTokenAccountBalance>();
  const zero = BigInt(0);

  for (const account of [...legacyAccounts, ...token2022Accounts]) {
    const info = account.account.data.parsed?.info;
    const mint = info?.mint;
    const amount = info?.tokenAmount?.amount;
    if (!mint || !amount) {
      continue;
    }

    const raw = BigInt(amount);
    const decimals = typeof info.tokenAmount?.decimals === "number" ? info.tokenAmount.decimals : 0;
    const existing = byMint.get(mint);
    if (existing) {
      existing.raw += raw;
    } else {
      byMint.set(mint, { decimals, mint, raw });
    }
  }

  return [...byMint.values()].filter((token) => token.raw > zero);
}
