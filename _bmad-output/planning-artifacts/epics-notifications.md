---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/EXPERIENCE.md
  - src/assets/Notification/notification.html.txt
  - src/components/workspace/tabs/NotificationsTab.jsx
supersedes: none
extends: _bmad-output/planning-artifacts/epics.md
---

# Vibe Hub — Notification Center Epic Breakdown

## Overview

This document extends the v1 epic breakdown (`epics.md`, FR-1…FR-9) with the epics and
stories needed to make the **Notification Center** (`NotificationsTab.jsx`, route
`/app?tab=notifications`) a real feature rather than the current static mock. Every element on
the page — the notification list, "mark all as read", the per-notification action buttons, the
preference toggles, quiet hours, and the learning-reminder frequency — is presently local React
state with no persistence and no effect. The `Toggle` component works visually; nothing behind
it does.

The breakdown assumes the v1 Architecture Spine (AD-1…AD-6) still binds, and adds three new
invariants (AD-7…AD-9) scoped to notifications.

## Requirements Inventory

### Functional Requirements

FR-10: In-app notification center — a Workspace user sees a reverse-chronological list of their
own notifications (categories: new course, milestone/achievement, tool beta), each showing
category, title, relative time, and read/unread state. The list is fetched from Supabase, not a
hard-coded array; `NOTIFICATIONS` in `NotificationsTab.jsx` is retired as a data source.

FR-11: Notification triage — a user can mark a single notification as read, mark all as read,
and dismiss (archive) a notification. Each action persists and survives reload.

FR-12: Actionable notifications — each notification carries a target (`link`): an internal
deep-link (a specific course in the Modules tab, the Outils tab, etc.) or an external URL.
Activating a notification's action navigates to the target and marks that notification read in
the same interaction. The current `<button>` with no `onClick` does not satisfy this.

FR-13: Unread badge — wherever the bell icon appears (Workspace sidebar, Workspace mobile top
bar, Landing Page navbar), it shows a live count of unread notifications for the current user,
and the count updates without a full page reload when notifications change.

FR-14: Notification preferences — a user configures: per-category opt-in (Nouvelles Leçons,
Mises à jour Outils, Jalons & Progrès), an in-app master switch, an email-digest switch, a
quiet-hours window (from/to), and a learning-reminder frequency (daily / weekly / never).
Preferences persist per-user and are loaded on entry — not reset to defaults on reload.

FR-15: Preferences take effect — a category switched off hides that category's notifications
from the feed and suppresses its badge contribution; the in-app master switch off suppresses
the badge entirely; quiet hours suppress the badge (and any sound/animation) during the window
while notifications still accrue silently.

FR-16: Automated notification generation — system events create notifications: a course moving
to `published = true` (Admin) generates a "Nouveau Cours" notification; completing a course
module (per FR-3 progress) generates a "Succès" notification; a waitlisted tool going live
generates an "Outil Bêta"/"Disponible" notification. Without this, the feed is permanently
empty in production.

FR-17: Email digest & learning reminders — when the email-digest switch is on, a scheduled
server job sends a periodic digest of unread notifications to the user; when a learning-reminder
frequency is set, a scheduled server job creates a reminder notification at that cadence. Both
run server-side only.

### NonFunctional Requirements

