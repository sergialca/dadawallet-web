# dadawallet

## About

dadawallet is a non-custodial Solana web wallet and asset exchange. Users sign in with email OTP, hold a Solana wallet they control, and buy or sell tokenized stocks settled in USDC.

The app is a [Next.js](https://nextjs.org) App Router project. [Privy](https://www.privy.io) handles identity and the embedded Solana wallet, so the app never custodies keys. Stock quotes and orders come from [Ondo Global Markets](https://ondo.finance). Balances, net worth, and recent activity are read from Solana. A buy or sell is prepared as a quote and a review screen; the user confirms it in the wallet before anything is sent.

What it includes:

- **Login and signup** with Privy email OTP. Unauthenticated visitors land on `/login` and continue to `/dashboard` after they verify.
- **Dashboard** with unified net worth, SOL, stablecoin, and catalog-token holdings.
- **Stock catalog** of Ondo tokenized equities (for example AAPL, MSFT, NVDA), each with a buy/sell ticket and a live USDC quote.
- **Activity** for recent Solana transfers on the connected wallet.
- **Agent access** through a Streamable HTTP MCP endpoint at `/mcp`. Catalog and price tools are public. Wallet status and balance-aware trade advice require a Privy token. `prepare_trade` returns a review URL and does not send a transaction.

## Promotional video

[video](https://www.youtube.com/watch?v=3U56O1c-NE8)

## Getting Started

This project uses [pnpm](https://pnpm.io) as the only package manager.

Copy `.env.example` to `.env.local` and set Privy credentials from the [Privy Dashboard](https://dashboard.privy.io):

```bash
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PRIVY_CLIENT_ID=
PRIVY_APP_SECRET=
PRIVY_JWT_VERIFICATION_KEY=
```

Use a **development** Privy app ID for localhost so the SDK can set `privy-token` cookies. Enable email OTP in the dashboard.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users land on `/login`. After email OTP, they are redirected to `/dashboard`.

Agents can call the Streamable HTTP MCP endpoint at `http://localhost:3000/mcp` (or `https://<host>/mcp`). Cursor is already wired to it via `.cursor/mcp.json` while `pnpm dev` is running. Catalog and price tools are public. Wallet status and balance-aware trade advice need `Authorization: Bearer <privy-token>`. `prepare_trade` returns a review URL such as `/dashboard/stocks/aapl-ondo?side=buy&amount=10`; it does not send a transaction.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
