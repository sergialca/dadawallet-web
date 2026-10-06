import { NextResponse } from "next/server";

import { loadWalletHoldings } from "@/lib/solana-holdings";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
  }

  try {
    const holdings = await loadWalletHoldings(address);
    return NextResponse.json(holdings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load holdings";
    const status = message === "Invalid Solana address" ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
