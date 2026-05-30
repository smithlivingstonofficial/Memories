# Memories Project Context & Development Handoff

_Last updated: 2026-05-30_

This document explains what has been built so far in the **Memories** project, how the current system works, and what the next AI agent/developer should know before continuing development.

---

## 1. Product Overview

**Memories** is a premium, privacy-first diary + social memory platform.

The product is not intended to feel like a basic social media clone. It should feel:

- Premium
- Calm
- Emotional
- Privacy-first
- Professional
- Mobile-first
- World-class SaaS/social product quality

### Core Product Concept

Users can:

- Save personal life memories
- Write private diary-style entries
- Upload photos/videos
- Share selected memories with trusted people
- Keep private memories in a Vault
- Discover public memories from others
- Save important memories as Keepsakes
- Manage trusted people through Inner Circle

---

## 2. Product Naming System

The product avoids normal social media naming where possible.

| Common Social Term | Memories Product Term |
|---|---|
| Post | Memory |
| Story | Moment |
| Private Diary | Vault |
| Saved | Keepsakes |
| Close Friends | Inner Circle |
| Comments | Reflections |
| Likes | Likes |
| Explore | Discover |
| Profile | Profile |

---

## 3. Current Tech Stack

The project is being built with:

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI System | Fully custom components |
| Icons | Lucide React |
| Animation | Framer Motion |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Media Storage | Cloudflare R2 |
| Deployment Target | Vercel or Cloudflare Pages |

### Important Design Decision

We intentionally decided **not to use shadcn/ui**.

Reason: Memories needs its own unique visual identity instead of looking like a common dashboard template. All UI components are custom-built.

---

## 4. Current Visual Design System

### Design Feel

The current UI direction is:

- Soft glass UI
- Emotional minimalism
- Smooth rounded cards
- Premium shadows
- Off-white backgrounds
- Purple/indigo accent
- Calm gradients
- Clean spacing
- Mobile-first layouts

### Color Tokens

Current preferred palette:

```txt
Background:       #F8FAFC
Primary Text:     #0F172A
Secondary Text:   #64748B
Accent:           #6366F1
Soft Lavender:    #EEF2FF
Soft Rose:        #FFE4E6
Vault Dark:       #0F172A
Safe Green:       #10B981
Inner Circle Gold:#F59E0B
```

### Font System

The project uses a more premium custom font pairing:

```txt
Main UI Font:     Plus Jakarta Sans
Brand/Heading:    Sora
```

The fonts are configured in:

```txt
src/app/layout.tsx
```

Global utility classes were added:

```css
.font-brand {
  font-family: var(--font-sora), var(--font-jakarta), system-ui, sans-serif;
}

.font-ui {
  font-family: var(--font-jakarta), system-ui, sans-serif;
}
```

---

## 5. Current Folder Structure

Current important structure:

```txt
src/
  app/
    actions/
      auth.ts
      memories.ts

    api/
      media/
        presign/
          route.ts
        confirm/
          route.ts

    auth/
      callback/
        route.ts

    complete-profile/
      page.tsx

    create/
      page.tsx

    home/
      page.tsx

    login/
      page.tsx

    signup/
      page.tsx

    page.tsx
    layout.tsx
    globals.css

  components/
    auth/
      auth-shell.tsx
      login-screen.tsx
      signup-screen.tsx
      complete-profile-screen.tsx

    create/
      create-memory-screen.tsx

    home/
      home-screen.tsx

    layout/
      app-layout.tsx

    ui/
      button.tsx
      input.tsx
      badge.tsx
      glass-panel.tsx

  lib/
    media/
      upload-media.ts

    memories/
      get-home-feed.ts

    supabase/
      client.ts
      server.ts
      proxy.ts

    r2.ts
    utils.ts

  types/
    memory.ts
```

---

## 6. Authentication Flow

The authentication system has been changed from normal email signup to **Google-first signup**.

### Final Signup/Login Requirement

#### Signup

First-time account creation must happen through Google.

```txt
/signup
  ↓
Sign up with Google
  ↓
Supabase OAuth callback
  ↓
/complete-profile
  ↓
Set username, full name, mobile number, strong password
  ↓
/home
```

#### Login

Existing users can login in two ways:

```txt
/login
  ├─ Continue with Google
  └─ Google email + Memories password
```

The password is created only after Google verification during complete profile setup.

### Why This Flow Exists

The user wanted:

1. Google signup to verify the account first.
2. After Google verification, ask the user to set a strong password.
3. Later, the user can login with:
   - Google, or
   - email + password

This helps when the user is on a device where their Google account is not available.

---

## 7. Auth Routes

### `/`

Currently shows the Login screen.

```tsx
import { LoginScreen } from "@/components/auth/login-screen";

export default function Page() {
  return <LoginScreen />;
}
```

### `/login`

