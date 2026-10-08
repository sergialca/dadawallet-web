import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDadawalletMcpServer } from "@/lib/mcp/server";

const { loadWalletHoldings } = vi.hoisted(() => ({
  loadWalletHoldings: vi.fn(),
}));

vi.mock("@/lib/solana-holdings", () => ({
  loadWalletHoldings,
}));

vi.mock("@/lib/trade-quote", () => ({
  loadTradeQuote: vi.fn(async () => ({
    estimatedShares: 0.03,
    feeUsdc: 0.01,
    midPrice: 100,
    minShares: 0.029,
    quotePrice: 100.1,
    slippagePercent: 0.5,
  })),
}));

const PrivateWallet = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

function textFromTool(result: { content: Array<{ type: string; text?: string }>; isError?: boolean }) {
  const text = result.content.find((part) => part.type === "text")?.text ?? "";
  return { isError: Boolean(result.isError), text };
}

async function connectClient(walletAddress: string | null) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createDadawalletMcpServer({ walletAddress });
  const client = new Client({ name: "privacy-test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

describe("MCP privacy", () => {
  beforeEach(() => {
    loadWalletHoldings.mockReset();
    loadWalletHoldings.mockImplementation(async () => {
      throw new Error("loadWalletHoldings must not run without an authenticated wallet");
    });
  });

  it("does not load holdings for get_wallet_status without a session", async () => {
    const { client } = await connectClient(null);
    const result = await client.callTool({ arguments: {}, name: "get_wallet_status" });
    const { isError, text } = textFromTool(result);

    expect(isError).toBe(true);
    expect(text).toMatch(/authentication required/i);
    expect(text).not.toContain(PrivateWallet);
    expect(loadWalletHoldings).not.toHaveBeenCalled();
  });

  it("ignores a caller-supplied wallet address on get_wallet_status when unauthenticated", async () => {
    const { client } = await connectClient(null);
    const result = await client.callTool({
      arguments: { address: PrivateWallet, walletAddress: PrivateWallet },
      name: "get_wallet_status",
    });
    const { isError, text } = textFromTool(result);

    expect(isError).toBe(true);
    expect(text).not.toContain(PrivateWallet);
    expect(loadWalletHoldings).not.toHaveBeenCalled();
  });

  it("does not load holdings or leak balances from prepare_trade without a session", async () => {
    const { client } = await connectClient(null);
    const result = await client.callTool({
      arguments: { notionalUsdc: 10, side: "buy", ticker: "AAPL" },
      name: "prepare_trade",
    });
    const { isError, text } = textFromTool(result);
    const payload = JSON.parse(text) as Record<string, unknown>;

    expect(isError).toBe(false);
    expect(loadWalletHoldings).not.toHaveBeenCalled();
    expect(payload).not.toHaveProperty("address");
    expect(payload).not.toHaveProperty("holdings");
    expect(payload).not.toHaveProperty("netWorthUsd");
    expect(JSON.stringify(payload)).not.toContain(PrivateWallet);
    expect(JSON.stringify(payload.warnings)).not.toMatch(/USDC/i);
  });

  it("does not attach wallet fields to public catalog and price tools", async () => {
    const { client } = await connectClient(null);
    const listed = await client.callTool({ arguments: {}, name: "list_available_stocks" });
    const priced = await client.callTool({
      arguments: { ticker: "AAPL" },
      name: "get_stock_price",
    });

    expect(loadWalletHoldings).not.toHaveBeenCalled();
    expect(listed.isError).not.toBe(true);
    expect(priced.isError).not.toBe(true);
    expect(textFromTool(listed).text).not.toContain(PrivateWallet);
    expect(textFromTool(priced).text).not.toMatch(/holdings|netWorthUsd|"address"/);
    expect(textFromTool(priced).text).not.toContain(PrivateWallet);
  });

  it("loads holdings only for the authenticated session wallet", async () => {
    loadWalletHoldings.mockImplementation(async (owner: string) => ({
      holdings: [
        {
          amount: "40 USDC",
          id: "usdc",
          name: "USD Coin",
          raw: "40000000",
          symbol: "USDC",
          usdValue: "$40",
        },
      ],
      netWorthUsd: 40,
    }));

    const { client } = await connectClient(PrivateWallet);
    const result = await client.callTool({
      arguments: { address: "SomeOtherWallet111111111111111111111111111" },
      name: "get_wallet_status",
    });
    const { isError, text } = textFromTool(result);
    const payload = JSON.parse(text) as { address: string };

    expect(isError).toBe(false);
    expect(loadWalletHoldings).toHaveBeenCalledTimes(1);
    expect(loadWalletHoldings).toHaveBeenCalledWith(PrivateWallet);
    expect(payload.address).toBe(PrivateWallet);
  });
});
