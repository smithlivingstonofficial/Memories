"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  googleAuthAction,
  loginAction,
  type LoginFormState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginFormState = {
  message: "",
  errors: {},
};

export function LoginScreen() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthShell>
      <div className="mem-card w-full max-w-[460px] rounded-[1.5rem] p-4 sm:rounded-[1.8rem] sm:p-5">
        <div className="mb-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
                Secure login
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                Continue your private archive
              </p>
            </div>
          </div>

          <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-heading)] sm:text-[2.35rem]">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            Use Google verification or the password you created after signup.
          </p>
        </div>

        <form action={googleAuthAction}>
          <button
            type="submit"
            className="group flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#6366F1] hover:bg-[#F8FAFF] hover:text-slate-950 hover:shadow-[0_18px_46px_rgba(99,102,241,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6366F1]/18 active:translate-y-0 active:scale-[0.99] dark:border-slate-200 dark:bg-white dark:text-slate-900 dark:hover:border-[#6366F1] dark:hover:bg-[#F8FAFF] dark:hover:text-slate-950"
          >
            <GoogleLogo />
            <span className="min-w-0 truncate">Continue with Google</span>
          </button>
        </form>

        <div className="my-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--app-border)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-faint)]">
            or
          </span>
          <div className="h-px flex-1 bg-[var(--app-border)]" />
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Input
              label="Google email address"
              name="email"
              type="email"
              placeholder="smith@example.com"
              autoComplete="email"
              className="h-12 border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[15px] text-[var(--app-text)]"
            />
            <FieldError message={state.errors?.email?.[0]} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--app-text)]"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[var(--app-accent)] transition hover:text-[var(--app-accent-hover)]"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <KeyRound
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-faint)]"
              />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Memories password"
                autoComplete="current-password"
                className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-11 pr-12 text-[15px] text-[var(--app-text)] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)] focus:ring-4 focus:ring-[rgba(99,102,241,0.12)]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-faint)] transition hover:text-[var(--app-text)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <FieldError message={state.errors?.password?.[0]} />
          </div>

          {state.message && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              {state.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-2xl text-[15px] font-semibold"
          >
            {pending ? "Logging in..." : "Login with email password"}
            {!pending && <ArrowRight size={17} />}
          </Button>
        </form>

        <div className="mt-5 rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3.5">
          <div className="flex gap-3">
            <LockKeyhole
              size={17}
              className="mt-0.5 shrink-0 text-[var(--app-accent)]"
            />
            <p className="text-xs leading-5 text-[var(--app-muted)]">
              Email password login works after Google verification.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--app-muted)]">
          New to Memories?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--app-accent)] transition hover:text-[var(--app-accent-hover)]"
          >
            Create account with Google
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-600">{message}</p>;
}

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.52z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.88A6.01 6.01 0 0 1 6.1 12c0-.65.11-1.29.31-1.88V7.53H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.47l3.34-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.47 0 2.78.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.53l3.34 2.59C7.2 7.76 9.4 6 12 6z"
      />
    </svg>
  );
}
