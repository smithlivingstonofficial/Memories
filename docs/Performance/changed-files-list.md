# Changed Files List

## Code

- `src/app/(app)/layout.tsx`: removed duplicate `AppLayout` and auth/profile fetching; retained instant validation config.
- `src/app/(app)/create/page.tsx`: added per-page auth and `AppLayout` because it previously relied on the shared layout shell.
- `src/app/(app)/keepsakes/page.tsx`: added per-page auth and `AppLayout`.
- `src/app/(app)/inner-circle/page.tsx`: added per-page auth and `AppLayout`.
- `src/lib/debug/performance-timer.ts`: added lightweight non-production timing helper.
- `src/lib/media/resolve-asset-urls.ts`: added bulk media asset URL resolver.
- `src/lib/auth/get-authenticated-app-user.ts`: added `auth-user` and `profile-load` timing.
- `src/lib/memories/get-home-feed.ts`: reduced limit, bulked avatar fallback, preferred public media URLs, added timing.
- `src/lib/memories/get-memory-engagements.ts`: added development warning for engagement RPC fallback.
- `src/lib/memories/get-vault-entries.ts`: reduced limit and added timing.
- `src/lib/moments/get-active-moments.ts`: reduced limit, bulked avatar fallback, preferred public media URLs, added timing.
- `src/lib/messages/get-messages-data.ts`: added inbox RPC-first path, bulk avatars, reduced thread limit, added timing.
- `src/lib/profile/get-profile-page-data.ts`: reduced memory limit, bulked avatar/cover fallback, added timing.
- `src/lib/profile/get-public-profile-page-data.ts`: reduced memory limit, bulked avatar/cover fallback, added timing.
- `src/lib/discover/get-discover-people-data.ts`: reduced user limit, bulked avatar fallback, added timing.

## SQL And Reports

- `supabase/messages_inbox_performance.sql`
- `recommended-supabase-sql.sql`
- `performance-report.md`
- `route-loading-map.md`
- `query-inventory.md`
- `timing-log-results.md`
- `rls-policy-report.md`
- `changed-files-list.md`
