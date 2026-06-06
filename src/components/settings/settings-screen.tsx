"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  LogOut,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import {
  useTheme,
  type ThemePreference,
} from "@/components/theme/theme-provider";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type SettingsScreenProps = {
  profile: {
    fullName: string;
    username: string;
    bio: string | null;
    accountVisibility: "public" | "private";
    avatarUrl: string | null;
  };
};

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function SettingsScreen({ profile }: SettingsScreenProps) {
  const { preference, setTheme } = useTheme();

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-4 sm:space-y-5">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-2xl sm:rounded-[1.8rem] sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(255,228,230,0.24),transparent_34%)]" />

          <div className="relative flex items-center gap-3">
            <ProfileAvatar profile={profile} />

            <div className="min-w-0">
              <h1 className="font-brand truncate text-2xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
                Settings
              </h1>
              <p className="truncate text-sm text-[var(--app-muted)]">
                @{profile.username}
              </p>
            </div>
          </div>
        </div>

        <section className="mem-card rounded-[1.5rem] p-3.5 sm:rounded-[1.8rem] sm:p-5">
          <div className="mb-3 flex items-center gap-3 sm:mb-4">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)] sm:size-10">
              <Palette size={17} />
            </div>

            <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Theme
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = preference === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border px-2 text-center transition sm:h-12 sm:px-4",
                    active
                      ? "border-[var(--app-accent)] bg-[var(--app-soft)] text-[var(--app-accent)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                  )}
                >
                  <Icon size={17} />
                  <span className="truncate text-xs font-semibold sm:text-sm">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <SettingsLink
            href="/settings/profile"
            icon={UserRound}
            title="Profile settings"
            value={profile.accountVisibility === "private" ? "Private" : "Public"}
          />
          <SettingsLink
            href="/requests"
            icon={ShieldCheck}
            title="Follow requests"
            value="Requests"
          />
          <SettingsLink
            href="/settings/security"
            icon={KeyRound}
            title="Security"
            value="Passwords"
          />
          <SettingsLink
            href="/vault"
            icon={LockKeyhole}
            title="Vault"
            value="Private"
          />
          <SettingsLink
            href="/messages"
            icon={Bell}
            title="Messages"
            value="Inbox"
          />
        </section>
      </section>

      <aside className="space-y-4 sm:space-y-5">
        <div className="mem-card rounded-[1.5rem] p-3.5 sm:rounded-[1.8rem] sm:p-5">
          <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Account
          </h2>

          <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3">
            <InfoRow label="Name" value={profile.fullName} />
            <InfoRow label="Username" value={`@${profile.username}`} />
            <InfoRow
              label="Visibility"
              value={
                profile.accountVisibility === "private" ? "Private" : "Public"
              }
            />
          </div>

          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/15 active:scale-[0.99] dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
            >
              <LogOut size={17} />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

function ProfileAvatar({ profile }: { profile: SettingsScreenProps["profile"] }) {
  if (profile.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt={profile.fullName}
        className="size-12 shrink-0 rounded-2xl object-cover sm:size-14"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-semibold text-[var(--app-accent)] sm:size-14">
      {profile.fullName[0] ?? "M"}
    </div>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  title,
  value,
}: {
  href: string;
  icon: typeof UserRound;
  title: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="mem-card flex min-h-[76px] items-center justify-between rounded-[1.5rem] p-3.5 transition hover:border-[var(--app-accent)] sm:min-h-[88px] sm:rounded-[1.7rem] sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)] sm:size-10">
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[var(--app-text)]">
            {title}
          </h3>
          <p className="mt-1 truncate text-xs text-[var(--app-muted)]">
            {value}
          </p>
        </div>
      </div>

      <ChevronRight size={18} className="shrink-0 text-[var(--app-muted)]" />
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2.5 sm:rounded-2xl sm:p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)] sm:text-[10px] sm:tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}