Shows the Login screen.

### `/signup`

Shows the Google-only Signup screen.

### `/auth/callback`

Handles Supabase OAuth callback.

```txt
/auth/callback?next=/complete-profile
```

The callback exchanges the OAuth code for a Supabase session and redirects to the next page.

### `/complete-profile`

Protected page. If no session exists, redirect to `/login`.

If profile is already completed and password is set, redirect to `/home`.

### `/home`

Protected page. User must:

```txt
profile_completed = true
password_set = true
```

Otherwise user is redirected to `/complete-profile`.

---

## 8. Current Auth Files

### `src/app/actions/auth.ts`

Contains server actions for:

- Google OAuth action
- Complete profile action
- Email/password login action
- Logout action

Important behavior:

```txt
googleAuthAction()
  → Uses Supabase signInWithOAuth(provider: "google")
  → Redirects to /auth/callback?next=/complete-profile

completeProfileAction()
  → Validates username, full name, mobile number, password
  → Ensures user has Google identity
  → Updates Supabase Auth password
  → Updates private profile
  → Creates/updates public profile
  → Redirects to /home

loginAction()
  → Uses email + password sign in
  → Checks profile_completed and password_set
  → Redirects to /home or /complete-profile

logoutAction()
  → Signs out
  → Redirects to /login
```

---

## 9. Complete Profile UX

The complete profile page was converted from one long form into a step-by-step flow.

Current steps:

```txt
Step 1: Identity
  - Username
  - Full name

Step 2: Contact
  - Mobile number

Step 3: Password
  - Create password
  - Confirm password
  - Password strength checklist

Step 4: Finish
  - Review details
  - Enter Memories
```

Important UI decision:

For `/complete-profile`, the page uses:

```tsx
<AuthShell variant="centered">
```

So it does **not** show the left-side brand content on desktop. The form is centered on all screen sizes.

---

## 10. AuthShell Layout

`src/components/auth/auth-shell.tsx` supports two variants:

```tsx
variant?: "brand" | "centered"
```

### Brand Variant

Used for:

```txt
/login
/signup
```

Desktop layout:

```txt
Left side:
  Animated brand content

Right side:
  Login/signup card
```

Mobile/tablet:

```txt
Only the auth card is shown.
```

### Centered Variant

Used for:

```txt
/complete-profile
```

It centers the setup form and removes the left brand content.

---

## 11. AppLayout

`src/components/layout/app-layout.tsx` is the main authenticated app shell.

It includes:

- Desktop sidebar
- Collapsible sidebar
- Mobile bottom navigation
- Header
- Profile avatar
- Notification button
- Search shortcut
- Page content area

### Sidebar Collapse State

The sidebar collapsed state is stored locally using:

```txt
localStorage key:
memories-sidebar-collapsed
```

This means if the user collapses the sidebar, the preference remains after refresh.

### Desktop Sidebar Behavior

Expanded:

```txt
Width: 280px
Shows logo + product text
Shows icon + label nav items
Shows user card at bottom
```

Collapsed:

```txt
Width: about 86px
Looks like premium vertical icon dock
Only icons shown
Centered logo
Centered toggle button
Centered avatar
Hover tooltip shows nav label
```

### Mobile Navigation

Mobile uses a premium bottom nav:

```txt
Home
Discover
Create
Vault
Profile
```

The Create button is centered, elevated, and highlighted with purple.

---

## 12. Current App Routes in Navigation

Main navigation currently includes:

```txt
/home
/discover
/create
/vault
/profile
```

Secondary desktop sidebar items include:

```txt
/keepsakes
/inner-circle
/settings
```

Some routes may still need page shells later.

---

## 13. Supabase Database Tables Created So Far

The backend foundation includes the following tables.

### `profiles`

Private user profile table.

Stores private/sensitive account-related data:

```txt
id
username
full_name
mobile_number
avatar_url
bio
profile_completed
password_set
signup_method
created_at
updated_at
```

Important:

- `mobile_number` stays here.
- This table should only be readable/updatable by the owner.

### `public_profiles`

Public-safe profile data.

Used for displaying users in the feed, search, profile pages, etc.

```txt
id
username
full_name
bio
avatar_url
cover_url
is_searchable
created_at
updated_at
```

Important:

- This avoids exposing private fields like mobile number.
- Authenticated users can read public profiles.

### `inner_circle_members`

Tracks trusted user relationships.

```txt
id
owner_id
member_id
status
created_at
```

Status values:

```txt
pending
accepted
blocked
```

Used for Inner Circle privacy access.

### `media_assets`

Stores metadata for files uploaded to Cloudflare R2.

```txt
id
owner_id
bucket
object_key
public_url
file_name
mime_type
size_bytes
media_kind
purpose
visibility
upload_status
created_at
```

Media kind values:

```txt
image
video
audio
document
```

