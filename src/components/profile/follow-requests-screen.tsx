import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Clock,
  ImagePlus,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { FollowRequestControls } from "@/components/profile/follow-request-controls";
import type { FollowRequestsData } from "@/lib/follows/get-follow-requests-data";

type FollowRequestsScreenProps = {
  data: FollowRequestsData;
};

export function FollowRequestsScreen({ data }: FollowRequestsScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <Link
          href="/profile"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-accent)]"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Link>

        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          <Bell size={14} />
          Follow Requests
        </p>

        <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
          Manage who can follow you.
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
          Accept people you trust. Decline requests you do not want to approve.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <RequestStat
          label="Pending"
          value={data.stats.pendingRequests.toString()}
          icon={<Clock size={17} />}
        />
        <RequestStat
          label="Followers"
          value={data.stats.followers.toString()}
          icon={<Users size={17} />}
        />
        <RequestStat
          label="Following"
          value={data.stats.following.toString()}
          icon={<UserCheck size={17} />}
        />
        <RequestStat
          label="Sent"
          value={data.stats.sentRequests.toString()}
          icon={<UserPlus size={17} />}
        />
      </section>

      {data.requests.length === 0 ? (
        <EmptyRequests />
      ) : (
        <section className="grid gap-4">
          {data.requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </section>
      )}
    </div>
  );
}

function RequestCard({
  request,
}: {
  request: FollowRequestsData["requests"][number];
}) {
  return (
    <article className="mem-card rounded-[2rem] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/u/${request.profile.username}`}
          className="flex min-w-0 items-center gap-4"
        >
          <Avatar
            fullName={request.profile.fullName}
            avatarUrl={request.profile.avatarUrl}
          />

          <div className="min-w-0">
            <h2 className="font-brand truncate text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
              {request.profile.fullName}
            </h2>

            <p className="truncate text-sm font-medium text-[var(--app-muted)]">
              @{request.profile.username}
            </p>

            {request.profile.bio && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--app-muted)]">
                {request.profile.bio}
              </p>
            )}

            <p className="mt-2 text-xs text-[var(--app-faint)]">
              Requested {formatDate(request.requestedAt)}
            </p>
          </div>
        </Link>

        <div className="shrink-0">
          <FollowRequestControls followerId={request.followerId} />
        </div>
      </div>
    </article>
  );
}

function Avatar({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null;
}) {
  const initials =
    fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className="size-16 shrink-0 rounded-[1.4rem] object-cover shadow-[0_16px_40px_var(--app-shadow)]"
      />
    );
  }

  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] font-brand text-lg font-semibold text-[var(--app-accent)] shadow-[0_16px_40px_var(--app-shadow)]">
      {initials}
    </div>
  );
}

function RequestStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mem-card rounded-[1.5rem] p-4">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[var(--app-soft)] text-[var(--app-accent)]">
        {icon}
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>

      <p className="mt-1 font-brand text-2xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">
        {value}
      </p>
    </div>
  );
}

function EmptyRequests() {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <ImagePlus size={24} />
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        No follow requests
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        When someone requests to follow your private account, their request will
        appear here.
      </p>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}