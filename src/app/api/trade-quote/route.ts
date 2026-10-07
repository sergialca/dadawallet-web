import { NextResponse } from "next/server";

import { loadTradeQuote } from "@/lib/trade-quote";
import type { OndoQuoteSide } from "@/constants/ondo";

function asSide(value: string | null): OndoQuoteSide {
  return value === "sell" ? "sell" : "buy";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const notional = Number(params.get("notional") ?? "0");

  try {
    const quote = await loadTradeQuote({
      mint: params.get("mint") ?? "",
      notionalUsdc: Number.isFinite(notional) ? notional : 0,
      side: asSide(params.get("side")),
      symbol: params.get("symbol") ?? "",
      ticker: params.get("ticker") ?? "",
    });
    return NextResponse.json(quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load quote";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
