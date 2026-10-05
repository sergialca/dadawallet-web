"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logout } = usePrivy();
  const router = useRouter();
  const email = user?.email?.address ?? "Authenticated";

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between border-b border-outline-variant pb-4">
        <div>
          <p className="label-caps text-on-surface-variant">Terminal</p>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Dashboard</h1>
        </div>
        <button
          className="rounded border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:shadow-[0_0_16px_rgba(0,231,254,0.35)]"
          onClick={() => {
            void onLogout();
          }}
          type="button"
        >
          Log out
        </button>
      </header>

      <section className="rounded-lg border border-outline-variant bg-surface-container p-4">
        <p className="label-caps text-on-surface-variant">Signed in</p>
        <p className="mt-2 font-mono text-lg text-on-surface">{email}</p>
      </section>
    </main>
  );
}
