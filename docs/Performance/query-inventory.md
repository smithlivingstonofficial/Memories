# Query Inventory

| File | Function | Query purpose | Potential performance issue | Fix status |
| --- | --- | --- | --- | --- |
| `src/app/(app)/layout.tsx` | `ProtectedLayout` | Former shared auth/profile and app shell | Duplicated every page auth/profile load | Fixed: pass-through layout, validation config retained |
| `src/lib/auth/get-authenticated-app-user.ts` | `getAuthenticatedAppUser` | Supabase auth user and profile | Called once per protected page; previously also in layout | Timed with `auth-user` and `profile-load` |
| `src/lib/memories/get-home-feed.ts` | `getHomeFeed` | Home memories, profiles, engagement, media | High limit, avatar asset N+1, per-media signing | Fixed: limit 12, bulk avatar assets, timed phases |
| `src/lib/moments/get-active-moments.ts` | `getActiveMoments` | Active moments, profiles, media | High limit, avatar asset N+1, signed URL loop | Fixed: limit 12, bulk avatars, timed phases |
| `src/lib/messages/get-messages-data.ts` | `getMessagesInboxData` | Inbox conversations, profiles, last messages, unread | 200-message scan and JS unread count | Fixed: RPC-first path, fallback retained |
| `src/lib/messages/get-messages-data.ts` | `getMessageThreadData` | Conversation members and messages | Loaded 200 messages initially | Fixed: newest 50, reversed for display |
| `src/lib/memories/get-vault-entries.ts` | `getVaultEntries` | Vault list and private media | Loaded 50 entries and signed all list media | Improved: limit 12 and timed signing |
| `src/lib/profile/get-profile-page-data.ts` | `getProfilePageData` | Profile, stats, memories, media | Asset fallback queries and 24-memory initial load | Fixed: bulk avatar/cover, limit 12, timed phases |
| `src/lib/profile/get-public-profile-page-data.ts` | `getPublicProfilePageData` | Public profile, follow status, memories, media | Asset fallback queries and 24-memory initial load | Fixed: bulk avatar/cover, limit 12, timed phases |
| `src/lib/discover/get-discover-people-data.ts` | `getDiscoverPeopleData` | Searchable profiles and follow status | 24-user initial load and avatar asset N+1 | Fixed: limit 12, bulk avatars, timed phases |
| `src/lib/memories/get-memory-engagements.ts` | `getMemoryEngagementMap` | Engagement RPC/fallback | Fallback could hide RPC failure | Fixed: development warning on RPC failure |
| `src/lib/r2.ts` | `createSignedReadUrl` | R2 private read URLs | Expensive when used for many list items | Timed at loader call sites; public URLs preferred |

Additional `supabase.auth.getUser()` calls in server actions and API routes remain action-scoped and were not changed because they are mutation/request handlers, not initial page loaders.
