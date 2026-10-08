import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { MinimumOrderUsdc, type OndoQuoteSide } from "@/constants/ondo";
import { getStockByTicker, listedStocks } from "@/constants/stocks";
import { loadWalletHoldings } from "@/lib/solana-holdings";
import { loadTradeQuote } from "@/lib/trade-quote";
import type { StockAsset } from "@/types/stocks";

export type McpRequestContext = {
  walletAddress: string | null;
};

function jsonResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function asSide(value: string | undefined): OndoQuoteSide {
  return value === "sell" ? "sell" : "buy";
}

function quoteArgsForStock(stock: StockAsset, side: OndoQuoteSide, notionalUsdc: number) {
  return {
    mint: stock.kind === "pre-IPO stock" ? stock.contractAddress : "",
    notionalUsdc,
    side,
    symbol: stock.kind === "stock" ? stock.tokenSymbol : "",
    ticker: stock.ticker,
  };
}

function parseHoldingQuantity(amount: string) {
  const numeric = Number(amount.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function createDadawalletMcpServer(context: McpRequestContext) {
  const server = new McpServer({
    name: "dadawallet",
    version: "0.1.0",
  });

  server.registerTool(
    "list_available_stocks",
    {
      description: "List catalog stocks available to trade in Dada Wallet.",
      title: "List available stocks",
    },
    async () =>
      jsonResult(
        listedStocks.map((stock) => ({
          id: stock.id,
          kind: stock.kind,
          name: stock.name,
          ticker: stock.ticker,
          tokenSymbol: stock.tokenSymbol,
        })),
      ),
  );

  server.registerTool(
    "get_stock_price",
    {
      description: "Get a live display and order quote for a catalog stock ticker.",
      inputSchema: {
        notionalUsdc: z.number().positive().optional().describe("Order value in USDC. Defaults to the minimum order."),
        side: z.enum(["buy", "sell"]).optional().describe("Quote side. Defaults to buy."),
        ticker: z.string().describe("Stock ticker, e.g. AAPL."),
      },
      title: "Get stock price",
    },
    async ({ notionalUsdc, side, ticker }) => {
      const stock = getStockByTicker(ticker);
      if (!stock) {
        return errorResult(`Unknown ticker: ${ticker}`);
      }

      const resolvedSide = asSide(side);
      const notional = notionalUsdc ?? MinimumOrderUsdc;
      const quote = await loadTradeQuote(quoteArgsForStock(stock, resolvedSide, notional));

      return jsonResult({
        estimatedShares: quote.estimatedShares,
        feeUsdc: quote.feeUsdc,
        id: stock.id,
        midPrice: quote.midPrice,
        minShares: quote.minShares,
        name: stock.name,
        notionalUsdc: notional,
        quotePrice: quote.quotePrice,
        side: resolvedSide,
        slippagePercent: quote.slippagePercent,
        ticker: stock.ticker,
        tokenSymbol: stock.tokenSymbol,
      });
    },
  );

  server.registerTool(
    "get_wallet_status",
    {
      description: "Return SOL, stablecoin, and catalog token balances for the authenticated Privy Solana wallet.",
      title: "Get wallet status",
    },
    async () => {
      if (!context.walletAddress) {
        return errorResult("Authentication required. Send Authorization: Bearer <privy-token> or a privy-token cookie.");
      }

      const holdings = await loadWalletHoldings(context.walletAddress);
      return jsonResult({
        address: context.walletAddress,
        holdings: holdings.holdings,
        netWorthUsd: holdings.netWorthUsd,
      });
    },
  );

  server.registerTool(
    "prepare_trade",
    {
      description:
        "Prepare buy/sell advice for a catalog stock. Does not send a transaction. Returns a quote and a review URL for the user to confirm in the wallet.",
      inputSchema: {
        notionalUsdc: z.number().positive().describe("Order value in USDC."),
        side: z.enum(["buy", "sell"]).describe("Trade side."),
        ticker: z.string().describe("Stock ticker, e.g. AAPL."),
      },
      title: "Prepare trade",
    },
    async ({ notionalUsdc, side, ticker }) => {
      const stock = getStockByTicker(ticker);
      if (!stock) {
        return errorResult(`Unknown ticker: ${ticker}`);
      }

      if (notionalUsdc < MinimumOrderUsdc) {
        return errorResult(`Minimum order size is ${MinimumOrderUsdc} USDC.`);
      }

      const resolvedSide = asSide(side);
      const quote = await loadTradeQuote(quoteArgsForStock(stock, resolvedSide, notionalUsdc));
      const warnings = [
        "Settlement is not on-chain yet. The user must confirm in the buy/sell ticket; do not claim the trade was sent.",
      ];

      if (context.walletAddress) {
        const holdings = await loadWalletHoldings(context.walletAddress);
        const usdc = holdings.holdings.find((holding) => holding.symbol === "USDC");
        const usdcBalance = usdc ? parseHoldingQuantity(usdc.amount) : 0;

        if (resolvedSide === "buy" && notionalUsdc > usdcBalance) {
          warnings.push(`Amount exceeds available USDC (${usdcBalance}).`);
        }

        if (resolvedSide === "sell") {
          const held = holdings.holdings.find(
            (holding) => holding.symbol === stock.ticker || holding.id === stock.id,
          );
          if (!held) {
            warnings.push(`${stock.tokenSymbol} is not held on this Solana wallet.`);
          }
        }
      }

      const params = new URLSearchParams({
        amount: String(notionalUsdc),
        side: resolvedSide,
      });

      return jsonResult({
        estimatedShares: quote.estimatedShares,
        feeUsdc: quote.feeUsdc,
        midPrice: quote.midPrice,
        minShares: quote.minShares,
        name: stock.name,
        notionalUsdc,
        quotePrice: quote.quotePrice,
        reviewUrl: `/dashboard/stocks/${stock.id}?${params.toString()}`,
        side: resolvedSide,
        slippagePercent: quote.slippagePercent,
        status: "ready_for_user_review",
        ticker: stock.ticker,
        tokenSymbol: stock.tokenSymbol,
        warnings,
      });
    },
  );

  return server;
}
