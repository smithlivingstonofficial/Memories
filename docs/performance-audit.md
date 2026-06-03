# Memories Performance Audit

Date: 2026-06-03

This audit looks at why the app feels slow across frontend, backend, database, realtime, and navigation. The number of source files is not the main problem: the repo has about 174 TS/TSX files, which is normal for this product size. The bigger issues are route blocking, broad refresh/revalidation, DB query fan-out, raw media rendering, and realtime refresh patterns.

## Evidence Snapshot

- Source size: `src` has 105 `.tsx` files and 68 `.ts` files.
- Client components: 41 component files start with `"use client"`.
- Build chunks: the largest client chunks in `.next/static/chunks` are about `236 KB`, `221 KB`, `146 KB`, `123 KB`, plus one CSS chunk around `90 KB`.
- Public static assets are not the major problem: `Memories Dark.png` is about `263 KB`, `Memories Light.png` about `243 KB`.
- `next.config.ts` already enables `cacheComponents: true`.
- None of the authenticated `src/app/(app)/**/page.tsx` routes currently export `unstable_instant`.
- Many app routes still call request-bound Supabase directly in the page file without a route-level instant shell.
- Lint repeatedly warns about raw `<img>` usage across profile, home, messages, memory detail, vault, settings, auth, and moment screens.
- Remaining `router.refresh()` usage exists in vault unlock, home moments realtime, follow controls, delete controls, moment edit/delete, message start, and some message fallback refresh paths.
- Broad `revalidatePath()` remains in follows, moments, messages, vault/security, and some delete/update actions.

## Research Basis

- Next.js 16 Cache Components guidance says instant navigations require local Suspense boundaries in the right place and recommends exporting `unstable_instant` to validate the static shell. A global root Suspense is not enough for client navigation through shared layouts.
- Supabase query optimization guidance emphasizes matching indexes to `where`, join, and `order by` patterns, then verifying with `EXPLAIN`.
- Supabase Realtime docs warn that Postgres Changes with RLS must authorize each event for each subscriber, which can become a database bottleneck. For higher scale, broadcast/server-side fanout is preferred.
- Supabase debugging guidance recommends `pg_stat_statements`, Query Performance, index usage, cache hit rate, sequential scan, and outlier reports to prove the actual slow queries.

Sources:
- Next instant navigation: https://en.nextjs.im/docs/app/guides/instant-navigation/
- Supabase query optimization: https://supabase.com/docs/guides/database/query-optimization
- Supabase realtime Postgres Changes: https://supabase.com/docs/guides/realtime/postgres-changes
- Supabase database inspection: https://supabase.com/docs/guides/database/inspect
- Supabase indexes: https://supabase.com/docs/guides/database/postgres/indexes

## Root Causes

### 1. Route Navigation Still Blocks On Server Data

The authenticated app uses a persistent shell now, but route pages still block because most pages do not export `unstable_instant` and many do not wrap uncached/request-bound data in a local Suspense boundary.

Current route scan:

- Has Suspense/private cache: `home`, `dashboard`, `calendar`, `diary/day`, `profile`, `memory/[memoryId]`, `vault`.
- Still missing instant validation everywhere: all authenticated app pages.
- Still direct Supabase page reads with no local Suspense/cache split: `messages`, `messages/[username]`, `discover`, `timeline`, `requests`, `settings`, `u/[username]`, edit/create routes, moment routes, on-this-day.

Impact:

- On client navigation, the old page can remain visible until the destination server work finishes.
- Users experience this as "whole page reload" even when the shell technically persists.

Priority fix:

- Add `unstable_instant = { prefetch: "static" }` route-by-route.
- For each page that fails validation, move params/auth/Supabase work under local Suspense and private cache components.
- Start with `/home`, `/messages`, `/messages/[username]`, `/profile`, `/calendar`, `/vault`, `/memory/[id]`.

### 2. Full `router.refresh()` Is Still Used As A State Sync Tool

Remaining client refreshes:

