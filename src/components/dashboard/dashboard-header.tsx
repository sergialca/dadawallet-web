"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { HexLogo } from "@/components/hex-logo";
import { getWalletAddress, shortenAddress } from "@/lib/wallet-address";

export function DashboardHeader() {
  const { user, logout } = usePrivy();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const address = getWalletAddress(user);

  async function onCopy() {
    if (!address) {
      return;
    }

    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Link className="flex items-center gap-2 text-primary-container" href="/dashboard">
          <HexLogo className="h-8 w-8" />
          <span className="text-lg font-bold tracking-[0.12em] text-on-surface">
            DADAWALLET
          </span>
        </Link>
        <span className="hidden h-4 w-px bg-outline-variant sm:block" />
        <nav className="hidden items-center gap-5 sm:flex">
          <Link className="label-caps text-on-surface-variant hover:text-on-surface" href="/dashboard/stocks">
            Stocks
          </Link>
          <Link className="label-caps text-on-surface-variant hover:text-on-surface" href="/dashboard/activity">
            Activity
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5">
          <span className="data-sm text-on-surface">
            {address ? shortenAddress(address) : "No wallet"}
          </span>
          <button
            className="label-caps text-secondary neon-bloom rounded px-1"
            disabled={!address}
            onClick={() => {
              void onCopy();
            }}
            type="button"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-sm font-semibold text-on-surface neon-bloom"
          onClick={() => {
            void onLogout();
          }}
          type="button"
        >
          {(user?.email?.address ?? "U").slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
}
