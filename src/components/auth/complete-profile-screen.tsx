"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  completeProfileAction,
  type CompleteProfileState,
} from "@/app/actions/auth";

type CompleteProfileScreenProps = {
  email: string;
  initialProfile: {
    username?: string | null;
    fullName?: string | null;
    mobileCountryCode?: string | null;
    mobileNumber?: string | null;
    dateOfBirth?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const initialState: CompleteProfileState = {
  message: "",
  errors: {},
};

const countryCodes = [
  { label: "India", code: "+91", flag: "🇮🇳" },
  { label: "United States", code: "+1", flag: "🇺🇸" },
  { label: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { label: "UAE", code: "+971", flag: "🇦🇪" },
  { label: "Australia", code: "+61", flag: "🇦🇺" },
  { label: "Singapore", code: "+65", flag: "🇸🇬" },
];

const steps = [
  {
    title: "Identity",
    shortTitle: "Identity",
    description: "Choose your username and display name.",
    icon: UserRound,
  },
  {
    title: "Birth date",
    shortTitle: "Birth",
    description: "Private diary personalization.",
    icon: CalendarDays,
  },
  {
    title: "Contact",
    shortTitle: "Contact",
    description: "Secure mobile number.",
    icon: Phone,
  },
  {
    title: "Profile",
    shortTitle: "Profile",
    description: "Optional avatar and bio.",
    icon: Camera,
  },
  {
    title: "Password",
    shortTitle: "Security",
    description: "Create email login password.",
    icon: LockKeyhole,
  },
  {
    title: "Review",
    shortTitle: "Finish",
    description: "Confirm and enter Memories.",
    icon: Check,
  },
];

export function CompleteProfileScreen({
  email,
  initialProfile,
}: CompleteProfileScreenProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [state, formAction, pending] = useActionState(
    completeProfileAction,
    initialState
  );

  const errors = state.errors as Record<string, string[] | undefined> | undefined;

  const [step, setStep] = useState(0);
  const [clientError, setClientError] = useState("");

  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [fullName, setFullName] = useState(initialProfile.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    initialProfile.dateOfBirth ?? ""
  );
  const [mobileCountryCode, setMobileCountryCode] = useState(
    initialProfile.mobileCountryCode ?? "+91"
  );
  const [mobileNumber, setMobileNumber] = useState(
    initialProfile.mobileNumber ?? ""
  );
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [avatarPreview, setAvatarPreview] = useState(
    initialProfile.avatarUrl ?? ""
  );
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [usernameStatus, setUsernameStatus] =
    useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const CurrentIcon = steps[step].icon;
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const initials =
    fullName
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  const passwordRules = useMemo(
    () => [
      { label: "8+ characters", passed: password.length >= 8 },
      { label: "Uppercase", passed: /[A-Z]/.test(password) },
      { label: "Lowercase", passed: /[a-z]/.test(password) },
      { label: "Number", passed: /[0-9]/.test(password) },
      {
        label: "Match",
        passed: password.length > 0 && password === confirmPassword,
      },
    ],
    [password, confirmPassword]
  );

  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Use 3–24 lowercase letters, numbers, or underscore.");
      return;
    }

    const controller = new AbortController();

    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(
            cleanUsername
          )}`,
          { signal: controller.signal }
        );

        const result = (await response.json()) as {
          available: boolean;
          message: string;
        };

        setUsernameStatus(result.available ? "available" : "taken");
        setUsernameMessage(result.message);
      } catch {
        if (!controller.signal.aborted) {
          setUsernameStatus("idle");
          setUsernameMessage("Unable to check now.");
        }
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [username]);

  useEffect(() => {
    if (errors?.username || errors?.fullName) {
      setStep(0);
      return;
    }

    if (errors?.dateOfBirth) {
      setStep(1);
      return;
    }

    if (errors?.mobileNumber || errors?.mobileCountryCode) {
      setStep(2);
      return;
    }

    if (errors?.bio || errors?.avatarFile) {
      setStep(3);
      return;
    }

    if (errors?.password || errors?.confirmPassword) {
      setStep(4);
    }
  }, [errors]);

  function goNext() {
    setClientError("");

    if (step === 0) {
      if (!/^[a-z0-9_]{3,24}$/.test(username.trim())) {
        setClientError("Please enter a valid username.");
        return;
      }

      if (usernameStatus === "taken") {
        setClientError("This username is already taken.");
        return;
      }

      if (usernameStatus === "checking") {
        setClientError("Please wait until username check is completed.");
        return;
      }

      if (fullName.trim().length < 2) {
        setClientError("Full name must be at least 2 characters.");
        return;
      }
    }

    if (step === 1) {
      if (!dateOfBirth) {
        setClientError("Please select your date of birth.");
        return;
      }

      if (new Date(dateOfBirth) > new Date()) {
        setClientError("Date of birth cannot be in the future.");
        return;
      }
    }

    if (step === 2) {
      if (!/^[0-9]{6,15}$/.test(mobileNumber.trim())) {
        setClientError("Enter a valid mobile number without spaces.");
        return;
      }
    }

    if (step === 4) {
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

  function handleAvatarChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setClientError("Please choose a valid image file.");
      return;
    }

    setAvatarFailed(false);
    setAvatarPreview(URL.createObjectURL(file));
  }

  return (
    <main className="h-[100svh] overflow-hidden bg-[#f8fafc] text-[#0f172a]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(99,102,241,0.10),transparent_30%),radial-gradient(circle_at_88%_88%,rgba(255,228,230,0.70),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f8fafc_52%,#f8fafc_100%)]" />

      <section className="mx-auto flex h-full w-full max-w-[1180px] items-center justify-center p-3 sm:p-5 lg:p-6">
        <form
          action={formAction}
          className="grid h-full max-h-[780px] w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/[0.92] shadow-[0_32px_110px_rgba(15,23,42,0.11)] backdrop-blur-2xl lg:grid-cols-[360px_minmax(0,1fr)]"
        >
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="fullName" value={fullName} />
          <input
            type="hidden"
            name="mobileCountryCode"
            value={mobileCountryCode}
          />
          <input type="hidden" name="mobileNumber" value={mobileNumber} />
          <input type="hidden" name="dateOfBirth" value={dateOfBirth} />
          <input type="hidden" name="bio" value={bio} />
          <input
            type="hidden"
            name="existingAvatarUrl"
            value={initialProfile.avatarUrl ?? ""}
          />
          <input type="hidden" name="password" value={password} />
          <input type="hidden" name="confirmPassword" value={confirmPassword} />

          <input
            ref={avatarInputRef}
            type="file"
            name="avatarFile"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleAvatarChange(event.target.files?.[0] ?? null)
            }
          />

          <aside className="hidden h-full flex-col border-r border-slate-100 bg-[#f8faff]/90 p-6 lg:flex">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-[#6366f1] font-brand text-xl font-semibold text-white shadow-[0_18px_48px_rgba(99,102,241,0.28)]"
                aria-label="Choose profile picture"
              >
                {avatarPreview && !avatarFailed ? (
                  <img
                    src={avatarPreview}
                    alt={fullName || "Profile image"}
                    onError={() => setAvatarFailed(true)}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}

                <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                  <Camera size={18} />
                </span>
              </button>

              <div className="min-w-0">
                <p className="font-brand text-lg font-semibold tracking-[-0.04em]">
                  Memories
                </p>
                <p className="truncate text-xs font-medium text-slate-500">
                  {email}
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-[1.5rem] border border-[#e7eaff] bg-white/75 p-4 shadow-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#6366f1]">
                <ShieldCheck size={13} />
                Google verified
              </span>

              <h1 className="mt-4 font-brand text-3xl font-semibold leading-[1.02] tracking-[-0.065em]">
                Complete your profile
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Step-by-step setup for your private diary and social memory
                space.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              {steps.map((item, index) => {
                const StepIcon = item.icon;
                const active = index === step;
                const done = index < step;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      if (index <= step) setStep(index);
                    }}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                      active
                        ? "bg-[#6366f1] text-white shadow-[0_16px_34px_rgba(99,102,241,0.22)]"
                        : done
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-white/70 text-slate-500 hover:bg-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        active
                          ? "bg-white/20"
                          : done
                            ? "bg-emerald-100"
                            : "bg-slate-100",
                      ].join(" ")}
                    >
                      {done ? <Check size={15} /> : <StepIcon size={15} />}
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {item.title}
                      </span>
                      <span
                        className={[
                          "block truncate text-xs",
                          active ? "text-white/72" : "text-slate-400",
                        ].join(" ")}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#6366f1] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </aside>

          <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-rows-[auto_minmax(0,1fr)]">
            <header className="border-b border-slate-100 px-4 py-4 sm:px-6 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-[#6366f1] font-brand text-lg font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.25)]"
                  aria-label="Choose profile picture"
                >
                  {avatarPreview && !avatarFailed ? (
                    <img
                      src={avatarPreview}
                      alt={fullName || "Profile image"}
                      onError={() => setAvatarFailed(true)}
                      className="size-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-semibold text-[#6366f1]">
                    <ShieldCheck size={12} />
                    Verified
                  </span>

                  <h1 className="mt-1 font-brand text-xl font-semibold tracking-[-0.05em]">
                    Complete profile
                  </h1>

                  <p className="truncate text-[11px] font-medium text-slate-400">
                    {email}
                  </p>
                </div>

                <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs font-semibold text-[#6366f1]">
                  {step + 1}/{steps.length}
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#6366f1] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </header>

            <header className="hidden border-b border-slate-100 bg-white/70 px-8 py-5 lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#6366f1]">
                  <CurrentIcon size={19} />
                </div>

                <div>
                  <p className="font-brand text-xl font-semibold tracking-[-0.04em] text-[#0f172a]">
                    {steps[step].title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {steps[step].description}
                  </p>
                </div>
              </div>

              <ActionButtons
                step={step}
                totalSteps={steps.length}
                pending={pending}
                onBack={goBack}
                onNext={goNext}
                compact
              />
            </header>

            <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div className="mb-5 rounded-[1.45rem] border border-[#e7eaff] bg-[#f6f8ff]/80 p-4 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6366f1] shadow-sm">
                    <CurrentIcon size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-brand text-base font-semibold tracking-[-0.03em] text-[#0f172a]">
                      {steps[step].title}
                    </p>
                    <p className="text-sm leading-5 text-slate-500">
                      {steps[step].description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mx-auto max-w-[820px] rounded-[1.8rem] border border-slate-100 bg-white/65 p-4 shadow-sm sm:p-5 lg:p-6">
                {step === 0 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <TextInput
                        label="Username"
                        value={username}
                        placeholder="smith_memories"
                        onChange={(value) =>
                          setUsername(
                            value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                          )
                        }
                      />

                      <UsernameStatusView
                        status={usernameStatus}
                        message={usernameMessage}
                      />

                      <FieldError message={errors?.username?.[0]} />
                    </div>

                    <div>
                      <TextInput
                        label="Full name"
                        value={fullName}
                        placeholder="Smith Livingston"
                        onChange={setFullName}
                      />

                      <FieldError message={errors?.fullName?.[0]} />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-800">
                        Date of birth
                      </label>

                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(event) => setDateOfBirth(event.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-[15px] text-slate-900 outline-none transition focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#6366f1]/10"
                      />

                      <FieldError message={errors?.dateOfBirth?.[0]} />
                    </div>

                    <InfoBox text="Your birth date is private and helps personalize diary memories." />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-800">
                        Country
                      </label>

                      <select
                        value={mobileCountryCode}
                        onChange={(event) =>
                          setMobileCountryCode(event.target.value)
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-[15px] text-slate-900 outline-none transition focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#6366f1]/10"
                      >
                        {countryCodes.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <TextInput
                        label="Mobile number"
                        value={mobileNumber}
                        placeholder="9876543210"
                        inputMode="numeric"
                        onChange={(value) =>
                          setMobileNumber(value.replace(/[^0-9]/g, ""))
                        }
                      />

                      <FieldError message={errors?.mobileNumber?.[0]} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex min-h-36 w-full flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-center transition hover:border-[#6366f1]/50 hover:bg-[#f6f8ff]"
                    >
                      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#6366f1]">
                        <Camera size={20} />
                      </div>

                      <p className="text-sm font-semibold text-slate-800">
                        Choose photo
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Optional
                      </p>
                    </button>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-800">
                        Bio{" "}
                        <span className="text-xs font-normal text-slate-400">
                          Optional
                        </span>
                      </label>

                      <textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        maxLength={180}
                        rows={5}
                        placeholder="Write a short line about your memories..."
                        className="w-full resize-none rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#6366f1]/10"
                      />

                      <p className="mt-2 text-xs text-slate-400">
                        {bio.length}/180
                      </p>

                      <FieldError message={errors?.bio?.[0]} />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <PasswordInput
                          label="Create password"
                          placeholder="Create password"
                          value={password}
                          show={showPassword}
                          onChange={setPassword}
                          onToggle={() => setShowPassword((value) => !value)}
                        />
                        <FieldError message={errors?.password?.[0]} />
                      </div>

                      <div>
                        <PasswordInput
                          label="Confirm password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          show={showConfirmPassword}
                          onChange={setConfirmPassword}
                          onToggle={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                        />
                        <FieldError message={errors?.confirmPassword?.[0]} />
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-5">
                      {passwordRules.map((rule) => (
                        <div
                          key={rule.label}
                          className={[
                            "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium",
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

                {step === 5 && (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <ReviewRow label="Username" value={`@${username}`} />
                    <ReviewRow label="Full name" value={fullName} />
                    <ReviewRow label="Date of birth" value={dateOfBirth} />
                    <ReviewRow
                      label="Mobile"
                      value={`${mobileCountryCode} ${mobileNumber}`}
                    />
                    <ReviewRow label="Login email" value={email} />
                    <ReviewRow
                      label="Bio"
                      value={bio.trim() ? bio.trim() : "Skipped"}
                    />
                  </div>
                )}
              </div>

              {(clientError || state.message) && (
                <div className="mx-auto mt-5 max-w-[820px] rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
                  <div className="flex gap-3">
                    <Sparkles size={17} className="mt-0.5 shrink-0" />
                    <p>{clientError || state.message}</p>
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-100 bg-white/80 px-4 py-3 sm:px-6 lg:hidden">
              <ActionButtons
                step={step}
                totalSteps={steps.length}
                pending={pending}
                onBack={goBack}
                onNext={goNext}
              />
            </footer>
          </section>
        </form>
      </section>
    </main>
  );
}

function ActionButtons({
  step,
  totalSteps,
  pending,
  compact = false,
  onBack,
  onNext,
}: {
  step: number;
  totalSteps: number;
  pending: boolean;
  compact?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const isLastStep = step === totalSteps - 1;

  return (
    <div className={compact ? "flex gap-3" : "flex w-full gap-3"}>
      {step > 0 && (
        <button
          type="button"
          onClick={onBack}
          className={[
            "flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50",
            compact ? "h-11 px-5" : "h-12 flex-1",
          ].join(" ")}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      )}

      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          className={[
            "flex items-center justify-center gap-2 rounded-2xl bg-[#6366f1] text-[15px] font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[#5558e8]",
            compact ? "h-11 px-6" : "h-12 flex-[1.5]",
          ].join(" ")}
        >
          Continue
          <ArrowRight size={17} />
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className={[
            "flex items-center justify-center gap-2 rounded-2xl bg-[#6366f1] text-[15px] font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-60",
            compact ? "h-11 px-6" : "h-12 flex-[1.5]",
          ].join(" ")}
        >
          {pending ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Enter Memories
              <ArrowRight size={17} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  inputMode?: "text" | "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-800">
        {label}
      </label>

      <input
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#6366f1]/10"
      />
    </div>
  );
}

function UsernameStatusView({
  status,
  message,
}: {
  status: UsernameStatus;
  message: string;
}) {
  if (!message) {
    return (
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Lowercase letters, numbers, and underscore only.
      </p>
    );
  }

  const tone =
    status === "available"
      ? "text-emerald-600"
      : status === "checking"
        ? "text-slate-500"
        : "text-rose-600";

  return (
    <p className={`mt-2 flex items-center gap-2 text-xs font-medium ${tone}`}>
      {status === "checking" ? (
        <Loader2 size={13} className="animate-spin" />
      ) : status === "available" ? (
        <Check size={13} />
      ) : (
        <Sparkles size={13} />
      )}
      {message}
    </p>
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
          className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 pr-12 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#6366f1]/10"
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
      <p className="truncate text-sm font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[#e7eaff] bg-[#f6f8ff] p-4 text-slate-600">
      <div className="flex gap-3">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#6366f1]" />
        <p className="text-xs leading-5">{text}</p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-rose-600">{message}</p>;
}