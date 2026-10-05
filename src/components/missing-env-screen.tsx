import Link from "next/link";

export function MissingEnvScreen() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6">
      <section className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-container p-6">
        <p className="label-caps text-on-surface-variant">Configuration</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface">
          Missing Privy environment
        </h1>
        <p className="mt-3 text-base leading-6 text-on-surface-variant">
          Copy <code className="font-mono text-secondary">.env.example</code> to{" "}
          <code className="font-mono text-secondary">.env.local</code> and set{" "}
          <code className="font-mono text-secondary">NEXT_PUBLIC_PRIVY_APP_ID</code>. Restart the
          dev server after changing env vars.
        </p>
        <p className="mt-4 text-sm text-on-surface-variant">
          See{" "}
          <Link
            className="text-secondary underline decoration-secondary/40 underline-offset-4"
            href="https://docs.privy.io/basics/react/setup"
          >
            Privy React setup
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
