# Memories App — Development Summary and Agent Handoff Document

**Project name:** Memories  
**Product type:** Privacy-first diary + memory social platform  
**Current development focus:** Diary-first personal memory system  
**Secondary focus:** Social features such as public profiles, follows, discover, messaging, and moments  
**Primary stack:** Next.js, Supabase, Cloudflare R2, Tailwind CSS, Lucide Icons  
**Owner/developer:** Smith Livingston

---

## 1. Product Vision

Memories is being developed as a **private-first diary and memory platform**. The main idea is to help users save their life moments, thoughts, private diary entries, photos, moods, and reflections in a calm and meaningful way.

The product is not meant to be only another social media app. Social features exist, but they are secondary. The core product direction is:

- Personal diary first.
- Privacy and emotional safety first.
- Social sharing only when the user wants it.
- Clean, premium, modern, world-class UI.
- Simple navigation that does not confuse users.
- Strong storage management to reduce Cloudflare R2 cost.

The main product language uses custom names:

| Common Social Term | Memories Product Term |
|---|---|
| Post | Memory |
| Story | Moment |
| Private diary | Vault |
| Saved | Keepsakes |
| Close Friends | Inner Circle |
| Comments | Reflections |
| Likes | Likes |
| Explore | Discover |
| Profile | Profile |

---

## 2. Current Technical Stack

### Frontend

- **Next.js App Router**
- **React / TypeScript**
- **Tailwind CSS**
- **Lucide React icons**
- Server components for pages where possible
- Client components for interactive UI such as forms, uploads, mobile navigation, message composer, etc.

### Backend

- **Supabase Auth** for authentication
- **Supabase Postgres** for database
- **Supabase Row Level Security** for privacy and access control
- **Supabase RPC functions** for diary dashboard, calendar, and on-this-day data
- **Cloudflare R2** for media storage

### Storage

- Cloudflare R2 is used for uploaded media such as:
  - Memory images/videos
  - Moment images/videos
  - Profile avatars
  - Cover images
  - Vault media

Storage cleanup is important because the user wants to minimize running cost and avoid unused files occupying R2 storage.

---

## 3. Product Architecture Overview

The app has two major layers:

1. **Private diary layer**
   - Dashboard
   - Calendar
   - Timeline
   - Day view
   - Vault
   - On This Day
   - Mood insights / future plans

2. **Social layer**
   - Home feed
   - Moments
   - Discover
   - Public profiles
   - Follow system
   - Follow requests
   - Messages
   - Likes and Reflections
   - Keepsakes
   - Inner Circle

The current direction is to improve the diary layer first, because that is the main product value.

---

## 4. Authentication and Profile Completion Flow

### Authentication

The app uses Supabase Auth with Google Sign-In and custom profile completion.

The current intended flow is:

1. User signs in with Google.
2. If the profile is incomplete, redirect to `/complete-profile`.
3. User must complete required identity information.
4. After profile completion and password setup, redirect to `/home` or dashboard flow.

### Required Complete Profile Fields

The complete profile page has been planned/updated to collect:

- Full name — required
- Username — required
- Mobile number — required
- Date of birth — required
- Password — required for email/password login fallback
- Profile picture — optional
- Bio — optional

### Username Availability

The complete profile page should check username availability in real time.

### Date of Birth

Date of birth is required because Memories is a personal diary application and may use birth date later for personalization, memories, timeline, and future diary intelligence.

---

## 5. Main Routes Developed or Planned

### Core Routes

| Route | Purpose |
|---|---|
| `/home` | Main home feed with Moments, Memories, Vault prompt, today reflection |
| `/dashboard` | Private diary dashboard |
| `/create` | Create hub |
| `/create/memory` | Diary-first Memory writer |
| `/create/moment` | Moment creation page |
| `/create/vault` | Vault entry creation |
| `/calendar` | Full diary calendar page |
| `/diary/day/[date]` | Focused day view page |
| `/timeline` | Full life archive timeline |
| `/on-this-day` | Same-date memories from previous years |
| `/vault` | Private Vault space |
| `/profile` | User profile page |
| `/settings/profile` | Edit profile page |
| `/u/[username]` | Public profile page |
| `/discover` | Discover public memories and people |
| `/messages` | Messaging inbox |
| `/messages/[username]` | Message thread using username in URL |
| `/requests` | Follow request management |
| `/keepsakes` | Saved/favorite memories |
| `/inner-circle` | Close trusted people |
| `/notifications` | Placeholder/future notifications |

