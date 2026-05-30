"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { googleAuthAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";

export function SignupScreen() {
  return (
    <AuthShell>
      <div className="w-full rounded-[1.9rem] border border-white/70 bg-white/[0.9] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:p-7 lg:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.4rem] bg-[#6366F1] text-white shadow-[0_18px_42px_rgba(99,102,241,0.3)]">
            <Sparkles size={23} />
          </div>

          <Badge variant="privacy" className="mb-4 gap-2">
            <ShieldCheck size={14} />
            Google verified signup
          </Badge>

          <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[#0F172A] sm:text-[2.35rem]">
            Create your account
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Verify your identity with Google first. Then create your Memories
            password during profile setup.
          </p>
        </div>

        <form action={googleAuthAction}>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white text-sm font-semibold text-[#0F172A] shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] active:scale-[0.99]"
          >
            <span className="font-bold">G</span>
            Sign up with Google
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="mt-5 rounded-[1.35rem] border border-[#E7EAFF] bg-[#F6F8FF] p-3.5">
          <div className="flex gap-3">
            <LockKeyhole size={17} className="mt-0.5 shrink-0 text-[#6366F1]" />
            <p className="text-xs leading-5 text-slate-600">
              Google is used only to verify your account. After signup, you will
              create a secure password for email login.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-emerald-100 bg-emerald-50/80 p-3.5">
          <div className="flex gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-emerald-600"
            />
            <p className="text-xs leading-5 text-emerald-700">
              Your Google email becomes your secure Memories login email.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#6366F1] transition hover:text-[#4F46E5]"
          >
            Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}