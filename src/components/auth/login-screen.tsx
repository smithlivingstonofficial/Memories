"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Sparkles,
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
      <div className="w-full rounded-[1.9rem] border border-white/70 bg-white/[0.9] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:p-7 lg:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.4rem] bg-[#6366F1] text-white shadow-[0_18px_42px_rgba(99,102,241,0.3)]">
            <Sparkles size={23} />
          </div>

          <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[#0F172A] sm:text-[2.35rem]">
            Welcome back
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Continue with Google or login using the password created after your
            Google verification.
          </p>
        </div>

        <form action={googleAuthAction}>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white text-sm font-semibold text-[#0F172A] shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] active:scale-[0.99]"
          >
            <span className="font-bold">G</span>
            Continue with Google
          </button>
        </form>

        <div className="my-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            or
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Input
              label="Google email address"
              name="email"
              type="email"
              placeholder="smith@example.com"
              autoComplete="email"
              className="h-12 text-[15px]"
            />
            <FieldError message={state.errors?.email?.[0]} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-800"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#6366F1] transition hover:text-[#4F46E5]"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Memories password"
                autoComplete="current-password"
                className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 pr-12 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#6366F1]/40 focus:ring-4 focus:ring-[#6366F1]/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <FieldError message={state.errors?.password?.[0]} />
          </div>

          {state.message && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
              {state.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-2xl text-[15px] font-semibold shadow-[0_16px_38px_rgba(99,102,241,0.24)]"
          >
            {pending ? "Logging in..." : "Login with email password"}
            {!pending && <ArrowRight size={17} />}
          </Button>
        </form>

        <div className="mt-5 rounded-[1.35rem] border border-[#E7EAFF] bg-[#F6F8FF] p-3.5">
          <div className="flex gap-3">
            <LockKeyhole size={17} className="mt-0.5 shrink-0 text-[#6366F1]" />
            <p className="text-xs leading-5 text-slate-600">
              Email password login works after Google verification and profile
              password setup.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          New to Memories?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#6366F1] transition hover:text-[#4F46E5]"
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