This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
