"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/login");
    }
  }, [authenticated, ready, router]);

  if (!ready || !authenticated) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center">
        <p className="label-caps text-on-surface-variant">Loading session</p>
      </main>
    );
  }

  return <>{children}</>;
}
