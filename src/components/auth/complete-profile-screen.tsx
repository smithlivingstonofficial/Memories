"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  completeProfileAction,
  type CompleteProfileState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type CompleteProfileScreenProps = {
  email: string;
  initialProfile: {
    username?: string | null;
    fullName?: string | null;
    mobileNumber?: string | null;
    avatarUrl?: string | null;
  };
};

const initialState: CompleteProfileState = {
  message: "",
  errors: {},
};

const steps = [
  {
    title: "Identity",
    description: "Choose your public Memories identity.",
    icon: UserRound,
  },
  {
    title: "Contact",
    description: "Add your mobile number securely.",
    icon: Phone,
  },
  {
    title: "Password",
    description: "Create your email login password.",
    icon: LockKeyhole,
  },
  {
    title: "Finish",
    description: "Review and enter Memories.",
    icon: Check,
  },
];

export function CompleteProfileScreen({
  email,
  initialProfile,
}: CompleteProfileScreenProps) {
  const [state, formAction, pending] = useActionState(
    completeProfileAction,
    initialState
  );

  const [step, setStep] = useState(0);

  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [fullName, setFullName] = useState(initialProfile.fullName ?? "");
  const [mobileNumber, setMobileNumber] = useState(
    initialProfile.mobileNumber ?? ""
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [clientError, setClientError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const CurrentIcon = steps[step].icon;

  const initials =
    fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  const passwordRules = useMemo(
    () => [
      {
        label: "At least 8 characters",
        passed: password.length >= 8,
      },
      {
        label: "One uppercase letter",
        passed: /[A-Z]/.test(password),
      },
      {
        label: "One lowercase letter",
        passed: /[a-z]/.test(password),
      },
      {
        label: "One number",
        passed: /[0-9]/.test(password),
      },
      {
        label: "Passwords match",
        passed: password.length > 0 && password === confirmPassword,
      },
    ],
    [password, confirmPassword]
  );

  useEffect(() => {
    if (state.errors?.username || state.errors?.fullName) {
      setStep(0);
      return;
    }

    if (state.errors?.mobileNumber) {
      setStep(1);
      return;
    }

    if (state.errors?.password || state.errors?.confirmPassword) {
      setStep(2);
    }
  }, [state.errors]);

  function goNext() {
    setClientError("");

    if (step === 0) {
      if (username.trim().length < 3) {
        setClientError("Username must be at least 3 characters.");
        return;
      }

      if (fullName.trim().length < 2) {
        setClientError("Full name must be at least 2 characters.");
        return;
      }
    }

    if (step === 1) {
      if (mobileNumber.trim().length < 7) {
        setClientError("Enter a valid mobile number.");
        return;
      }
    }

    if (step === 2) {
      const failedRule = passwordRules.find((rule) => !rule.passed);

      if (failedRule) {
        setClientError("Create a strong password before continuing.");
        return;
      }
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setClientError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <AuthShell variant="centered">
      <div className="w-full rounded-[1.9rem] border border-white/70 bg-white/[0.9] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:p-7 lg:p-8">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center overflow-hidden rounded-[1.4rem] bg-[#6366F1] text-lg font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.3)]">
            {initialProfile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initialProfile.avatarUrl}
                alt="Profile avatar"
                className="size-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <Badge variant="privacy" className="mb-4 gap-2">
            <ShieldCheck size={14} />
            Google verified
          </Badge>

          <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[#0F172A] sm:text-[2.35rem]">
            Complete your profile
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Finish your Memories identity step by step.
          </p>

          <p className="mt-2 truncate text-xs font-medium text-slate-400">
            {email}
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              const isActive = index === step;
              const isDone = index < step;

              return (
                <div key={item.title} className="flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (index <= step) setStep(index);
                    }}
                    className={[
                      "flex size-9 items-center justify-center rounded-full border text-xs transition-all",
                      isActive
                        ? "border-[#6366F1] bg-[#6366F1] text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)]"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : "border-slate-200 bg-white text-slate-400",
                    ].join(" ")}
                  >
                    {isDone ? <Check size={15} /> : <StepIcon size={15} />}
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={[
                        "mx-2 h-px flex-1 rounded-full",
                        index < step ? "bg-[#6366F1]" : "bg-slate-200",
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-[1.35rem] border border-[#E7EAFF] bg-[#F6F8FF] p-4">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6366F1] shadow-sm">
                <CurrentIcon size={17} />
              </div>

              <div>
                <p className="font-brand text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
                  Step {step + 1}: {steps[step].title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {steps[step].description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form action={formAction}>
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="fullName" value={fullName} />
          <input type="hidden" name="mobileNumber" value={mobileNumber} />
          <input type="hidden" name="password" value={password} />
          <input type="hidden" name="confirmPassword" value={confirmPassword} />

          <div className="min-h-[230px]">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Input
                    label="Username"
                    type="text"
                    placeholder="smith_memories"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    hint="Lowercase letters, numbers, and underscore only."
                    className="h-12 text-[15px]"
                  />
                  <FieldError message={state.errors?.username?.[0]} />
                </div>

                <div>
                  <Input
                    label="Full name"
                    type="text"
                    placeholder="Smith Livingston"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 text-[15px]"
                  />
                  <FieldError message={state.errors?.fullName?.[0]} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Input
                    label="Mobile number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value)}
                    hint="Used for account security and recovery."
                    className="h-12 text-[15px]"
                  />
                  <FieldError message={state.errors?.mobileNumber?.[0]} />
                </div>

                <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex gap-3">
                    <Check
                      size={17}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <p className="text-xs leading-5 text-emerald-700">
                      Your contact details stay protected with user-level access
                      rules.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-[1.35rem] border border-[#E7EAFF] bg-[#F6F8FF] p-4">
                  <div className="flex gap-3">
                    <LockKeyhole
                      size={17}
                      className="mt-0.5 shrink-0 text-[#6366F1]"
                    />
                    <p className="text-xs leading-5 text-slate-600">
                      Create a password so you can login using your Google email
                      and password later.
                    </p>
                  </div>
                </div>

                <PasswordInput
                  label="Create password"
                  placeholder="Create a secure password"
                  value={password}
                  show={showPassword}
                  onChange={setPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
                <FieldError message={state.errors?.password?.[0]} />

                <PasswordInput
                  label="Confirm password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  show={showConfirmPassword}
                  onChange={setConfirmPassword}
                  onToggle={() => setShowConfirmPassword((value) => !value)}
                />
                <FieldError message={state.errors?.confirmPassword?.[0]} />

                <div className="grid gap-2 sm:grid-cols-2">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={[
                        "flex items-center gap-2 rounded-full px-3 py-2 text-xs",
                        rule.passed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      <Check size={13} />
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <ReviewRow label="Username" value={`@${username}`} />
                <ReviewRow label="Full name" value={fullName} />
                <ReviewRow label="Mobile" value={mobileNumber} />
                <ReviewRow label="Login email" value={email} />

                <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex gap-3">
                    <Check
                      size={17}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <p className="text-xs leading-5 text-emerald-700">
                      After this, your account supports both Google login and
                      email password login.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(clientError || state.message) && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
              <div className="flex gap-3">
                <Sparkles size={17} className="mt-0.5 shrink-0" />
                <p>{clientError || state.message}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}

            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                className="h-12 flex-[1.4] rounded-2xl text-[15px] font-semibold shadow-[0_16px_38px_rgba(99,102,241,0.24)]"
              >
                Continue
                <ArrowRight size={17} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="h-12 flex-[1.4] rounded-2xl text-[15px] font-semibold shadow-[0_16px_38px_rgba(99,102,241,0.24)]"
              >
                {pending ? "Saving profile..." : "Enter Memories"}
                {!pending && <ArrowRight size={17} />}
              </Button>
            )}
          </div>
        </form>
      </div>
    </AuthShell>
  );
}

function PasswordInput({
  label,
  placeholder,
  value,
  show,
  onChange,
  onToggle,
}: {
  label: string;
  placeholder: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-800">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 pr-12 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#6366F1]/40 focus:ring-4 focus:ring-[#6366F1]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-slate-200/70 bg-white/75 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="truncate text-sm font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-600">{message}</p>;
}