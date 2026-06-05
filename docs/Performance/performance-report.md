# Performance Report

## Root Cause Ranking

1. Duplicate protected layout auth/profile fetching: fixed by making `src/app/(app)/layout.tsx` pass-through while retaining instant validation config.
2. Avatar asset N+1 lookups in feed, moments, messages, profile, and discover loaders: fixed with bulk asset resolution.
3. Per-media signed URL generation on list views: reduced by preferring stored `public_url` and timing remaining private signing.
4. Messages inbox loading too many rows and counting unread in JavaScript: improved with RPC-first `get_messages_inbox` path and fallback retained.
5. Initial page payloads too large: home/moments/profile/discover/vault/message thread limits reduced.
6. Missing or incomplete indexes/RPC deployment: recommended SQL added, not applied automatically.

## Files Causing Most Delay

`src/app/(app)/layout.tsx`, `src/lib/memories/get-home-feed.ts`, `src/lib/moments/get-active-moments.ts`, `src/lib/messages/get-messages-data.ts`, `src/lib/memories/get-vault-entries.ts`, `src/lib/profile/get-profile-page-data.ts`, `src/lib/profile/get-public-profile-page-data.ts`, and `src/lib/discover/get-discover-people-data.ts`.

## Exact Changes Made

See `changed-files-list.md` for the full file list. Highlights: duplicate layout auth removed, timing helper added, bulk media asset URL resolver added, initial limits reduced, message inbox RPC SQL added, and required reports created.

## SQL To Run

Run `recommended-supabase-sql.sql` and `supabase/messages_inbox_performance.sql` in Supabase SQL Editor. These files contain indexes and the `get_messages_inbox(viewer uuid)` RPC; they were not applied automatically.

## Before/After Query Count

| Route | Before queries | After queries | Improvement |
| --- | ---: | ---: | --- |
| `/home` | Layout auth + page auth + feed/moments/drafts + avatar N+1 | One page auth + parallel loaders + bulk avatars | Removes duplicate auth and avatar N+1 |
| `/vault` | Layout auth + page auth + 50 entries + list signing | One page auth + 12 entries + timed signing | Smaller private list load |
| `/messages` | Layout auth + page auth + memberships/conversations/profiles/200 messages/unread scan | One page auth + inbox RPC; fallback retained | Fewer round trips after SQL applied |
| `/messages/[username]` | Layout auth + page auth + 200 messages | One page auth + 50 messages | Smaller initial thread load |
| `/profile` | Layout auth + page auth + 24 memories + asset fallbacks | One page auth + 12 memories + bulk assets | Smaller profile load |
| `/discover` | Layout auth + page auth + 24 profiles + avatar N+1 | One page auth + 12 profiles + bulk avatars | Smaller discover load |

## Verification

`npm run build` passed. `npm run start` was attempted, but the command timed out while attached, so authenticated route timing must still be collected manually in a browser session.

## Remaining Risks

The inbox RPC and recommended indexes still need to be run in Supabase. RLS policy performance needs live `EXPLAIN`/query-plan testing with production-like data. Timing logs need to be collected from authenticated route visits.

## Next Step

Apply the SQL in Supabase, visit `/home`, `/messages`, `/profile`, `/vault`, and `/discover` locally while signed in, then update `timing-log-results.md` with any query over 500ms.