NFR6: Per-user isolation — notification rows and preference rows are readable/writable only by
their owning user, enforced by Postgres RLS (the v2 realization of NFR1's "once auth ships,
per-user data must be isolated" clause). No notification or preference of one user is ever
visible to another.

NFR7: Cost & abuse containment for delivery — the email-digest and learning-reminder jobs are
rate-bounded (one digest per user per interval max; reminders capped at the chosen cadence) so
a misconfigured trigger cannot fan out unbounded email or row writes. Consistent with NFR4's
metered-endpoint discipline.

NFR8: Accessibility — the notification list, triage actions, badge, and every preference
control meet WCAG 2.1 AA (NFR3): full keyboard operability, visible AA-contrast focus rings
(including on the near-black "Préférences" card), the unread count exposed via `aria-live`, and
focus managed when a notification is dismissed from the list.

### Additional Requirements (Architecture — extends AD-1…AD-6)

- AD-7 (Architecture): Notifications and preferences are durable, per-user Supabase data,
  reached only through new wrappers in `services/supabase.js` (AD-2, AD-6) — no component
  imports `@supabase/supabase-js` for them. Cross-tree read access (the bell badge needs the
  same unread count the tab shows) is provided by a `useNotifications` hook that holds
  render-local state seeded from the service; this hook is **not** a global store (no Redux /
  Zustand / Context-as-store — AD-6 still binds) — it is a local subscription primitive in the
  spirit of the existing `onAuthChange` wrapper.
- AD-8 (Architecture): Notification *delivery* (email digest, learning reminders) and
  *generation from events* run only in Supabase Edge Functions and scheduled Postgres jobs
  (`pg_cron`), never client-side — the same "no privileged/background work in the browser"
  principle as AD-1. The client only reads notifications and writes read/dismissed/preference
  state.
- AD-9 (Architecture): Live badge updates use Supabase Realtime (`postgres_changes` on the
  user's `notifications` rows), subscribed to only inside a `services/supabase.js` wrapper and
  exposed as an unsubscribe-returning function (same shape as `onAuthChange`). Polling is the
  documented fallback when Realtime is unavailable; no third mechanism.
- AD-10 (Data convention): New tables follow the v1 conventions — `snake_case` columns, UUID
  `id`, `created_at timestamptz`. Notification ordering is by `created_at DESC` (this is the
  sanctioned exception to "never sort by `created_at`", which applies to *course* lists only —
  a notification feed is inherently chronological). Service functions `throw` on Postgres error
  (existing pattern); no new `{ success }`-style return shape is introduced.
- Migration/audit requirement: as with FR-4/FR-9, the first story creating notification tables
  must audit the live Supabase project's current schema and policies before assuming a clean
  slate — migration numbering continues from whatever `supabase/migrations/` currently holds.
- **Auth decision (recorded 2026-09-10):** per-user notifications require a stable `user_id`.
  The Workspace (`/app`) has no auth today (only `/admin` does). **Resolution: real Supabase
  auth on the Workspace, applied as a _progressive gate_.** `/app` stays open — the Modules,
  IA, and Outils tabs continue to work for anonymous visitors exactly as today, so **FR-1 and
  Story 1.2 ("enter the Workspace with no authentication barrier") remain valid and unchanged.**
  Only the per-user features — the Notification Center feed, notification preferences, and any
  cross-session persistent progress — require a signed-in account. An anonymous visitor sees a
  "Se connecter" affordance and, in the Notifications tab, a sign-in prompt in place of the
  feed. This is the v2 realization of NFR1's auth-isolation clause. See also the Post-v1
  Amendment in `ARCHITECTURE-SPINE.md`.

### UX Design Requirements (extends UX-DR1…UX-DR16)

UX-DR17: The Notification Center follows the Franc design system and the two-column bento
layout of the approved mockup (`src/assets/Notification/notification.html.txt`): left column
(~60%) the notification feed, right column (~40%) the preferences stack. It collapses to a
single column below `lg`, feed first.

UX-DR18: Notification cards are bento-style (rounded-[24px], category-tinted accent icon tile,
category chip in `label-caps`, relative time, soft chunky shadow on hover). Read notifications
render at reduced emphasis (`opacity-80`), not hidden. Category chip and accent-tile colors use
the computed WCAG-AA text rule (UX-DR2) — `on-surface` text on solid franc fills.

UX-DR19: Feed state patterns (mirroring UX-DR8): cold-load skeleton cards matching the bento
grid; an inline fetch-error retry state ("Impossible de charger les notifications." +
"Réessayer") — never a silent empty column; and a distinct "Vous êtes à jour." empty state when
the fetch succeeds with zero notifications.

UX-DR20: Triage affordances — a notification is marked read on activating its action or via an
explicit control; "Marquer tout comme lu" is a single pill action in the feed header; dismiss
is a per-card control (icon button with an accessible name) that removes the card with a
non-jarring transition and moves focus to the next card (or the header if the list empties).

UX-DR21: The preference controls are real, persistent, and reflect loaded values on entry: the
`Toggle` component (already built) for the master/email/category switches, native `time` inputs
for quiet hours, a native `select` for reminder frequency. Changing any control writes through
to storage (debounced for the free-form inputs); a write failure rolls the control back to its
prior value with an inline message.

UX-DR22: The bell unread badge is a small pill on the existing bell icon in all three
locations, showing the count (capped display, e.g. "9+"), with the live region announcing
changes; when the in-app master switch is off or quiet hours are active, the badge is
suppressed even though unread notifications exist.

UX-DR23: Voice/tone (UX-DR15) — notification copy is factual, collaborator-style French
("Nouvelle leçon disponible : …", "Tu as complété Module 2"), never gamified cheerleading; the
empty state is "Vous êtes à jour.", not "Bravo, boîte zéro ! 🎉".

### FR Coverage Map

FR-10: Epic 7 (data foundation) + Epic 8 (feed rendering & states)
FR-11: Epic 8 - Notification triage (single read / all read / dismiss)
FR-12: Epic 8 - Actionable notifications (deep-link + auto-read)
FR-13: Epic 8 - Unread badge across the three bell locations
FR-14: Epic 9 - Notification preferences persistence
FR-15: Epic 9 - Preferences take effect (filtering, master switch, quiet hours)
FR-16: Epic 9 - Automated notification generation from events
FR-17: Epic 9 - Email digest & learning-reminder scheduled jobs
NFR6:  Epic 7 - Per-user RLS on notification & preference tables

## Epic List

### Epic 7: Workspace Identity & Notification Data Foundation
A Workspace visitor has a durable identity, and the notification + preference data model,
per-user RLS, service-layer wrappers, and a shared unread-count hook all exist — the substrate
every later notification story builds on. The Notification Center feed reads real Supabase data
with proper loading / error / empty states.
**FRs covered:** FR-10 (data side), NFR6
**Implementation notes:** Resolves the Workspace-auth prerequisite (Story 7.1) that gates the
whole feature. Introduces AD-7 (service wrappers + non-store hook), AD-9 (Realtime wrapper),
AD-10 (data conventions). First migration story must audit the live Supabase schema/policies
(same rule as Epic 3).

### Epic 8: Notification Center Interactions
A user can triage and act on their notifications — mark one or all as read, follow a
notification to its target, and dismiss it — and see a live unread badge wherever the bell
appears, updating without a page reload.
**FRs covered:** FR-11, FR-12, FR-13
**Implementation notes:** All reads/writes go through the Epic 7 wrappers (AD-7). Badge updates
use the Realtime wrapper (AD-9) with polling fallback. No `supabase.*` in any component.

### Epic 9: Notification Preferences & Automated Delivery
Preferences persist per-user and actually govern what the user sees and receives — category
filtering, the in-app master switch, quiet hours — and server-side jobs generate notifications
from real events and send the email digest / learning reminders.
**FRs covered:** FR-14, FR-15, FR-16, FR-17
**Implementation notes:** Generation and delivery run only in Edge Functions + `pg_cron`
(AD-8); the client only persists preference state. Rate-bounded per NFR7.

---

## Epic 7: Workspace Identity & Notification Data Foundation

A Workspace visitor has a durable identity, and the notification + preference data model,
per-user RLS, service-layer wrappers, and a shared unread-count hook all exist. The Notification
Center feed reads real Supabase data with proper loading / error / empty states.

### Story 7.1: Real Supabase Auth on the Workspace (Progressive Gate)

As a Workspace visitor,
I want to sign in with a real account when I want my own notifications and preferences,
So that they are mine and follow me across sessions and devices — while still being able to
browse the Workspace without signing in.

**Decision (2026-09-10):** real Supabase auth on the Workspace, applied as a **progressive
gate** — anonymous browsing of Modules/IA/Outils stays exactly as today (FR-1, Story 1.2
unchanged); only per-user features require sign-in.

**Acceptance Criteria:**

**Given** an anonymous visitor entering `/app` from the Landing Page CTA
**When** the Workspace loads
**Then** it opens directly to the Modules/IA/Outils tabs with no auth barrier — FR-1 and
Story 1.2 are not regressed — and a "Se connecter" affordance is visible (e.g. in the sidebar
footer, replacing or beside the decorative "Profil" item)

**Given** an anonymous visitor opens the Notifications tab
**When** the tab renders
**Then** it shows a sign-in prompt ("Connecte-toi pour retrouver tes notifications et
préférences.") with a sign-in action, in place of the feed and preference panel — not an error,
not an empty feed

**Given** the sign-in flow
**When** a visitor authenticates
**Then** it uses Supabase Auth via **new `services/supabase.js` wrappers only** — the existing
`signIn` / `signOut` / `getSession` / `onAuthChange` (already specced for AD-2 in Epic 3) are
reused/extended; `services/supabase.js` gains `signUp` and `getCurrentUser()` as needed; no
component calls `supabase.auth.*` inline (AD-2)

**Given** a signed-in user returns in a new browser session or on another device
**When** they open the Workspace
**Then** their Supabase session restores (refresh token) and resolves to the same `user_id`,
and their notifications/preferences are the same

**Given** the auth method
**When** it is chosen (email+password, magic link, OAuth…)
**Then** the choice is recorded here; it must not reintroduce the Gemini/secret-in-bundle class
of problem (AD-1) and must satisfy WCAG 2.1 AA on the sign-in form (NFR8, UX-DR14)

**Given** `AdminPage.jsx` already does its own Supabase auth
**When** Workspace auth ships
**Then** both surfaces go through the same `services/supabase.js` auth wrappers — the AD-2
refactor in Story 3.1 and this story converge on one auth adapter, not two

**Given** identity is a hard dependency of Stories 7.2+
**When** this story is not yet done
**Then** those stories remain blocked

**Given** any new auth wrapper / hook
**When** it is added
**Then** it begins with `// @ts-check` and ships with unit tests (coverage ≥ 80%)

### Story 7.2: Notification & Preference Schema with Per-User RLS

As the platform,
I want `notifications` and `notification_preferences` tables with per-user row security,
So that each user's notification data is isolated and durable.

**Acceptance Criteria:**

**Given** `supabase/migrations/` holds the project's existing migrations
**When** this story begins
**Then** the live Supabase schema and policies are audited first, and the new migration is
numbered to continue the existing sequence — no clean slate is assumed (same rule as Story 3.2)

**Given** a new migration
**When** it is applied
**Then** it creates `notifications` (`id uuid`, `user_id`, `category` enum/text, `title`,
`body`, `link`, `read boolean default false`, `dismissed boolean default false`,
`created_at timestamptz default now()`) and `notification_preferences` (`user_id` PK,
`app_enabled`, `email_enabled`, per-category booleans, `quiet_from time`, `quiet_to time`,
`reminder_frequency text`), with `snake_case` columns and UUID ids (AD-10)

**Given** RLS is enabled on both tables
**When** a user queries or mutates rows
**Then** they can only `SELECT`/`UPDATE` `notifications` where `user_id` = their id, only
`UPDATE` the `read`/`dismissed` columns (not `title`/`body`/`link`), and only read/write their
own `notification_preferences` row (NFR6) — another user's rows are never returned

**Given** notification *creation*
**When** the insert path is defined
**Then** clients have no direct `INSERT` on `notifications`; rows are created only by
server-side event handlers / Edge Functions (AD-8) — enforced by RLS, not client convention

**Given** a user with no preferences row yet
**When** their preferences are first read
**Then** a default row is materialized (all categories on, app on, email off,
quiet 22:00–08:00, reminder weekly) — the read path never returns null-shaped preferences

### Story 7.3: Notification Service Wrappers

As a developer,
I want notification operations exposed as `services/supabase.js` functions,
So that no component ever touches the Supabase client for notifications (AD-2, AD-7).

**Acceptance Criteria:**

**Given** the service adapter layer
**When** this story is done
**Then** `services/supabase.js` exports `getNotifications()`, `markNotificationRead(id)`,
`markAllNotificationsRead()`, `dismissNotification(id)`, `getNotificationPreferences()`, and
`updateNotificationPreferences(patch)` — each `throw`ing on Postgres error (no new return
shape, AD-10)

**Given** `getNotifications()`
**When** it returns
**Then** rows are ordered `created_at DESC` (AD-10), scoped to the current user by RLS, and
exclude `dismissed = true` rows

**Given** `isSupabaseConfigured()` is false (local dev without Supabase)
**When** any wrapper is called
**Then** it degrades gracefully to a `localStorage`-backed stub (demo notifications + locally
persisted preferences) so the tab remains usable offline — consistent with how `addToWaitlist`
guards on configuration

**Given** each new wrapper
**When** it is added
**Then** it starts with `// @ts-check` and has unit tests covering the happy path, the
Postgres-error throw, and the unconfigured-fallback branch (coverage ≥ 80%)

### Story 7.4: Shared Unread-Count Hook

As a developer,
I want a `useNotifications` hook that both the tab and the bell badge read from,
So that the unread count is consistent everywhere without introducing a global store.

**Acceptance Criteria:**

**Given** the bell icon (sidebar, mobile top bar, landing navbar) and the Notification Center
tab both need the unread count
**When** this story is done
**Then** a `hooks/useNotifications.js` exposes `{ authenticated, notifications, unreadCount,
loading, error, refetch, markRead, markAllRead, dismiss }`, seeded from the Story 7.3 wrappers

**Given** the current visitor is not signed in (Story 7.1 progressive gate)
**When** a consumer reads the hook
**Then** `authenticated` is false, `unreadCount` is 0, and `notifications` is empty — no fetch
is attempted and no error is raised; consumers branch on `authenticated` (bell shows no badge;
tab shows the sign-in prompt)

**Given** AD-6 forbids a global state manager
**When** the hook is implemented
**Then** it holds render-local `useState` seeded from the service and (Story 8.6) a Realtime
subscription — it is a subscription primitive, not a Redux/Zustand/Context-as-store; multiple
consumers each hold their own instance kept in sync via the shared Realtime channel / refetch

**Given** the hook is new logic
**When** it is added
**Then** it begins with `// @ts-check` and has tests (coverage ≥ 80%)

### Story 7.5: Real Notification Feed Replaces the Mock

As a designer,
I want the Notification Center to show my actual notifications with proper loading and error
handling,
So that the tab reflects reality instead of a hard-coded list.

**Acceptance Criteria:**

**Given** `NotificationsTab.jsx` currently renders a hard-coded `NOTIFICATIONS` array
**When** this story is done
**Then** the feed renders from `useNotifications()` and the `NOTIFICATIONS` constant is deleted
— no component holds notification content inline

**Given** `useNotifications()` reports `authenticated: false` (Story 7.1 progressive gate)
**When** the Notifications tab renders
**Then** it shows the sign-in prompt (Story 7.1) instead of the feed, skeleton, error, or empty
state — the feed states below only apply to a signed-in user

**Given** the feed is fetching on cold load
**When** the request is in flight
**Then** skeleton cards matching the bento grid are shown (UX-DR19), not a spinner and not a
blank column

**Given** the fetch fails
**When** the error surfaces
**Then** an inline "Impossible de charger les notifications." + "Réessayer" retry state is
shown (UX-DR19) — never a silent empty column

**Given** the fetch succeeds with zero notifications
**When** the feed renders
**Then** a distinct "Vous êtes à jour." empty state is shown (UX-DR19, UX-DR23), separate from
the error state

**Given** notifications are displayed
**When** the header count renders
**Then** it reads the real `unreadCount` ("Vous avez N nouvelle(s) alerte(s) à consulter.") and
is wrapped in an `aria-live` region (NFR8)

**Given** the feed on mobile
**When** viewed below `lg`
**Then** it collapses to a single column, feed first (UX-DR17), with 44px minimum tap targets
(UX-DR16)

---

## Epic 8: Notification Center Interactions

A user can triage and act on their notifications — mark one or all as read, follow a
notification to its target, and dismiss it — and see a live unread badge wherever the bell
appears.

### Story 8.1: Mark a Single Notification as Read

As a user,
I want a notification to become "read" when I engage with it,
So that my unread count reflects what I've actually seen.

**Acceptance Criteria:**

**Given** an unread notification in the feed
**When** I activate it (click the card / its action, or an explicit "marquer comme lu" control)
**Then** `markNotificationRead(id)` is called, the card moves to the read style (`opacity-80`,
UX-DR18), and the unread count decrements — optimistically, rolled back with an inline message
if the write fails

**Given** the change persisted
**When** I reload the page
**Then** the notification is still read

**Given** keyboard-only use
**When** I Tab to a notification and press Enter/Space
**Then** the same read behavior occurs, with a visible AA-contrast focus ring (NFR8)

### Story 8.2: Mark All Notifications as Read

As a user,
I want one action to clear my unread count,
So that I can dismiss a backlog quickly.

**Acceptance Criteria:**

**Given** one or more unread notifications
**When** I activate "Marquer tout comme lu" in the feed header
**Then** `markAllNotificationsRead()` is called, every card moves to the read style, the unread
count goes to 0, and the header copy switches to "Vous êtes à jour." — optimistic, rolled back
on failure

**Given** zero unread notifications
**When** the feed renders
**Then** "Marquer tout comme lu" is disabled or hidden (no-op affordance is not shown as active)

**Given** the change persisted
**When** I reload or open the tab on another device (real-auth identity)
**Then** all notifications are read

### Story 8.3: Act on a Notification

As a user,
I want a notification's action button to take me to what it's about,
So that the notification is useful, not just informational.

**Acceptance Criteria:**

**Given** a notification carries a `link` (internal deep-link or external URL)
**When** I activate its action button ("Voir la leçon", "Voir ton progrès", "Consulter"…)
**Then** an internal link navigates within the app via `src/lib/routes.js` helpers (never a
hard-coded path — e.g. the Modules tab focused on a course id, the Outils tab), and an external
link opens per `NOUVEL_ONGLET` (`_blank` + `rel`), and in the same interaction the notification
is marked read (Story 8.1)

**Given** the current `<button type="button">` has no `onClick`
**When** this story is done
**Then** every action button has a working handler; a notification with no `link` shows no
action button rather than a dead one

**Given** the action button
**When** a screen-reader user reaches it
**Then** it has an accessible name that includes the destination context, not just "Voir"
(NFR8)

### Story 8.4: Dismiss a Notification

As a user,
I want to remove a notification I've dealt with,
So that my feed stays relevant.

**Acceptance Criteria:**

**Given** a notification card
**When** I activate its dismiss control (icon button with an accessible name, UX-DR20)
**Then** `dismissNotification(id)` sets `dismissed = true`, the card leaves the list with a
non-jarring transition, and it does not return on reload

**Given** the card is removed
**When** the DOM updates
**Then** focus moves to the next card, or to the feed header if the list is now empty (NFR8),
and the empty state (Story 7.5) shows if appropriate

**Given** a dismiss write fails
**When** the error surfaces
**Then** the card reappears in place with an inline "Réessayer" affordance — it is never
silently gone without a confirmed write

### Story 8.5: Unread Badge on the Bell

As a user,
I want the bell icon to show how many unread notifications I have,
So that I know to check without opening the tab.

**Acceptance Criteria:**

**Given** the bell icon appears in the Workspace sidebar, the Workspace mobile top bar, and the
Landing Page navbar
**When** I have unread notifications
**Then** each bell shows a small count pill (display capped, e.g. "9+"), reading `unreadCount`
from `useNotifications()` — the three locations never disagree

**Given** the count changes (I read something, or a new notification arrives)
**When** the change occurs
**Then** every visible badge updates without a full page reload, and the change is announced via
an `aria-live` region (NFR8, UX-DR22)

**Given** zero unread notifications
**When** the bells render
**Then** no badge is shown (not a "0")

**Given** the visitor is not signed in (Story 7.1 progressive gate)
**When** any bell renders (including the Landing Page bell that links into
`/app?tab=notifications`)
**Then** no badge is shown anywhere and no fetch is attempted — the bell still links through to
the Notifications tab, which shows the sign-in prompt (Story 7.1), never an error

### Story 8.6: Relative Timestamps and Live Refresh

As a user,
I want notification times to read naturally and the list to stay current,
So that the feed feels live, not stale.

**Acceptance Criteria:**

**Given** a notification has a `created_at`
**When** its card renders
**Then** the time shows as a localized relative string ("Il y a 2 h", "Hier") via
`Intl.RelativeTimeFormat` — the hard-coded `time` strings are removed — and it refreshes on an
interval while the tab is open

**Given** a new notification row is created for the current user (Epic 9 generators)
**When** the Notification Center tab or any bell is mounted
**Then** it appears / the badge increments via a Supabase Realtime subscription on the user's
`notifications` rows, wrapped in `services/supabase.js` and exposed unsubscribe-first (AD-9)

**Given** Realtime is unavailable
**When** the subscription cannot be established
**Then** the hook falls back to interval polling of `getNotifications()` — no third mechanism
(AD-9), and the fallback is logged via `lib/logger.js`

---

## Epic 9: Notification Preferences & Automated Delivery

Preferences persist per-user and actually govern what the user sees and receives, and
server-side jobs generate notifications from real events and send the digest / reminders.

### Story 9.1: Persist Notification Preferences

As a user,
I want my preference toggles to be remembered,
So that I set them once, not every visit.

**Acceptance Criteria:**

**Given** the preferences panel (master switch, email switch, category switches, quiet hours,
reminder frequency)
**When** the Notification Center loads
**Then** every control reflects the values from `getNotificationPreferences()` — not the
component's hard-coded defaults

**Given** I change any control
**When** the change settles (immediately for switches, debounced for `time` inputs and the
`select`)
**Then** `updateNotificationPreferences(patch)` persists it, and a reload shows the new value

**Given** a preference write fails
**When** the error surfaces
**Then** the control rolls back to its prior value with an inline message (UX-DR21) — the UI
never shows a state that isn't saved

**Given** `isSupabaseConfigured()` is false
**When** I change a preference
**Then** it persists to `localStorage` under a feature-prefixed key (AD-6) and still round-trips
on reload

### Story 9.2: Category Toggles Filter the Feed

As a user,
I want turning a category off to actually stop those notifications,
So that the switches mean something.

**Acceptance Criteria:**

**Given** I turn off a category (e.g. "Mises à jour Outils")
**When** the feed re-renders
**Then** notifications of that category are hidden from the list and excluded from
`unreadCount` / the badge (FR-15)

**Given** I turn the category back on
**When** the feed re-renders
**Then** its notifications (including ones that arrived while it was off) reappear in
chronological position

**Given** category filtering
**When** it is applied
**Then** it is applied consistently in the feed and in every bell badge (they read the same
filtered `unreadCount`)

### Story 9.3: Master Switch and Quiet Hours Suppress the Badge

As a user,
I want an off master switch or an active quiet-hours window to silence the badge,
So that I control when I'm nudged.

**Acceptance Criteria:**

**Given** the in-app master switch is off
**When** any bell renders
**Then** no badge is shown regardless of unread count, and the Notification Center still lists
notifications (the switch silences the nudge, not the record) — FR-15, UX-DR22

**Given** the current local time is inside the quiet-hours window (`quiet_from`–`quiet_to`,
wrapping past midnight handled)
**When** a new notification arrives
**Then** it is added to the feed silently — no badge increment, no animation/sound — and the
badge "catches up" once the window ends

**Given** quiet hours are set to an empty/equal range
**When** evaluated
**Then** the feature is treated as off (no suppression), not "always suppressed"

### Story 9.4: Email Digest Channel

As a user,
I want an optional email summary of what I've missed,
So that I stay informed without opening the app.

**Acceptance Criteria:**

**Given** my email-digest switch is on and I have a real account with an email (Story 7.1
real-auth case)
**When** the scheduled digest job runs
**Then** a Supabase Edge Function (AD-8) sends one email listing my unread notifications since
the last digest, and never runs client-side

**Given** the digest job
**When** it executes for a user
**Then** it is rate-bounded to at most one digest per configured interval per user (NFR7), and
a send failure is logged and retried within limits, never fanned out

**Given** my email-digest switch is off, or I have no email (anonymous identity)
**When** the job runs
**Then** I receive nothing and no error is raised for my row

### Story 9.5: Learning-Reminder Scheduler

As a user,
I want periodic reminders to continue my courses,
So that I don't lose momentum.

**Acceptance Criteria:**

**Given** I set a reminder frequency (daily / weekly)
**When** the cadence elapses
**Then** a scheduled job (`pg_cron` + Edge Function, AD-8) creates a "Rappel"/"Succès"-category
notification for me at that cadence — appearing in my feed and (subject to Story 9.3) my badge

**Given** I set the frequency to "never"
**When** the scheduler runs
**Then** no reminder is created for me

**Given** the scheduler
**When** it creates reminders
**Then** it never creates more than one reminder per user per chosen interval (NFR7), and
reminder creation is idempotent if the job is retried

### Story 9.6: Event-Driven Notification Generation

As the platform,
I want real events to produce notifications,
So that the feed is populated in production, not empty.

**Acceptance Criteria:**

**Given** an Admin sets a course to `published = true` (Epic 3)
**When** the update commits
**Then** a "Nouveau Cours" notification is generated server-side (DB trigger or Edge Function,
AD-8) for the relevant recipients, carrying a `link` deep-linking to that course in the Modules
tab

**Given** a user completes a course module (FR-3 progress reaches completion)
**When** completion is recorded
**Then** a "Succès" notification is generated for that user with a `link` to their progress

**Given** a waitlisted tool goes live (Epic 6 "Bientôt disponible" → "Disponible")
**When** the transition occurs
**Then** an "Outil Bêta"/"Disponible" notification is generated for waitlist joiners with a
`link` to the Outils tab

**Given** all generation paths
**When** they create rows
**Then** they insert into `notifications` server-side only (clients have no `INSERT`, Story
7.2), set `category` to a value the feed and preference filters recognize, and respect the
recipient's category preferences at generation or read time (consistent with FR-15)

**Given** notification copy
**When** it is written by a generator
**Then** it follows the collaborator-style French register (UX-DR23) — factual, not gamified.
