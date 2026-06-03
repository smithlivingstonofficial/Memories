"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import {
  setVaultPinAction,
  verifyVaultPinAction,
  type VaultPinState,
} from "@/app/actions/vault";

const initialState: VaultPinState = {
  message: "",
  errors: {},
  success: false,
};

type VaultAccessScreenProps = {
  hasPasscode: boolean;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function VaultAccessScreen({
  hasPasscode,
  title,
  description,
  backHref = "/home",
  backLabel = "Back",
}: VaultAccessScreenProps) {
  const router = useRouter();
  const [setState, setAction, setPending] = useActionState(
    setVaultPinAction,
    initialState
  );
  const [unlockState, unlockAction, unlockPending] = useActionState(
    verifyVaultPinAction,
    initialState
  );
  const state = hasPasscode ? unlockState : setState;

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[720px] items-center justify-center">
      <section className="mem-card w-full rounded-[2rem] p-5 sm:p-7">
        <Link
          href={backHref}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </Link>

        <div className="mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
          {hasPasscode ? <LockKeyhole size={25} /> : <KeyRound size={25} />}
        </div>

        <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)]">
          {title ?? (hasPasscode ? "Unlock your Vault" : "Set your Vault PIN")}
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--app-muted)]">
          {description ??
            (hasPasscode
              ? "Enter your 6 digit PIN to view and edit Vault memories during this browser session."
              : "Create a 6 digit PIN for your whole Vault before saving or opening Vault memories. The PIN is never stored as plain text.")}
        </p>

        <form
          action={hasPasscode ? unlockAction : setAction}
          className="mt-6 space-y-4"
        >
          <PinInput
            name="pin"
            label={hasPasscode ? "Vault PIN" : "Create PIN"}
            error={state.errors?.pin?.[0]}
          />

          {!hasPasscode && (
            <PinInput
              name="confirmPin"
              label="Confirm PIN"
              error={state.errors?.confirmPin?.[0]}
            />
          )}

          {state.message && (
            <div
              className={`rounded-2xl border p-4 text-sm leading-6 ${
                state.success
                  ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-600"
                  : "border-rose-300/40 bg-rose-500/10 text-rose-500"
              }`}
            >
              {state.message}
            </div>
          )}

          <button
            type="submit"
            disabled={setPending || unlockPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(99,102,241,0.24)] transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
          >
            {setPending || unlockPending ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                {hasPasscode ? "Unlocking..." : "Setting PIN..."}
              </>
            ) : (
              <>
                <LockKeyhole size={17} />
                {hasPasscode ? "Unlock Vault" : "Set PIN and Unlock"}
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}

export function VaultAccessPanel({
  hasPasscode,
  title,
  description,
}: {
  hasPasscode: boolean;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [setState, setAction, setPending] = useActionState(
    setVaultPinAction,
    initialState
  );
  const [unlockState, unlockAction, unlockPending] = useActionState(
    verifyVaultPinAction,
    initialState
  );
  const state = hasPasscode ? unlockState : setState;

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          <LockKeyhole size={18} />
        </div>

        <div>
          <h3 className="font-brand text-base font-semibold tracking-[-0.03em] text-[var(--app-text)]">
            {title ?? (hasPasscode ? "Unlock Vault" : "Set Vault PIN")}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
            {description ??
              (hasPasscode
                ? "Enter your 6 digit PIN before saving this as a Vault memory."
                : "Create a 6 digit PIN before using Vault privacy.")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <PinInput
          name="pin"
          label={hasPasscode ? "Vault PIN" : "Create PIN"}
          error={state.errors?.pin?.[0]}
        />

        {!hasPasscode && (
          <PinInput
            name="confirmPin"
            label="Confirm PIN"
            error={state.errors?.confirmPin?.[0]}
          />
        )}

        {state.message && (
          <div
            className={`rounded-2xl border p-3 text-sm leading-6 ${
              state.success
                ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-600"
                : "border-rose-300/40 bg-rose-500/10 text-rose-500"
            }`}
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          formAction={hasPasscode ? unlockAction : setAction}
          disabled={setPending || unlockPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
        >
          {setPending || unlockPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {hasPasscode ? "Unlocking..." : "Setting PIN..."}
            </>
          ) : (
            <>
              <LockKeyhole size={16} />
              {hasPasscode ? "Unlock Vault" : "Set PIN and Unlock"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PinInput({
  name,
  label,
  error,
}: {
  name: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
        {label}
      </label>

      <input
        name={name}
        type="password"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        autoComplete="off"
        placeholder="000000"
        className="h-14 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-center font-brand text-2xl font-semibold tracking-[0.32em] text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)]"
      />

      {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}