---

## 6. Home Page Current Purpose

The `/home` page is not the diary dashboard anymore.

It should show:

- Active Moments tray
- Home feed / memories
- Vault prompt card
- Today reflection card
- Social/personal content stream

The user specifically decided that diary dashboard should not replace the Home page because Home needs to show Moments and other feed-related content.

---

## 7. Diary Dashboard System

A new `/dashboard` page was introduced for diary-focused features.

### Dashboard Purpose

The dashboard is the private diary center. It should encourage users to write more and revisit their memories without wasting space.

Current dashboard sections include:

- Compact hero section
- Today stats
- This month stats
- Writing streak
- Vault count
- Calendar preview using the same visual style as the full calendar
- Today board
- Monthly pulse
- On This Day preview
- Recent timeline

### Dashboard UI Direction

The dashboard should:

- Avoid wasting too much vertical space.
- Show the calendar quickly.
- Use compact premium cards.
- Avoid plain list-only designs.
- Encourage writing through clear CTAs.
- Use a dark premium Memories design style.

### Dashboard Files

Important files:

```txt
src/lib/diary/get-diary-dashboard-data.ts
src/components/diary/diary-dashboard-screen.tsx
src/app/dashboard/page.tsx
```

### Dashboard Data RPC

The dashboard depends on RPC/data sources such as:

- `get_diary_dashboard_summary(target_date)`
- `get_diary_calendar_month(target_month)`
- `get_diary_day_entries(target_date)`
- `get_on_this_day_entries(target_date)`
- `diary_entries` view/table

---

## 8. Diary Calendar System

A full calendar page was built at:

```txt
/calendar
```

### Calendar Features

- Full monthly calendar
- Previous/next month navigation
- Today shortcut
- Selected date handling through query params
- Entry count indicators
- Mood indicators
- Media indicators
- Vault indicators
- Selected day panel
- Quick actions for selected date

### Calendar Related Files

```txt
src/lib/diary/get-diary-calendar-page-data.ts
src/components/diary/diary-calendar-screen.tsx
src/app/calendar/page.tsx
```

### Important Calendar Behavior

- Calendar uses `entry_date`, not only `created_at`.
- If a user writes today about yesterday, the entry should appear under yesterday.
- Calendar design is also reused in dashboard preview.

---

## 9. Day View Page

A focused day page was added:

```txt
/diary/day/[date]
```

### Day View Features

- Shows selected date hero
- Previous day / next day navigation
- Link back to calendar
- Day stats
- Entries from that date
- Memory / Vault labels
- Mood indicators
- Media indicators
- Favorite indicators
- Quick actions to write for that date

### Day View Files

```txt
src/lib/diary/get-diary-day-page-data.ts
src/components/diary/diary-day-screen.tsx
src/app/diary/day/[date]/page.tsx
```

---

## 10. Timeline Page

A full timeline page was added:

```txt
/timeline
```

### Timeline Features

- Diary entries grouped by year/month
- Memory and Vault entries together
- Search by title/content
- Filter by type: all, memory, vault
- Filter by month
- Filter by mood
- Filter by tag
- Premium timeline card UI

### Timeline Files

```txt
src/lib/diary/get-diary-timeline-page-data.ts
src/components/diary/diary-timeline-screen.tsx
src/app/timeline/page.tsx
```

### Timeline Data Source

Timeline reads from:

```txt
diary_entries
```

The `diary_entries` source should include both normal memories and Vault entries in a consistent structure.

---

## 11. On This Day Feature

An On This Day page was added:

```txt
/on-this-day
```

### Purpose

This feature shows memories from the same date in previous years, like a personal time capsule.

### On This Day Features

- Same month/day from previous years
- Memory and Vault entries
- Years ago label
- Emotional reflection prompt
- Dashboard preview section
- Full page for all previous entries

### SQL RPC

The following RPC was planned/added:

