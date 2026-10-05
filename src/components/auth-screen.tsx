import Link from "next/link";

import { EmailAuthForm } from "@/components/email-auth-form";
import { HexLogo } from "@/components/hex-logo";

type AuthScreenProps = {
  mode: "login" | "signup";
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const isLogin = mode === "login";

  return (
    <main className="flex min-h-full flex-1 justify-center px-6 py-10">
      <div className="flex w-full max-w-md flex-col justify-center gap-4">
        <div className="flex items-center gap-2 text-primary-container">
          <HexLogo />
          <div>
            <p className="label-caps text-on-surface-variant">Access</p>
            <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
              {isLogin ? "Log in" : "Sign up"}
            </h1>
          </div>
        </div>

        <section className="rounded-lg border border-outline-variant bg-surface-container px-4 py-4">
          <EmailAuthForm mode={mode} />
        </section>

        <p className="text-sm text-on-surface-variant">
          {isLogin ? "Need an account? " : "Already have an account? "}
          <Link className="text-secondary underline decoration-secondary/40 underline-offset-4" href={isLogin ? "/signup" : "/login"}>
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </div>
    </main>
  );
}