Purpose values:

```txt
profile_avatar
profile_cover
memory
moment
vault
```

Visibility values:

```txt
private
inner_circle
public
```

Upload status values:

```txt
pending
uploaded
failed
```

### `memories`

Stores the actual memory content.

```txt
id
owner_id
title
content
mood
privacy
location_name
tags
created_at
updated_at
```

Privacy values:

```txt
private
inner_circle
friends
public
vault
```

### `memory_media`

Connects memories to uploaded media assets.

```txt
id
memory_id
asset_id
owner_id
sort_order
created_at
```

---

## 14. Supabase RLS Rules Summary

### Profiles

Users can:

```txt
read own profile
insert own profile
update own profile
```

### Public Profiles

Authenticated users can read public profiles.

Users can insert/update only their own public profile.

### Memories

Users can read a memory if:

```txt
owner_id = auth.uid()
OR privacy = 'public'
OR privacy = 'inner_circle' and current user is accepted inner circle member
```

Users can insert/update/delete only their own memories.

### Media Assets

Users can read media if:

```txt
owner_id = auth.uid()
OR visibility = 'public'
OR visibility = 'inner_circle' and current user is accepted inner circle member
```

Users can insert/update/delete only their own media assets.

### Memory Media

Users can read memory media if the connected memory is readable.

Users can insert/update/delete only their own memory media rows.

---

## 15. Cloudflare R2 Integration

Cloudflare R2 is used for storing actual media files.

Supabase stores only metadata.

### Important Security Rule

Cloudflare R2 credentials must **never** be exposed to the browser.

The environment variables are server-only and should not start with `NEXT_PUBLIC_`.

Current `.env.local` required values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=
```

### R2 Token Requirement

The Cloudflare R2 token should use:

```txt
Permission:
Object Read & Write

Scope:
Specific bucket only
```

### Upload Flow

The upload flow is:

```txt
Client selects file
  ↓
Client calls /api/media/presign
  ↓
Next.js server verifies Supabase user
  ↓
Server creates R2 presigned PUT URL
  ↓
Server inserts media_assets row with upload_status = pending
  ↓
Client uploads directly to Cloudflare R2 using signed URL
  ↓
Client calls /api/media/confirm
  ↓
Server marks media_assets.upload_status = uploaded
```

---

## 16. Media API Routes

### `/api/media/presign`

File:

```txt
src/app/api/media/presign/route.ts
```

Responsibilities:

- Verify authenticated user
- Validate file name, type, size, purpose, visibility
- Generate R2 object key
- Create presigned PUT URL
- Insert row in `media_assets`
- Return upload URL and asset id

Current file limit:

```txt
25 MB
```

Allowed types currently include:

```txt
image/jpeg
image/png
image/webp
image/gif
video/mp4
video/webm
```

### `/api/media/confirm`

File:

```txt
src/app/api/media/confirm/route.ts
```

Responsibilities:

- Verify authenticated user
- Receive `assetId`
- Mark matching media asset as uploaded
- Return asset metadata

---

## 17. R2 Utility File

File:

```txt
src/lib/r2.ts
```

Current responsibilities:

- Create S3-compatible R2 client
- Store R2 bucket/public URL constants
- Generate signed read URLs using `GetObjectCommand`

Important function:

```ts
createSignedReadUrl(objectKey: string, expiresInSeconds = 300)
```

Private media is shown through signed read URLs.

Public media may use `public_url` if `CLOUDFLARE_R2_PUBLIC_URL` is configured.

---

## 18. Client Upload Helper

File:

```txt
src/lib/media/upload-media.ts
```

Function:

```ts
uploadMedia({
  file,
  purpose,
  visibility,
})
```

It handles:

```txt
1. Request presigned upload URL
2. Upload file directly to R2
3. Confirm upload with backend
4. Return asset id, object key, public URL
```

---

## 19. Create Memory Page

Route:

```txt
/create
```

File:

```txt
src/app/create/page.tsx
src/components/create/create-memory-screen.tsx
```

The page is protected through Supabase session/profile checks.

### Create Memory UI Includes

```txt
Title
Memory content
Mood selector
Privacy selector
Location
Tags
Media uploader
Live preview
Save as Draft button
Save Memory button
```

### Create Memory Backend Action

File:

```txt
src/app/actions/memories.ts
```

Server action:

```ts
createMemoryAction()
```

Responsibilities:

- Validate form input
- Verify authenticated user
- Verify profile completed/password set
- Verify uploaded media belongs to user and upload is complete
- Update media purpose/visibility based on selected memory privacy
- Insert into `memories`
- Insert into `memory_media`
- Redirect to `/home`

---

## 20. Home Feed

Route:

```txt
/home
```

Files:

```txt
src/app/home/page.tsx
src/components/home/home-screen.tsx
src/lib/memories/get-home-feed.ts
src/types/memory.ts
```

The home feed now displays **real memories from Supabase**, not dummy data.

### Home Data Flow

```txt
/home page
  ↓
