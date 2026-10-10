import { describe, expect, it } from "vitest";

import { transactionsToActivity } from "@/lib/solana-activity";

const Owner = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const UsdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

describe("transactionsToActivity", () => {
  it("treats a fee-only SOL decrease as a received token transfer", () => {
    const [activity] = transactionsToActivity(Owner, [
      {
        blockTime: 1_700_000_000,
        meta: {
          err: null,
          fee: 5000,
          preBalances: [2_000_000, 0],
          postBalances: [1_995_000, 0],
          preTokenBalances: [],
          postTokenBalances: [
            {
              mint: UsdcMint,
              owner: Owner,
              uiTokenAmount: { amount: "10000000", decimals: 6 },
            },
          ],
        },
        transaction: {
          signatures: ["sig-receive"],
          message: {
            accountKeys: [{ pubkey: Owner }, { pubkey: "ata" }],
          },
        },
      },
    ]);

    expect(activity).toMatchObject({
      kind: "received",
      primarySymbol: "USDC",
      status: "success",
      changes: [{ symbol: "USDC", direction: "in", amount: "10" }],
    });
  });

  it("labels a SOL send that also pays the fee as sent", () => {
    const [activity] = transactionsToActivity(Owner, [
      {
        blockTime: 1_700_000_100,
        meta: {
          err: null,
          fee: 5000,
          preBalances: [50_000_000],
          postBalances: [39_995_000],
          preTokenBalances: [],
          postTokenBalances: [],
        },
        transaction: {
          signatures: ["sig-send"],
          message: { accountKeys: [Owner] },
        },
      },
    ]);

    expect(activity.kind).toBe("sent");
    expect(activity.changes).toEqual([
      expect.objectContaining({ symbol: "SOL", direction: "out", amount: "0.01" }),
    ]);
  });

  it("labels opposing token movements as a swap and keeps failed status", () => {
    const [activity] = transactionsToActivity(Owner, [
      {
        blockTime: null,
        meta: {
          err: { InstructionError: [0, "Custom"] },
          fee: 5000,
          preBalances: [1_000_000],
          postBalances: [995_000],
          preTokenBalances: [
            {
              mint: UsdcMint,
              owner: Owner,
              uiTokenAmount: { amount: "5000000", decimals: 6 },
            },
          ],
          postTokenBalances: [
            {
              mint: UsdcMint,
              owner: Owner,
              uiTokenAmount: { amount: "4000000", decimals: 6 },
            },
            {
              mint: "StockMint1111111111111111111111111111111111",
              owner: Owner,
              uiTokenAmount: { amount: "250000000000000000", decimals: 18 },
            },
          ],
        },
        transaction: {
          signatures: ["sig-swap"],
          message: { accountKeys: [{ pubkey: Owner }] },
        },
      },
    ]);

    expect(activity.status).toBe("failed");
    expect(activity.kind).toBe("swap");
    expect(activity.changes.map((change) => `${change.direction}:${change.symbol}:${change.amount}`)).toEqual([
      "out:USDC:1",
      "in:Stoc…1111:0.25",
    ]);
    expect(activity.explorerUrl).toBe("https://explorer.solana.com/tx/sig-swap?cluster=devnet");
  });
});
