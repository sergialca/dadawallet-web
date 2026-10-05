"use client";

import { getAccessToken, useLoginWithEmail } from "@privy-io/react-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { isValidEmail } from "@/lib/email";

type EmailAuthMode = "login" | "signup";

function getPrivyErrorType(error: unknown) {
  if (error && typeof error === "object" && "type" in error && typeof error.type === "string") {
    return error.type;
  }

  return "";
}

function sendCodeErrorMessage(error: unknown, mode: EmailAuthMode) {
  const type = getPrivyErrorType(error);
  const message = error instanceof Error ? error.message : "";

  if (mode === "login" && (type === "user_does_not_exist" || /does not exist/i.test(message))) {
    return "No account exists for this email. Sign up to create one.";
  }

  if (type === "too_many_requests" || /too many/i.test(message)) {
    return "Too many code requests. Wait a few minutes and try again.";
  }

  return message || "Could not send a one-time password.";
}

export function EmailAuthForm({ mode }: { mode: EmailAuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSentCode, setHasSentCode] = useState(false);
  const { sendCode, loginWithCode, state } = useLoginWithEmail();

  const isSending = state.status === "sending-code";
  const isSubmitting = state.status === "submitting-code";
  const trimmedEmail = email.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const canSendCode = emailValid && !isSending && !isSubmitting;
  const canSubmit =
    hasSentCode && code.trim().length > 0 && !isSending && !isSubmitting;

  function onEmailChange(value: string) {
    setEmail(value);
    if (hasSentCode) {
      setHasSentCode(false);
      setCode("");
    }
  }

  async function onSendCode() {
    setErrorMessage(null);

    if (!emailValid) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    try {
      await sendCode({
        email: trimmedEmail,
        disableSignup: mode === "login",
      });
      setHasSentCode(true);
    } catch (error) {
      setHasSentCode(false);
      setErrorMessage(sendCodeErrorMessage(error, mode));
    }
  }

  async function onSubmit() {
    setErrorMessage(null);

    if (!emailValid) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    if (!code.trim()) {
      setErrorMessage("Enter the one-time password from your email.");
      return;
    }

    try {
      await loginWithCode({ code: code.trim() });
      await getAccessToken();
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (hasSentCode) {
          void onSubmit();
        } else {
          void onSendCode();
        }
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="label-caps text-on-surface-variant">Email</span>
        <input
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          className="border-0 border-b-2 border-outline bg-transparent px-0 py-2 text-base text-on-surface outline-none placeholder:text-outline focus:border-primary-container"
          inputMode="email"
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="Email"
          type="email"
          value={email}
        />
      </label>

      <button
        className="rounded border border-secondary px-4 py-3 text-sm font-semibold text-secondary transition enabled:hover:shadow-[0_0_16px_rgba(0,231,254,0.35)] disabled:opacity-50"
        disabled={!canSendCode}
        onClick={() => {
          void onSendCode();
        }}
        type="button"
      >
        {isSending ? "Sending…" : hasSentCode ? "Resend code" : "Send code"}
      </button>

      <label className="flex flex-col gap-2">
        <span className="label-caps text-on-surface-variant">Code</span>
        <input
          autoComplete="one-time-code"
          className="border-0 border-b-2 border-outline bg-transparent px-0 py-2 font-mono text-base tracking-[0.2em] text-on-surface outline-none placeholder:text-outline focus:border-primary-container disabled:opacity-40"
          disabled={!hasSentCode}
          inputMode="numeric"
          maxLength={6}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          value={code}
        />
      </label>

      <button
        className="rounded bg-primary-container px-4 py-3 text-sm font-semibold text-on-primary transition enabled:hover:shadow-[0_0_16px_rgba(0,231,254,0.45)] disabled:opacity-50"
        disabled={!canSubmit}
        type="submit"
      >
        {isSubmitting ? "Verifying…" : mode === "login" ? "Log in" : "Sign up"}
      </button>

      {errorMessage ? (
        <p className="text-sm text-error">
          {errorMessage}
          {mode === "login" && errorMessage.includes("Sign up") ? (
            <>
              {" "}
              <Link className="underline decoration-error/40 underline-offset-4" href="/signup">
                Go to sign up
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