```sql
public.get_on_this_day_entries(target_date date)
```

This function should return previous entries from the same month/day for the current authenticated user.

### Related Files

```txt
src/lib/diary/get-on-this-day-page-data.ts
src/components/diary/on-this-day-screen.tsx
src/app/on-this-day/page.tsx
```

The dashboard also uses `get_on_this_day_entries` to show preview entries.

---

## 12. Memory Writer Upgrade

The memory writer at:

```txt
/create/memory
```

was upgraded to behave more like a diary writer.

### Memory Writer Features

- `entry_date` support
- `entry_timezone` support
- Date picker for diary date
- Diary-first hero section
- Title
- Content
- Mood selector
- Privacy selector
- Location
- Tags
- Media upload
- Live preview
- Word count
- Reading time
- Cloudflare R2 media upload
- Redirect to selected day after saving

### Important Behavior

When creating a Memory:

- Save `entry_date` into `memories`.
- Save `entry_timezone`.
- Revalidate:
  - `/home`
  - `/dashboard`
  - `/calendar`
  - `/timeline`
  - `/profile`
  - `/create/memory`
  - `/diary/day/[entryDate]`
  - `/memory/[memoryId]`
- Redirect to:

```txt
/diary/day/[entryDate]
```

### Memory Writer Files

```txt
src/components/create/create-memory-screen.tsx
src/app/actions/memories.ts
src/app/create/memory/page.tsx
src/lib/diary/entry-date.ts
```

---

## 13. Vault System

The Vault is the private diary space.

### Vault Meaning

Vault entries are private diary entries. They should not appear publicly or in the Home feed as public content.

### Vault Behavior

- Vault entries use `privacy = 'vault'`.
- Vault entries should be visible only to the owner.
- Vault media should be private.
- Vault entries are included in diary dashboard, calendar, timeline, day view, and On This Day for the owner.

### Vault Creation

Vault creation is handled through:

```txt
createVaultEntryAction
```

inside:

```txt
src/app/actions/memories.ts
```

---

## 14. Media Upload and Storage Management

Media upload is an important part of the app.

### Media Storage

Cloudflare R2 stores uploaded media.

Media metadata is stored in Supabase, likely through a `media_assets` table and linking tables like:

```txt
memory_media
```

### Storage Cleanup Goals

The user strongly wants storage cleanup to reduce cost.

Required cleanup behavior:

1. If user uploads a new profile avatar, delete the old avatar from Cloudflare R2.
2. If user uploads a new cover image, delete the old cover image from Cloudflare R2.
3. If a Memory is deleted, delete linked media from R2.
4. If a Vault entry is deleted, delete linked media from R2.
5. If a Moment expires, delete expired Moment media from R2.
6. Unused media should not remain in storage.

### Existing/Planned Cleanup Helpers

Important helper mentioned:

```txt
src/lib/media/delete-media.ts
```

Function used:

```txt
deleteMediaAssetsCompletely
```

### Delete Memory Action

The delete action should:

- Verify authenticated user.
- Verify memory ownership.
- Fetch linked media assets.
- Delete rows from `memory_media`.
- Delete memory row.
- Delete linked media from R2 using cleanup helper.
- Revalidate affected paths.

---

## 15. Moments Feature

Moments are the Memories version of Stories.

### Moment Meaning

A Moment is a short-lived photo/video update, active for 24 hours.

### Moment Steps Completed/Planned

- Database plan for Moments
- `/create/moment` UI
- Camera/upload preview
- Supabase + Cloudflare R2 connection
- Display active Moments on Home
- Moment viewer page
- View count
- Expired Moment cleanup
- R2 storage cleanup
- Viewer polish:
  - tap next
  - progress bar
  - swipe close
- Home moments realtime updates
- Better Moment tray grouping
- Multiple moments from same user in viewer

### Moment Cleanup API

A cleanup endpoint was created/planned:

```txt
/api/cron/cleanup-expired-moments?limit=50
```

Authorization should use:

```txt
Authorization: Bearer YOUR_CRON_SECRET
```

In PowerShell, use `Invoke-RestMethod` instead of Linux-style `curl -X`.

---

## 16. Public Profile and Privacy System