- `src/components/home/home-moments-realtime-refresh.tsx` refreshes Home on every `moments` and `moment_media` change.
- `src/components/vault/vault-access-screen.tsx` refreshes after unlock/setup.
- `src/components/profile/follow-request-controls.tsx` refreshes after request actions.
- Delete/edit moment and delete memory/reflection controls still refresh.
- `src/components/messages/start-conversation-button.tsx` refreshes after opening a conversation.

Impact:

- Any user action can force the server to re-render and stream page data again.
- Realtime changes can trigger page refresh loops, especially Home moments.
- Mobile feels slow because state waits for network/server work.

Priority fix:

- Replace refreshes with optimistic local state for UI-only changes.
- Use server actions that return the final state.
- Use `updateTag()` for immediate self-updates and `revalidateTag(..., "max")` for background consistency.
- Replace Home moments refresh with local realtime state or a small client island that only updates moments.

### 3. Cache Invalidation Is Still Too Broad In Several Actions

Examples:

- Moment create/edit/delete revalidates `/home`, `/profile`, `/create/moment`, detail/edit routes.
- Follow actions revalidate `/profile`, `/requests`, public profile routes.
- Vault/security actions still mix targeted `updateTag()` with broad `revalidatePath()` for create/timeline/calendar.
- Message actions still have broad path revalidation, though the composer now bypasses the slow send path.

Impact:

- Pages lose cache more often than needed.
- Navigating back to a page often redoes database work.

Priority fix:

- Add more cache tags: `moments:${userId}`, `moment:${id}`, `messages:${userId}`, `conversation:${id}`, `requests:${userId}`, `public-profile:${username}`.
- Replace broad path invalidation with tag updates.

### 4. Database Query Fan-Out And Sequential Asset URL Resolution

Several loaders do multiple round trips per page:

- Home feed: memories, engagement RPC, profiles, avatar asset lookups, memory media, signed URL generation.
- Profile: profile row, avatar URL, cover URL, summary RPC/fallback counts, memories, engagement, memory media.
- Messages inbox: memberships, conversations, members, profile map, recent messages, unread candidates.
- Follow requests: multiple exact count queries plus requests and profiles.
- Public profile still has multiple count queries.

Asset URL resolution often does this pattern:

- If `avatar_url` is missing, query `media_assets` by asset id.
- If `public_url` is missing, create a signed R2 URL.
- Loops await these one-by-one in places like profile maps and media maps.

Impact:

- Page load time compounds with number of memories, profiles, and media assets.
- Signed URL creation and extra media asset queries add latency before rendering.

Priority fix:

- Prefer storing durable public/avatar/cover URLs when possible.
- Batch media asset lookups by asset id instead of one `maybeSingle()` per profile.
- Use `Promise.all` for independent signed URL generation when it cannot be avoided.
- Add RPCs/views for repeated page shapes: public profile summary, follow request summary, messages inbox summary, home feed with first media/engagement.

### 5. Media Rendering And LCP Are Not Optimized Enough

Evidence:

- Lint warns on raw `<img>` in many screens.
- Home/profile/memory cards render uploaded images and videos directly.
- The user measured local LCP around `4.08s` on mobile emulation.

Impact:

- Raw images miss Next image optimization, sizing, priority hints, and responsive loading.
- Video elements inside feeds can be expensive on mobile.
- Cover images and feed images can dominate LCP.

Priority fix:

- Convert stable remote images to `next/image` with configured remote patterns for Cloudflare/R2 delivery.
- Ensure every image/card has fixed dimensions or aspect ratio.
- Use thumbnails/posters for videos in feeds, load video controls only on detail/open state.
- Add `loading="lazy"`/defer strategy for below-fold media if not using `next/image`.
- Keep first viewport media predictable and small.

### 6. Home Is A Fully Client Component

`src/components/home/home-screen.tsx` is a large `"use client"` surface with feed, moments, quick draft, realtime refresh, and media cards.

Impact:

- More JS and hydration work on the page users visit most.
- Realtime refresh can re-render the whole page.

Priority fix:

- Split Home into server-rendered feed sections plus small client islands:
  - quick draft island
  - like/reflection controls
  - moments strip
  - realtime moments updater
- Avoid putting the whole feed in one client component.

### 7. Realtime Needs More Care

Current state:

