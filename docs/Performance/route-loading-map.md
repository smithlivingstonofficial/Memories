# Route Loading Map

| Route | Server/page file | Data loaders called | Auth calls | Table/RPC/R2 calls | Bottleneck status |
| --- | --- | --- | --- | --- | --- |
| `/home` | `src/app/(app)/home/page.tsx` | `getHomeFeed`, `getActiveMoments`, `getHomeDrafts` in parallel | One `getAuthenticatedAppUser()` | Memories, moments, drafts, profiles, engagement RPC, media, R2 fallback signing | Improved limits, bulk avatars, timed |
| `/vault` | `src/app/(app)/vault/page.tsx` | `getVaultEntries`, vault access | One page auth | Vault memories, media, R2 private signing | Limit reduced to 12; signing still needed for private media |
| `/messages` | `src/app/(app)/messages/page.tsx` | `getMessagesInboxData` | One page auth | `get_messages_inbox` RPC first; fallback conversations/messages/profiles | Improved with RPC-first path |
| `/messages/[username]` | `src/app/(app)/messages/[username]/page.tsx` | `getMessageThreadDataByUsername` | One page auth | Profile lookup, conversation/member checks, messages | Initial messages reduced to 50 |
| `/profile` | `src/app/(app)/profile/page.tsx` | `getProfilePageData` | One page auth | Profile, summary RPC, memories, media, R2 fallback | Improved limit and bulk assets |
| `/u/[username]` | `src/app/(app)/u/[username]/page.tsx` | `getPublicProfilePageData` | One page auth | Public profile, follows, counts, memories, engagement RPC, media | Improved limit and bulk assets |
| `/discover` | `src/app/(app)/discover/page.tsx` | `getDiscoverPeopleData` | One page auth | Public profiles, follow status, media asset fallback | Improved limit and bulk avatars |
| `/create/memory` | `src/app/(app)/create/memory/page.tsx` | Vault access and draft load | One page auth | Content drafts/vault access | Not changed beyond duplicate layout fix |
| `/create/moment` | `src/app/(app)/create/moment/page.tsx` | Editable/create moment data | One page auth | Moment draft/media where applicable | Not changed beyond duplicate layout fix |
| `/create/vault` | `src/app/(app)/create/vault/page.tsx` | Vault access and draft load | One page auth | Vault access/content drafts | Not changed beyond duplicate layout fix |

Note: the current message thread route is `/messages/[username]`, not `/messages/[conversationId]`.