### Public Profile Route

A public profile route was added:

```txt
/u/[username]
```

### Profile Privacy

Account privacy was added/planned:

- Public account
- Private account

Private account behavior should restrict visibility based on follow/follow request status.

### Profile Related Files

```txt
src/app/actions/profile.ts
src/lib/profile/get-profile-page-data.ts
src/lib/profile/get-public-profile-page-data.ts
src/app/settings/profile/page.tsx
src/components/profile/edit-profile-screen.tsx
src/components/profile/profile-screen.tsx
src/components/profile/public-profile-screen.tsx
```

### Profile Media Upload

Profile avatar and cover upload should:

- Upload to Cloudflare R2.
- Store URL/path in profile.
- Remove old avatar/cover from R2 when replaced.

---

## 17. Follow System

The follow system was added/planned.

### Features

- Follow user
- Unfollow user
- Follow requests for private accounts
- Accept/reject follow requests
- Social stats
- Follow status on public profiles

### Tables/RLS

A `user_follows` table was expected. One runtime error occurred when it did not exist:

```txt
Could not find the table 'public.user_follows' in the schema cache
```

This required running the follow system SQL and reloading PostgREST schema.

### Follow Related Files

```txt
src/lib/profile/get-public-profile-page-data.ts
src/components/profile/public-profile-screen.tsx
src/lib/follows/get-follow-requests-data.ts
src/app/requests/page.tsx
```

---

## 18. Likes and Reflections

Likes and Reflections were added/planned for Memories.

### Product Naming

- Likes stay as Likes.
- Comments are called Reflections.

### Features

- Like a Memory
- Unlike a Memory
- Add Reflection
- Reflection list on memory detail page
- Delete Reflection
- Polish Memory detail UI

### Related Files

```txt
src/components/memory/memory-engagement-bar.tsx
src/components/home/home-screen.tsx
src/components/profile/profile-screen.tsx
src/components/profile/public-profile-screen.tsx
src/lib/memories/get-home-feed.ts
```

---

## 19. Messaging System

Private messaging foundation was added.

### Messaging Features

- Start direct conversation from public profile
- Message thread page
- Realtime updates
- Read receipts
- Unread count
- Username-based message URL instead of raw conversation ID

### Important UX Decision

The user did not want message URLs to show raw conversation IDs like:

```txt
/messages/a7ab0853-8198-4024-b7dd-ef0274fb1347
```

The URL should look branded with username:

```txt
/messages/[username]
```

### Message UI Direction

The message screen should look like a clean chat box, not a profile/info page with dummy content. Remove unwanted dummy profile cards and keep it focused on conversation.

### Messaging Related Files

```txt
src/app/messages/[conversationId]/page.tsx
src/components/messages/message-thread-screen.tsx
src/components/messages/start-conversation-button.tsx
src/lib/messages/get-messages-data.ts
src/app/actions/messages.ts
```

### RLS Issue

A Supabase policy issue occurred:

```txt
infinite recursion detected in policy for relation "conversation_members"
```

The RLS policy for `conversation_members` must avoid recursive self-references.

---

## 20. Discover People / Find Friends

A Discover People / Find Friends feature was planned.

The purpose is to help users find other users, but this remains secondary to the diary system.

Related area:

```txt
/discover
```

---

## 21. Navigation System Refactor

The app layout navigation was redesigned and then split into multiple components for easier management.

### Navigation Categories

The navigation is now organized into clear categories:

#### Main

- Home
- Dashboard
- Create

#### Diary

- Calendar
- Timeline
- Vault
- On This Day
- Keepsakes

#### Social

- Discover
- Messages
- Inner Circle
- Requests

#### Account

- Profile
- Settings

---

## 22. Desktop Sidebar

Desktop sidebar supports:

- Grouped navigation sections
- Collapsed/expanded mode
- Sidebar collapse state stored in localStorage
- Tooltips when collapsed
- User profile card at bottom

### Sidebar Files After Split

```txt
src/components/layout/desktop-sidebar.tsx
src/components/layout/sidebar-nav-group.tsx
src/components/layout/navigation-config.ts
src/components/layout/route-utils.ts
```

---

