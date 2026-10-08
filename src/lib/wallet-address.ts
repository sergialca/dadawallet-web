type LinkedAccount = {
  type?: string;
  chainType?: string;
  chain_type?: string;
  address?: string;
};

type PrivyUserLike = {
  wallet?: {
    address?: string;
    chainType?: string;
    chain_type?: string;
  } | null;
  linkedAccounts?: LinkedAccount[] | null;
  linked_accounts?: LinkedAccount[] | null;
};

function isSolanaAccount(account: {
  chainType?: string;
  chain_type?: string;
  address?: string;
}) {
  return (
    Boolean(account.address) &&
    (account.chainType === "solana" || account.chain_type === "solana")
  );
}

export function getWalletAddress(user: PrivyUserLike | null | undefined) {
  const accounts = user?.linkedAccounts ?? user?.linked_accounts ?? [];
  const solana = accounts.find(
    (account) => account.type === "wallet" && isSolanaAccount(account),
  );

  if (solana?.address) {
    return solana.address;
  }

  if (user?.wallet && isSolanaAccount(user.wallet) && user.wallet.address) {
    return user.wallet.address;
  }

  const fallback = user?.wallet?.address;
  if (fallback && !fallback.startsWith("0x")) {
    return fallback;
  }

  return accounts.find((account) => account.address && !account.address.startsWith("0x"))?.address ?? null;
}

export function shortenAddress(address: string) {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
