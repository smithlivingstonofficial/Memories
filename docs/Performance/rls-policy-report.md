# RLS Policy Report

| Table | Policy name | Condition summary | Possible issue | Needed index | Recommended improvement |
| --- | --- | --- | --- | --- | --- |
| `memories` | Own/public memory policies | `auth.uid() = owner_id`, public privacy checks | Repeated direct `auth.uid()` calls | `memories_owner_privacy_created_idx`, `memories_privacy_created_idx` exist | Consider `(select auth.uid()) = owner_id` in future policy audit |
| `memory_media` | Public memory media is viewable | Nested `exists` through memories | Can be expensive on feed media joins | `memory_media_memory_sort_idx`, `memories_privacy_created_idx` | Keep media queries scoped by memory IDs as implemented |
| `media_assets` | Public/own media policies and moment attachment policies | Own asset checks plus nested moment visibility checks | Nested exists/function calls can amplify avatar/media N+1 patterns | `media_assets_id_uploaded_idx` recommended | Bulk fetch asset IDs; prefer stored `public_url` |
| `user_follows` | Participate/update/delete follows | `auth.uid()` compared to follower/following IDs | OR predicates can need both directions indexed | `user_follows_pair_status_idx` exists; single-column indexes exist | Consider paired reverse index if follow queries become slow |
| `memory_likes` | Visible memory engagement | `public.can_view_memory(memory_id, auth.uid())` | Function call per row if fallback scans many likes | `memory_likes_memory_user_idx` exists | Keep RPC engagement path healthy |
| `memory_reflections` | Visible memory reflections | `public.can_view_memory(memory_id, auth.uid())` and nested owner delete check | Function/nested exists per row | `memory_reflections_memory_created_idx` exists | Keep RPC engagement path healthy |
| `moments` | Visible moments | `public.can_view_moment(id, auth.uid())` | Function call per row on active moments | `moments_active_created_idx` recommended | Filter active rows tightly before RLS-heavy joins |
| `moment_media` | Visible moment media | `public.can_view_moment(moment_id, auth.uid())` plus owner checks | Function call per media row | Moment media moment/display indexes should be checked live | Keep active moments limited and media scoped by IDs |
| `conversations` | Users can view/update conversations they belong to | `public.is_conversation_member(id, auth.uid())` | Membership function per conversation row | `conversation_members_conversation_user_idx` recommended | Use inbox RPC to avoid broad scans |
| `conversation_members` | Users can view members for their conversations | `auth.uid() = user_id` or membership function | Nested membership checks | `conversation_members_user_conversation_read_idx` recommended | Inbox RPC scopes from viewer membership first |
| `messages` | Conversation members can view/send | `public.is_conversation_member(conversation_id, auth.uid())` | Function call per message row | `messages_conversation_created_id_idx` recommended | Thread loader limits newest 50 |

The `(select auth.uid())` pattern can reduce repeated function evaluation in some Supabase RLS policies, but it should be applied only after testing each policy because policy semantics and planner behavior depend on the exact condition.