## 23. Mobile Navigation

Mobile navigation was simplified to avoid overcrowding.

### Mobile Bottom Nav

Only 5 primary actions should be shown:

- Home
- Dashboard
- Create
- Calendar
- Menu

### Mobile Menu

All secondary routes are inside a full-screen mobile menu.

The mobile menu is grouped by:

- Diary
- Social
- Account

### Important Mobile Menu Fix

The mobile menu previously opened by default and blocked the UI. This was fixed by:

- Rendering the menu only when `mobileMenuOpen` is true.
- Hiding bottom nav while menu is open.
- Closing menu on route change.
- Locking body scroll while menu is open.
- Making mobile menu a full-screen panel with its own scroll area.

### Mobile Nav Files After Split

```txt
src/components/layout/mobile-bottom-nav.tsx
src/components/layout/mobile-menu-screen.tsx
```

---

## 24. Layout Component Split

The original `app-layout.tsx` became too large, so it was split.

### New Layout File Structure

```txt
src/components/layout/
│
├── app-layout.tsx
├── layout-types.ts
├── navigation-config.ts
├── route-utils.ts
├── user-avatar.tsx
│
├── desktop-sidebar.tsx
├── sidebar-nav-group.tsx
├── app-top-bar.tsx
│
├── mobile-bottom-nav.tsx
└── mobile-menu-screen.tsx
```

### Responsibility of Each File

| File | Responsibility |
|---|---|
| `app-layout.tsx` | Main layout shell and layout state |
| `layout-types.ts` | Shared layout/nav types |
| `navigation-config.ts` | Sidebar and mobile nav item configuration |
| `route-utils.ts` | Active route helper |
| `user-avatar.tsx` | Reusable avatar component |
| `desktop-sidebar.tsx` | Desktop sidebar shell |
| `sidebar-nav-group.tsx` | Sidebar group/item rendering |
| `app-top-bar.tsx` | Top navigation bar |
| `mobile-bottom-nav.tsx` | Mobile bottom navigation |
| `mobile-menu-screen.tsx` | Full-screen mobile menu |

This split allows future updates without editing one huge file.

---

## 25. Top Navigation Bar Current Direction

The top navbar has been repeatedly adjusted.

### Final Desired Direction

#### Mobile Top Navbar

The user wants mobile top navbar to be simple and premium:

- Left: Memories app icon + Memories name
- Right: Profile icon only
- No subtitles below app name
- No greeting in mobile top navbar
- More height, spacing, and padding

#### Desktop Top Navbar

The user wants desktop top navbar to keep greeting:

- Left: `Good evening, Smith`
- Right: Discover, Write, Theme, Notifications, Profile
- No subtitle text below greeting
- More height and padding
- Should look premium and balanced

### Texts Removed From Top Navbar

Do not show these in the top navbar anymore:

- `Moments • Feed • Memories`
- `Cherish • Reflect • Remember`
- `Private-first space`

### Top Navbar File

```txt
src/components/layout/app-top-bar.tsx
```

---

## 26. UI Design Direction

The app uses a dark premium interface with:

- Large rounded cards
- Soft borders
- Dark navy backgrounds
- Purple/accent highlights
- Subtle gradients
- Smooth spacing
- Strong typography
- Minimal clutter
- Premium dashboard-like sections

The user wants the UI to feel:

- Professional
- Premium
- Attractive
- Modern
- World-class
- Easy to understand
- Not overcomplicated

Important UX principle:

> Do not add too many features or text blocks in one place. Keep the experience clear and useful.

---

## 27. Important Database Concepts

### Core Tables/Views Mentioned

The project uses or expects tables/views such as:

```txt
profiles
memories
media_assets
memory_media
diary_entries
user_follows
conversation_members
conversations
messages
moments
moment_views
```

The exact schema may differ, but the code expects these concepts.

### Important Columns in `memories`

The app now expects memory rows to support:

```txt
id
owner_id
title
content
mood
moods
privacy
location_name
tags
entry_date
entry_timezone
media_count
created_at
updated_at
```

### Important Privacy Values

Expected privacy values include:

```txt
private
inner_circle
friends
public
vault
```

### Important RPC Functions

