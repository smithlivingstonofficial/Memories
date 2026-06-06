"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { googleAuthAction } from "@/app/actions/auth";

export function SignupScreen() {
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
                Google verified
              </p>
              <p className="truncate text-xs text-[var(--app-muted)]">
                Start with a trusted identity check
              </p>
            </div>
          </div>

          <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-heading)] sm:text-[2.35rem]">
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            Verify with Google, then finish your Memories profile and password.
          </p>
        </div>

        <form action={googleAuthAction}>
          <button
            type="submit"
            className="group flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#6366F1] hover:bg-[#F8FAFF] hover:text-slate-950 hover:shadow-[0_18px_46px_rgba(99,102,241,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6366F1]/18 active:translate-y-0 active:scale-[0.99] dark:border-slate-200 dark:bg-white dark:text-slate-900 dark:hover:border-[#6366F1] dark:hover:bg-[#F8FAFF] dark:hover:text-slate-950"
          >
            <GoogleLogo />
            <span className="min-w-0 truncate">Sign up with Google</span>
            <ArrowRight
              size={17}
              className="shrink-0 transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </form>

        <div className="mt-5 grid gap-3">
          <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3.5">
            <div className="flex gap-3">
              <LockKeyhole
                size={17}
                className="mt-0.5 shrink-0 text-[var(--app-accent)]"
              />
              <p className="text-xs leading-5 text-[var(--app-muted)]">
                Google is used only to verify your account before profile setup.
              </p>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3.5">
            <div className="flex gap-3">
              <KeyRound
                size={17}
                className="mt-0.5 shrink-0 text-[#4F46E5] dark:text-[#A5B4FC]"
              />
              <p className="text-xs font-medium leading-5 text-[var(--app-heading)] ">
                You will create a password for future email login.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[1.25rem] border border-emerald-300 bg-emerald-50 p-3.5 shadow-[0_12px_30px_rgba(16,185,129,0.08)] dark:border-emerald-400/40 dark:bg-emerald-500/12">
          <div className="flex gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300"
            />
            <p className="text-xs font-semibold leading-5 text-[var(--app-heading)]">
              Your Google email becomes your secure Memories login email.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--app-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--app-accent)] transition hover:text-[var(--app-accent-hover)]"
          >
            Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
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
