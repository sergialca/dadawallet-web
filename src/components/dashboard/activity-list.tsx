"use client";

import { AssetIcon } from "@/components/dashboard/asset-icon";
import { useWalletActivity } from "@/hooks/use-wallet-activity";
import type { ActivityKind, WalletActivity } from "@/lib/solana-activity";
import { shortenAddress } from "@/lib/wallet-address";

const KIND_LABEL: Record<ActivityKind, string> = {
  other: "Transaction",
  received: "Received",
  sent: "Sent",
  swap: "Swapped",
};

function formatWhen(blockTime: number | null) {
  if (blockTime == null) {
    return "Time pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(blockTime * 1000));
}

function ActivityRow({ activity }: { activity: WalletActivity }) {
  const title = activity.status === "failed" ? "Failed" : KIND_LABEL[activity.kind];

  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-outline-variant bg-surface-container px-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <AssetIcon symbol={activity.primarySymbol} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface">{title}</p>
          <p className="data-sm mt-0.5 text-on-surface-variant">{formatWhen(activity.blockTime)}</p>
          <a
            className="data-sm mt-1 inline-block text-secondary hover:text-on-surface"
            href={activity.explorerUrl}
            rel="noreferrer"
            target="_blank"
          >
            {shortenAddress(activity.signature)}
          </a>
        </div>
      </div>
      <div className="text-right">
        {activity.changes.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {activity.changes.map((change) => (
              <li
                className={`data-lg ${change.direction === "in" ? "text-success" : "text-on-surface"}`}
                key={`${activity.signature}-${change.symbol}-${change.direction}`}
              >
                {change.direction === "in" ? "+" : "−"}
                {change.amount} {change.symbol}
              </li>
            ))}
          </ul>
        ) : (
          <p className="data-sm text-on-surface-variant">No balance change</p>
        )}
      </div>
    </li>
  );
}

export function ActivityList() {
  const activity = useWalletActivity();

  if (activity.status === "error") {
    return <p className="text-sm text-on-surface-variant">{activity.message}</p>;
  }

  if (activity.status !== "ready") {
    return <p className="text-sm text-on-surface-variant">Loading activity</p>;
  }

  if (activity.data.activities.length === 0) {
    return <p className="text-sm text-on-surface-variant">No recent activity on this wallet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {activity.data.activities.map((item) => (
        <ActivityRow activity={item} key={item.signature} />
      ))}
    </ul>
  );
}