```txt
get_diary_dashboard_summary(target_date)
get_diary_calendar_month(target_month)
get_diary_day_entries(target_date)
get_on_this_day_entries(target_date)
```

When new RPCs or schema updates are added in Supabase, reload schema:

```sql
notify pgrst, 'reload schema';
```

---

## 28. Known Errors Encountered and Lessons

### 1. Supabase function missing

Error:

```txt
Could not find the function public.get_diary_dashboard_summary(target_date) in the schema cache
```

Meaning:

- RPC was not created.
- Function signature mismatch.
- Supabase schema cache needed reload.

### 2. Missing `entry_date`

Error:

```txt
column m.entry_date does not exist
```

Meaning:

- `entry_date` must exist in `memories` or RPC/view must use fallback.

### 3. Missing `vault_entries`

Error:

```txt
relation "public.vault_entries" does not exist
```

Meaning:

- Vault is currently likely stored inside `memories` using `privacy = 'vault'`, not a separate `vault_entries` table.

### 4. Missing `user_follows`

Error:

```txt
Could not find the table 'public.user_follows' in the schema cache
```

Meaning:

- Follow system SQL must be run.
- Schema reload needed.

### 5. Google OAuth new user saving error

Error URL:

```txt
/login#error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user&sb=
```

Meaning:

- Supabase auth trigger/profile insert probably failed.
- Profiles table trigger or RLS needs correction for new auth users.

### 6. React script tag warning

Error:

```txt
Encountered a script tag while rendering React component.
Scripts inside React components are never executed when rendering on the client.
```

Location:

```txt
src/app/layout.tsx
```

A theme script was placed with `dangerouslySetInnerHTML`. This may need a safer strategy or Next.js-compliant handling.

### 7. PowerShell curl issue

PowerShell aliases `curl` to `Invoke-WebRequest`, so Linux curl syntax with `-X` and `-H` failed. Use `Invoke-RestMethod` or `curl.exe`.

---

## 29. Development Priorities Going Forward

The user wants to move away from social-first features and improve diary features.

### Priority 1 — Diary Experience

Next major improvements should focus on:

- Better diary dashboard
- Calendar UX
- Timeline UX
- Mood insights
- Writing streaks
- Daily prompts
- Reflection prompts
- Day view polish
- Search and filters
- Personal archive feeling

### Priority 2 — Storage and Reliability

Improve:

- R2 cleanup
- orphan media cleanup
- expired Moment cleanup
- profile avatar/cover replacement cleanup
- delete flow reliability
- Supabase RLS safety

### Priority 3 — Mobile UX

Improve:

- Mobile top navbar
- Mobile bottom nav
- Mobile menu grouping
- Create flow on mobile
- Chat screen on mobile
- Calendar on mobile

### Priority 4 — Social Layer

After diary is strong:

- Discover
- Public profiles
- Follow system polish
- Messages
- Likes/reflections polish
- Inner Circle

---

## 30. Current File Map for Agent

### Layout

```txt
src/components/layout/app-layout.tsx
src/components/layout/layout-types.ts
src/components/layout/navigation-config.ts
src/components/layout/route-utils.ts
src/components/layout/user-avatar.tsx
src/components/layout/desktop-sidebar.tsx
src/components/layout/sidebar-nav-group.tsx
src/components/layout/app-top-bar.tsx
src/components/layout/mobile-bottom-nav.tsx
src/components/layout/mobile-menu-screen.tsx
```

### Diary

```txt
src/lib/diary/get-diary-dashboard-data.ts
src/components/diary/diary-dashboard-screen.tsx
src/app/dashboard/page.tsx

src/lib/diary/get-diary-calendar-page-data.ts
src/components/diary/diary-calendar-screen.tsx
src/app/calendar/page.tsx

src/lib/diary/get-diary-day-page-data.ts
src/components/diary/diary-day-screen.tsx
src/app/diary/day/[date]/page.tsx

src/lib/diary/get-diary-timeline-page-data.ts
src/components/diary/diary-timeline-screen.tsx
src/app/timeline/page.tsx

src/lib/diary/get-on-this-day-page-data.ts
src/components/diary/on-this-day-screen.tsx
src/app/on-this-day/page.tsx

src/lib/diary/entry-date.ts
```

