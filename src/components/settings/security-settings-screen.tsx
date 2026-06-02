"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import {
  changeAccountPasswordAction,
  resetVaultPinWithAccountPasswordAction,
  startAccountPasswordGoogleVerificationAction,
  type PasswordChangeState,
  type VaultPinResetState,
} from "@/app/actions/security";

const initialPasswordState: PasswordChangeState = {
  message: "",
  errors: {},
};

const initialVaultState: VaultPinResetState = {
  message: "",
  errors: {},
};

type SecuritySettingsScreenProps = {
  email: string;
  accountVerification: {
    isVerified: boolean;
    expiresAt: string | null;
  };
  statusMessage?: string;
};

export function SecuritySettingsScreen({
  email,
  accountVerification,
  statusMessage,
}: SecuritySettingsScreenProps) {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changeAccountPasswordAction,
    initialPasswordState
  );
  const [vaultState, vaultAction, vaultPending] = useActionState(
    resetVaultPinWithAccountPasswordAction,
    initialVaultState
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordRules = useMemo(
    () => [
      { label: "8+ characters", passed: password.length >= 8 },
      { label: "Uppercase", passed: /[A-Z]/.test(password) },
      { label: "Lowercase", passed: /[a-z]/.test(password) },
      { label: "Number", passed: /[0-9]/.test(password) },
      {
        label: "Passwords match",
        passed: password.length > 0 && password === confirmPassword,
      },
    ],
    [password, confirmPassword]
  );

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-5">
      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <ShieldCheck size={14} />
              Security
            </p>
            <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              Password and Vault protection.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
              Account password changes require your Google account. Vault PIN reset requires your account password.
            </p>
          </div>

          <div className="rounded-[1.3rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
              Account
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">
              {email}
            </p>
          </div>
        </div>

        {statusMessage && (
          <p className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 text-sm leading-6 text-[var(--app-muted)]">
            {statusMessage}
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="mem-card rounded-[2rem] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
              <KeyRound size={19} />
            </div>
            <div>
              <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Account password
              </h2>
              <p className="text-xs text-[var(--app-muted)]">
                Verify Google before setting a new password.
              </p>
            </div>
          </div>

          <form action={startAccountPasswordGoogleVerificationAction}>
            <button
              type="submit"
              className="mb-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
            >
              <ShieldCheck size={16} />
              Verify with Google
            </button>
          </form>

          <div className="mb-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 text-xs leading-5 text-[var(--app-muted)]">
            {accountVerification.isVerified ? (
              <span className="inline-flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={14} />
                Google verified. You can set a new password now.
              </span>
            ) : (
              "Google verification is required before this form can update your password."
            )}
          </div>

          <form action={passwordAction} className="space-y-4">
            <PasswordInput
              label="New password"
              name="password"
              value={password}
              onChange={setPassword}
              disabled={!accountVerification.isVerified || passwordPending}
              error={passwordState.errors?.password?.[0]}
            />
            <PasswordInput
              label="Confirm new password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={!accountVerification.isVerified || passwordPending}
              error={passwordState.errors?.confirmPassword?.[0]}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              {passwordRules.map((rule) => (
                <span
                  key={rule.label}
                  className={
                    rule.passed
                      ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600"
                      : "rounded-full bg-[var(--app-surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]"
                  }
                >
                  {rule.label}
                </span>
              ))}
            </div>

            {passwordState.message && (
              <FormMessage
                message={passwordState.message}
                success={passwordState.success}
              />
            )}

            <button
              type="submit"
              disabled={!accountVerification.isVerified || passwordPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordPending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Updating
                </>
              ) : (
                "Update account password"
              )}
            </button>
          </form>
        </section>

        <section className="mem-card rounded-[2rem] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
              <LockKeyhole size={19} />
            </div>
            <div>
              <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Vault PIN
              </h2>
              <p className="text-xs text-[var(--app-muted)]">
                Reset using your account password.
              </p>
            </div>
          </div>

          <form action={vaultAction} className="space-y-4">
            <PasswordInput
              label="Account password"
              name="accountPassword"
              autoComplete="current-password"
              error={vaultState.errors?.accountPassword?.[0]}
              disabled={vaultPending}
            />
            <PasswordInput
              label="New 6 digit Vault PIN"
              name="pin"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              error={vaultState.errors?.pin?.[0]}
              disabled={vaultPending}
            />
            <PasswordInput
              label="Confirm Vault PIN"
              name="confirmPin"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              error={vaultState.errors?.confirmPin?.[0]}
              disabled={vaultPending}
            />

            {vaultState.message && (
              <FormMessage
                message={vaultState.message}
                success={vaultState.success}
              />
            )}

            <button
              type="submit"
              disabled={vaultPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {vaultPending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Resetting
                </>
              ) : (
                "Reset Vault PIN"
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
  error,
  disabled,
  inputMode,
  maxLength,
  autoComplete = "new-password",
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  inputMode?: "numeric";
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
        {label}
      </label>
      <input
        name={name}
        type="password"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        disabled={disabled}
        className="mem-input h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)] disabled:opacity-60"
      />
      {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}

function FormMessage({
  message,
  success,
}: {
  message: string;
  success?: boolean;
}) {
  return (
    <p
      className={
        success
          ? "rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-600"
          : "rounded-2xl border border-rose-300/40 bg-rose-500/10 p-3 text-sm leading-6 text-rose-500"
      }
    >
      {message}
    </p>
  );
}