get current Supabase user
  ↓
fetch private profile
  ↓
check profile_completed and password_set
  ↓
getHomeFeed(supabase)
  ↓
fetch memories visible under RLS
  ↓
fetch public_profiles for authors
  ↓
fetch memory_media + media_assets
  ↓
generate signed R2 read URLs if needed
  ↓
render HomeScreen(memories)
```

### `getHomeFeed`

File:

```txt
src/lib/memories/get-home-feed.ts
```

Responsibilities:

- Fetch recent memories
- Fetch author public profiles
- Fetch attached media
- Generate signed R2 read URL for private/non-public media
- Return normalized `FeedMemory[]`

### FeedMemory Type

File:

```txt
src/types/memory.ts
```

Important shape:

```ts
type FeedMemory = {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  privacy: "private" | "inner_circle" | "friends" | "public" | "vault";
  locationName: string | null;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
  media: FeedMemoryMedia[];
};
```

---

## 21. Current Home UI

Home includes:

```txt
Moments row
Real memory cards
Right desktop Vault/reflection widgets
Empty feed state
Mobile bottom nav
Desktop collapsible sidebar
```

Memory card shows:

```txt
Author avatar
Author name
Username/date
Media image/video
Mood
Privacy badge
Title
Content
Tags
Like button
Reflect button
Keepsake button
```

Like/Reflect/Keepsake buttons are currently UI-only and not connected yet.

---

## 22. Current Known Limitations

These features are not completed yet:

```txt
Likes backend
Reflections backend
Keepsakes backend
Moments backend
Vault page backend
Discover page backend
Profile page backend
Inner Circle request flow
Notifications backend
Search backend
Edit profile page
Forgot password flow
Signed read API route for longer-lived media viewing
Delete uploaded orphan media
Draft memories
Media deletion from R2
Profile avatar upload
Profile cover upload
Production R2 public/custom domain setup
```

---

## 23. Recommended Next Steps

The next logical step is:

```txt
Step 3.4 — Build Memory Detail Page + Reflections + Likes + Keepsakes foundation
```

Alternative next step:

```txt
Step 3.4 — Build Profile Page using public_profiles + user memories
```

Recommended order:

```txt
1. Memory Detail Page
2. Likes table + action
3. Reflections table + action
4. Keepsakes table + action
5. Profile page
6. Vault page
7. Discover page
8. Inner Circle page
9. Notifications
10. Search
```

Reason: Home feed already displays memories, so the next natural feature is opening a memory and interacting with it.

---

## 24. Important Development Rules for Future Agents

Follow these rules:

1. Do not expose Supabase service role key in frontend.
2. Do not expose Cloudflare R2 credentials in frontend.
3. Use server actions or API routes for secure mutations.
4. Use Supabase RLS for all user data access.
5. Keep private user data in `profiles`.
6. Keep public-safe profile data in `public_profiles`.
7. Store only media metadata in Supabase.
8. Store actual files in Cloudflare R2.
9. Use signed read URLs for private media.
10. Use localStorage only for UI preferences, not security data.
11. Keep UI consistent with the premium Memories design system.
12. Do not make the product look like a basic social media clone.
13. Mobile-first design is important.
14. Desktop should use space efficiently with sidebar and right widgets.
15. Avoid adding unnecessary content just to fill space.
16. Preserve the naming system: Memory, Moment, Vault, Keepsakes, Inner Circle, Reflections, Discover.

---

## 25. Quick Setup Checklist for a New Agent

Before continuing, verify:

```txt
.env.local exists
Supabase URL/key configured
Cloudflare R2 keys configured
R2 bucket CORS configured
Google provider configured in Supabase
Auth callback route working
profiles table exists
public_profiles table exists
memories table exists
media_assets table exists
memory_media table exists
inner_circle_members table exists
RLS enabled on all tables
/create can upload media
/home shows created memory
```

---

## 26. Current Working Flow

The current working end-to-end flow should be:

```txt
1. User opens /
2. Login screen appears
3. New user clicks signup
4. User signs up with Google
5. Supabase redirects to /auth/callback
6. App redirects to /complete-profile
7. User completes step-based profile setup
8. App saves private profile and public profile
9. User reaches /home
10. User opens /create
11. User writes memory
12. User uploads media to R2
13. Metadata is saved in Supabase
14. Memory is saved in Supabase
15. User redirects to /home
16. Home feed displays the real memory with signed R2 media URL
```

---

## 27. Current Project Identity

The project should always be treated as:

```txt
Product name: Memories
Product type: Premium privacy-first diary + social memory platform
Design style: Calm premium SaaS/social app
Core emotion: Remember life beautifully, privately, and meaningfully
```