- Messages thread now uses local optimistic send plus Supabase realtime.
- Inbox now updates locally for known conversations.
- Home moments still refreshes the full route on any moments/moment_media change.

Risk:

- Supabase Postgres Changes with RLS can lag under load because every event must be authorized per subscriber.

Priority fix:

- Keep Postgres Changes only for low-volume targeted channels.
- For broad feeds/home, use server-side broadcast or poll/stale refresh.
- Subscribe with filters wherever possible.
- Do not call `router.refresh()` from realtime handlers except as a rare fallback.

### 8. Dependencies Are Mostly Fine, But Some Need Scrutiny

Dependencies:

- `@aws-sdk/client-s3` and presigner are server/API-route only, acceptable.
- `framer-motion` appears only in `auth-shell`; fine unless it leaks into authenticated app chunks.
- `react-hook-form` and `@hookform/resolvers` are in dependencies but current search did not find app usage. If truly unused, remove them.
- `lucide-react` is used widely; tree-shaking should work, but many client components import icons.

Priority fix:

- Run a bundle analyzer when dependency analysis is needed.
- Remove unused `react-hook-form` packages if confirmed.
- Keep heavy animation libraries out of app shell chunks.

## Database Index And SQL Status

Already helpful:

- `supabase/core_performance.sql` adds core indexes and summary RPCs.
- `supabase/messages_realtime_performance.sql` adds message realtime/index helpers.

Likely still needed:

- Indexes for moments feed:
  - `moments(owner_id, expires_at, created_at desc)`
  - `moments(visibility, expires_at, created_at desc)`
  - `moment_media(moment_id, display_order)`
  - `moment_views(moment_id, viewer_id)`
- Follow request paths:
  - `user_follows(following_id, status, created_at desc)`
  - `user_follows(follower_id, status, created_at desc)`
- Public profile paths:
  - confirm `profiles(username)` / `public_profiles(username)` indexes.
- Messages:
  - new helper adds `messages(conversation_id, sender_id, created_at desc)`, `conversation_members(user_id, conversation_id)`, `conversations(updated_at desc)`.

Use Supabase Query Performance and `EXPLAIN` before adding too many indexes. Indexes speed reads but add write/storage overhead.

## Prioritized Fix Plan

### P0: Stop The Most Visible Slowness

1. Add instant navigation validation to core routes.
2. Fix routes that fail by moving dynamic data into local Suspense/private cache components.
3. Remove `router.refresh()` from Home realtime and replace with local moments state.
4. Remove or replace `MessagesRealtimeRefresh` since inbox now has local realtime.
5. Convert message/follow/delete actions to return state and update UI locally.

### P1: Reduce Database Load

1. Run `supabase/performance_diagnostics.sql`.
2. Use Supabase Query Performance to identify top slow/called queries.
3. Add missing indexes only where query plans prove need.
4. Batch avatar/media asset URL resolution.
5. Replace repeated count queries with RPCs/views.

### P2: Reduce Frontend Cost

1. Split Home into server sections plus client islands.
2. Convert major raw images to `next/image`.
3. Add video thumbnails/posters and lazy video loading.
4. Verify mobile LCP/INP with Chrome Performance and Lighthouse.
5. Remove unused dependencies after `npm ls`/search confirmation.

### P3: Realtime Scaling

1. Keep direct chat realtime filtered by conversation.
2. Move broad feed realtime away from Postgres Changes + RLS.
3. Use broadcast or periodic stale refresh for high-volume shared feeds.

## What Is Not The Main Problem

- Too many files: current source file count is normal.
- Public logo image files: they are small enough and not the main LCP issue.
- AWS SDK in itself: it appears server-side, not a client bundle issue.

## Manual Verification Checklist

- Home -> Profile -> Home should show destination shell instantly.
- Home realtime should not trigger full page refresh on unrelated moment changes.
- Like/follow/delete actions should update visible state without waiting for a route refresh.
- Messages should send instantly and receive realtime messages without reloading.
- Supabase Query Performance should show fewer high-call count queries after batching/RPC changes.
- LCP should improve after replacing raw first-viewport images and avoiding video-heavy first paint.
