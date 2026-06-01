import Link from "next/link";
import { Compass, Search, Sparkles, Users } from "lucide-react";
import { FollowProfileButton } from "@/components/profile/follow-profile-button";
import type {
  DiscoverPeopleData,
  DiscoverPerson,
} from "@/lib/discover/get-discover-people-data";

type DiscoverPeopleScreenProps = {
  data: DiscoverPeopleData;
};

export function DiscoverPeopleScreen({ data }: DiscoverPeopleScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-5">
      <section className="mem-card rounded-[2rem] p-5 sm:p-6">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          <Compass size={14} />
          Discover People
        </p>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <h1 className="font-brand text-3xl font-semibold tracking-[-0.055em] text-[var(--app-text)] sm:text-4xl">
              Find people and meaningful memories.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
              Search by name, username, or bio. Follow public accounts directly
              or send requests to private accounts.
            </p>
          </div>

          <form action="/discover" method="get" className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
            />

            <input
              name="q"
              defaultValue={data.query}
              placeholder="Search people..."
              className="mem-input h-13 w-full rounded-2xl pl-11 pr-4 text-[15px] outline-none transition-all placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
            />
          </form>
        </div>
      </section>

      {data.query && (
        <div className="mem-card rounded-[1.5rem] px-5 py-4">
          <p className="text-sm text-[var(--app-muted)]">
            Showing results for{" "}
            <span className="font-semibold text-[var(--app-text)]">
              “{data.query}”
            </span>
          </p>
        </div>
      )}

      {data.people.length === 0 ? (
        <EmptyPeople query={data.query} />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </section>
      )}
    </div>
  );
}

function PersonCard({ person }: { person: DiscoverPerson }) {
  return (
    <article className="mem-card overflow-hidden rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/u/${person.username}`} className="flex min-w-0 gap-4">
          <Avatar fullName={person.fullName} avatarUrl={person.avatarUrl} />

          <div className="min-w-0">
            <h2 className="font-brand truncate text-xl font-semibold tracking-[-0.04em] text-[var(--app-text)] transition hover:text-[var(--app-accent)]">
              {person.fullName}
            </h2>

            <p className="truncate text-sm font-medium text-[var(--app-muted)]">
              @{person.username}
            </p>
          </div>
        </Link>

        <span className="shrink-0 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
          {person.accountVisibility === "private" ? "Private" : "Public"}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--app-muted)]">
        {person.bio ||
          "This user has not added a bio yet. Visit their profile to know more."}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/u/${person.username}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
        >
          View Profile
        </Link>

        <FollowProfileButton
          targetUserId={person.id}
          status={person.followStatus}
          accountVisibility={person.accountVisibility}
        />
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

function EmptyPeople({ query }: { query: string }) {
  return (
    <section className="mem-card rounded-[2rem] p-8 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--app-soft)] text-[var(--app-accent)]">
        {query ? <Search size={24} /> : <Users size={24} />}
      </div>

      <h2 className="font-brand text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        {query ? "No people found" : "No people to discover yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
        {query
          ? "Try searching with another name, username, or keyword."
          : "When more users complete their public profile, they will appear here."}
      </p>

      {!query && (
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-2xl bg-[var(--app-soft)] px-4 py-3 text-sm font-medium text-[var(--app-accent)]">
          <Sparkles size={16} />
          Build your profile to help others discover you too.
        </div>
      )}
    </section>
  );
}
