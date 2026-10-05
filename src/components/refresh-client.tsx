"use client";

import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { safeRedirectPath } from "@/lib/safe-redirect";

function RefreshSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready } = usePrivy();

  useEffect(() => {
    if (!ready) {
      return;
    }

    const redirectTo = safeRedirectPath(searchParams.get("redirect_url"));

    async function refresh() {
      try {
        const token = await getAccessToken();
        router.replace(token ? redirectTo : "/login");
      } catch {
        router.replace("/login");
      }
    }

    void refresh();
  }, [ready, router, searchParams]);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center">
      <p className="label-caps text-on-surface-variant">Refreshing session</p>
    </main>
  );
}

export function RefreshClient() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full flex-1 items-center justify-center">
          <p className="label-caps text-on-surface-variant">Refreshing session</p>
        </main>
      }
    >
      <RefreshSession />
    </Suspense>
  );
}