### Memory Creation and Actions

```txt
src/components/create/create-memory-screen.tsx
src/app/actions/memories.ts
src/app/create/memory/page.tsx
```

### Profile

```txt
src/app/actions/profile.ts
src/lib/profile/get-profile-page-data.ts
src/lib/profile/get-public-profile-page-data.ts
src/app/settings/profile/page.tsx
src/components/profile/edit-profile-screen.tsx
src/components/profile/profile-screen.tsx
src/components/profile/public-profile-screen.tsx
```

### Home

```txt
src/components/home/home-screen.tsx
src/lib/memories/get-home-feed.ts
src/app/home/page.tsx
```

### Vault

```txt
src/lib/memories/get-vault-entries.ts
src/components/vault/vault-screen.tsx
src/app/vault/page.tsx
```

### Messaging

```txt
src/app/actions/messages.ts
src/lib/messages/get-messages-data.ts
src/components/messages/message-thread-screen.tsx
src/components/messages/message-composer.tsx
src/components/messages/realtime-message-list.tsx
src/components/messages/start-conversation-button.tsx
src/app/messages/page.tsx
src/app/messages/[username]/page.tsx
```

### Media

```txt
src/lib/media/upload-media.ts
src/lib/media/delete-media.ts
```

### Moments

```txt
src/app/create/moment/page.tsx
src/components/create/create-moment-screen.tsx
src/app/actions/moments.ts
src/components/moments/*
src/app/api/cron/cleanup-expired-moments/route.ts
```

---

## 31. Important Instructions for Future Agents

When continuing this project:

1. Do not treat Memories as only a social app.
2. Diary is the main product; social is additional.
3. Keep navigation simple.
4. Do not overload mobile bottom navigation.
5. Keep the top navbar clean.
6. Do not add unnecessary subtitle text in top navbar.
7. Use grouped navigation config instead of hardcoding links in multiple places.
8. Prefer updating the specific split layout component instead of the whole layout.
9. Always think about R2 storage cleanup when adding upload/delete features.
10. Use `entry_date` for diary organization, not only `created_at`.
11. Vault entries are private and should not be treated like public memories.
12. UI should be premium, clean, and spacious, but not wasteful.
13. Before adding more features, plan the UX carefully.
14. Do not dump too many features into one screen.
15. Always keep mobile responsiveness in mind.

---

## 32. Suggested Next Steps

Possible next development steps:

### Step 7.9 — Mood Insights Dashboard

Build a mood insights page/section using diary moods.

Features:

- Mood frequency this month
- Most common mood
- Mood calendar heat/dots
- Mood trend over time
- Entries filtered by mood

### Step 7.10 — Daily Prompt System

Add daily writing prompts to encourage users.

Features:

- Daily question
- Quick answer
- Save as Memory or Vault
- Prompt history

### Step 7.11 — Search Across Diary

Build a private diary search.

Features:

- Search memories, vault, tags, moods
- Filter by date/month/type
- Search results with privacy labels

### Step 7.12 — R2 Orphan Media Cleanup

Create a storage cleanup system.

Features:

- Find uploaded media not linked to any Memory/Moment/Profile
- Delete stale orphan media after safe delay
- Cron endpoint
- Admin logs

---

## 33. Current Product Summary for an Agent

Memories is a Next.js + Supabase + Cloudflare R2 application focused on building a private-first diary and memory platform. The user has already developed authentication, profile completion, profile editing, public profile, follow system, home feed, moments, messaging, likes/reflections, and many diary features. Recently, the project direction shifted strongly toward diary-first improvements. A diary dashboard, full calendar, day view, timeline, On This Day, entry_date-based memory writer, and better navigation system have been added or planned.

The app now uses a split layout architecture with grouped desktop sidebar navigation and simplified mobile bottom navigation. Mobile has only Home, Dashboard, Create, Calendar, and Menu. All secondary pages are grouped inside a full-screen mobile menu. The top navbar should stay clean: app name on mobile, greeting on desktop, no extra subtitle text.

The most important future principle is to make Memories feel like a world-class personal diary product first, and a social memory platform second.
