import { NextResponse } from "next/server";

import { loadWalletActivity } from "@/lib/solana-activity";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
  }

  try {
    const activity = await loadWalletActivity(address);
    return NextResponse.json(activity);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load activity";
    const status = message === "Invalid Solana address" ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
