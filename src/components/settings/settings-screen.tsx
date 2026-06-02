"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  KeyRound,
  LockKeyhole,
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
    <div className="mx-auto grid w-full max-w-[1320px] gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-4">
        <div className="mem-card rounded-[1.7rem] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <ProfileAvatar profile={profile} />

            <div className="min-w-0">
              <h1 className="font-brand truncate text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
                Settings
              </h1>
              <p className="truncate text-sm text-[var(--app-muted)]">
                @{profile.username}
              </p>
            </div>
          </div>
        </div>

        <section className="mem-card rounded-[1.7rem] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
              <Palette size={18} />
            </div>

            <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
              Theme
            </h2>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = preference === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex h-14 items-center gap-3 rounded-2xl border px-4 text-left transition",
                    active
                      ? "border-[var(--app-accent)] bg-[var(--app-soft)] text-[var(--app-accent)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
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

      <aside className="space-y-4">
        <div className="mem-card rounded-[1.7rem] p-4 sm:p-5">
          <h2 className="font-brand text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
            Account
          </h2>

          <div className="mt-4 space-y-3">
            <InfoRow label="Name" value={profile.fullName} />
            <InfoRow label="Username" value={`@${profile.username}`} />
            <InfoRow
              label="Visibility"
              value={
                profile.accountVisibility === "private" ? "Private" : "Public"
              }
            />
          </div>
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
        className="size-14 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] font-semibold text-[var(--app-accent)]">
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
      className="mem-card flex min-h-[96px] items-center justify-between rounded-[1.7rem] p-4 transition hover:border-[var(--app-accent)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
          <Icon size={18} />
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
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}
