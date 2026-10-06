type LinkedAccount = {
  type?: string;
  chainType?: string;
  chain_type?: string;
  address?: string;
};

type PrivyUserLike = {
  wallet?: { address?: string } | null;
  linkedAccounts?: LinkedAccount[] | null;
};

export function getWalletAddress(user: PrivyUserLike | null | undefined) {
  if (user?.wallet?.address) {
    return user.wallet.address;
  }

  const accounts = user?.linkedAccounts ?? [];
  const solana = accounts.find(
    (account) =>
      account.type === "wallet" &&
      (account.chainType === "solana" || account.chain_type === "solana") &&
      account.address,
  );

  return solana?.address ?? accounts.find((account) => account.address)?.address ?? null;
}

export function shortenAddress(address: string) {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
