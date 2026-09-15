---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - src/pages/WorkspacePage.jsx
  - src/components/workspace/Sidebar.jsx
  - src/lib/routes.js
supersedes: none
extends: _bmad-output/planning-artifacts/epics.md
---

# Vibe Hub — Workspace Home Dashboard Epic Breakdown

## Overview

Today, opening `/app` drops the visitor straight into the AI assistant tab (`DEFAULT_TAB =
'ia'`, `lib/routes.js`) — there is no overview, no "welcome back", no at-a-glance summary of
where they left off. This document adds the epic needed to give the Workspace a proper
"Accueil" (home) entry point: a dashboard-style landing tab that summarizes course progress,
surfaces recent notifications, and highlights available tools — each pointing into the
existing tab it summarizes, rather than duplicating that tab's functionality.

## Requirements Inventory

### Functional Requirements

FR-21: Workspace home dashboard — opening `/app` with no `?tab=` lands the visitor on a new
"Accueil" overview instead of directly on the AI assistant. It shows: how many published
courses they've completed and a way to resume where they left off, a preview of their most
recent notifications, and which tools are currently available to use — each section links into
the corresponding existing tab (Cours / Notifications / Outils) rather than reimplementing it.
Deep links that already target a specific tab (`/app?tab=ia`, `?tab=modules`, etc.) are
unaffected.

### Additional Requirements (Architecture)

No new AD is introduced. This epic only composes data already served through existing,
governed paths: `getCourses()` (`services/supabase.js`, AD-2 — the only importer of the
Supabase SDK), the `progress_courses` localStorage key (AD-6's second persistence tier,
already read by `ModulesTab.jsx` — Accueil reads the same key, it does not add a third tier),
`useNotifications()` (existing hook, already used by `Sidebar.jsx`/`NotificationsTab.jsx`), and
the shared `TOOLS` catalogue (`src/data/tools.js`, already the single source of truth since
Epic 6 Story 6.2). No new Supabase table, no new Edge Function, no new external host, no new
write path — purely a read-only composition tab.

### FR Coverage Map

FR-21: Epic 12 — Stories 12.1 (entry point), 12.2 (progress card), 12.3 (notifications + tools
cards)

## Epic List

### Epic 12: Workspace Home Dashboard
A visitor opening the Workspace lands on an overview of their own activity — course progress,
recent notifications, available tools — instead of being dropped straight into the AI chat,
with one click into whichever area they actually want to work in.
**FRs covered:** FR-21
**Implementation notes:** New tab `accueil`, added to `WORKSPACE_TABS` (`lib/routes.js`) and
`Sidebar.jsx`'s `TABS`, becomes the new `DEFAULT_TAB`. New component
`src/components/workspace/tabs/AccueilTab.jsx`. No backend change.

---

## Epic 12: Workspace Home Dashboard

**Status: done — shipped 2026-09-15.**

### Story 12.1: Add the "Accueil" Tab as the Workspace's New Entry Point

As a visitor opening the Workspace,
I want to land on an overview instead of directly inside the AI chat,
So that I get my bearings before diving into one specific area.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** `/app` is opened with no `?tab=` query parameter
**When** the Workspace loads
**Then** the new "Accueil" tab is shown — `DEFAULT_TAB` (`lib/routes.js`) changes from `'ia'`
to `'accueil'`

**Given** an existing deep link that already targets a specific tab (`/app?tab=ia`,
`?tab=modules`, `?tab=outils`, `?tab=notifications`)
**When** it is opened
**Then** behavior is unchanged — `appHref()`/`tabFromSearch()` already key off `DEFAULT_TAB`
generically, so only the constant's value changes, no call-site logic

**Given** the desktop sidebar and the mobile bottom nav
**When** they render `Sidebar.jsx`'s `TABS` array
**Then** "Accueil" appears first, before "Cours", with its own icon (not reusing an existing
tab's icon) — consistent with the existing `TabIcon` pattern (Lucide icon or a Material Symbol,
whichever renders better at both nav sizes)

**Given** the new tab has no content yet at this story's scope
**When** it renders
**Then** it shows at minimum a welcome heading — the summary cards are Stories 12.2/12.3,
built on top of this shell so each can ship and be tested independently

**Implementation:** `src/lib/routes.js` (`WORKSPACE_TABS`, `DEFAULT_TAB` now `'accueil'`),
`src/components/workspace/Sidebar.jsx` (`TABS`, `Home` icon, first position — desktop nav and
mobile bottom nav both pick it up automatically since they share the same array),
`src/components/workspace/tabs/AccueilTab.jsx` (new), `src/pages/WorkspacePage.jsx` (mounts the
new tab alongside the existing four, same always-mounted/hidden pattern so switching tabs never
re-fetches). Verified live via Playwright: `/app` with no query param lands on Accueil, existing
`?tab=` deep links unaffected, desktop (1400px) and mobile (390px) layouts both checked.

### Story 12.2: Course Progress Summary Card

As a returning visitor,
I want to see how many courses I've completed and jump back into the next one,
So that I don't have to reopen the Cours tab just to remember where I left off.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the Accueil tab loads
**When** it fetches course data
**Then** it calls `getCourses()` (published-only, same call `ModulesTab.jsx` already makes —
no new service function) and reads the existing `progress_courses` localStorage key the same
way `ModulesTab.jsx` does, to compute "X/Y cours terminés"

**Given** at least one published course is not yet marked complete
**When** the card renders
**Then** it shows a "Reprendre" CTA naming the next incomplete course (by catalogue order) that
navigates to the Cours tab on click — this story does not require deep-linking into that
specific course's detail view, only landing on the Cours tab, to keep scope achievable without
changing `ModulesTab.jsx`'s internals

**Given** every published course is already marked complete, or there are no published courses
at all
**When** the card renders
**Then** it shows an appropriate completion/empty state instead of a broken or misleading
"Reprendre" CTA

**Given** `getCourses()` fails (network error, RLS misconfiguration)
**When** the card renders
**Then** it degrades to a clear inline error state — never a blank card, never an uncaught
exception reaching the ErrorBoundary for a summary widget

**Given** all five Workspace tabs stay mounted permanently and merely toggle `hidden`
(`WorkspacePage.jsx`'s established pattern, so switching tabs never re-fetches)
**When** a course is marked complete in the Cours tab while Accueil sits hidden in the
background, and the visitor then switches back to Accueil
**Then** the progress count reflects the change — found during implementation: a naive
`useMemo(() => getPersistedCourseProgress(), [])` (read once at mount) would show the stale
pre-completion count indefinitely, since Accueil never remounts. Fixed by re-reading
`localStorage` whenever the new `active` prop (`activeTab === 'accueil'`) transitions to
`true`, not just on first mount

**Implementation:** `src/lib/progress.js` (new — `PROGRESS_LS_KEY` + `getPersistedCourseProgress()`
extracted out of `ModulesTab.jsx`, which now imports it too, so the key/parsing logic has one
source of truth instead of drifting between the two tabs, per the `extractYouTubeVideoId()`
precedent from Epic 10 Story 10.4), `src/components/workspace/tabs/AccueilTab.jsx` (progress
card, `active` prop). Tests: `src/lib/progress.test.js`, `src/components/workspace/tabs/
AccueilTab.test.jsx` (includes a regression test for the stale-progress-on-hidden-tab bug
above, mirroring the `ModulesTab.test.jsx` AD-6 regression test's spirit).

### Story 12.3: Notifications Preview and Available-Tools Cards

As a returning visitor,
I want a quick preview of my recent notifications and which tools I can actually use today,
So that the home tab is a genuine overview, not just a course-progress widget.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the Accueil tab loads
**When** it reads notification state
**Then** it uses the existing `useNotifications()` hook (no new fetch/service) to show the
unread count and up to 3 most recent notifications, with a "Voir tout" link that navigates to
the Notifications tab

**Given** an anonymous visitor (no Supabase session — notifications require auth per Epic 7's
progressive gate)
**When** the notifications card renders
**Then** it shows an appropriate signed-out state (e.g. inviting them to sign in via the
Notifications tab) rather than an empty list that looks like "you have no notifications"

**Given** the shared `TOOLS` catalogue (`src/data/tools.js`)
**When** the tools card renders
**Then** it lists tools with `status === 'live'` as directly launchable (link to the Outils
tab), and if none are live, shows a "Bientôt disponible" placeholder instead of an empty card —
today that means only "UI Builder" appears live

**Given** both new cards
**When** they are added
**Then** they follow the same loading/error/empty-state conventions already established by
`WaitlistView`/`AiUsageView` in `AdminPage.jsx` — consistent posture across the codebase, not a
new pattern invented for this tab

**Implementation:** `src/components/workspace/tabs/AccueilTab.jsx` (notifications card, tools
card), `src/pages/WorkspacePage.jsx` (passes `onNavigate={setActiveTab}` into `AccueilTab`, same
prop already passed into `NotificationsTab`). Tests: `src/components/workspace/tabs/
AccueilTab.test.jsx` (`useNotifications()` mocked as a boundary — it already has its own suite
in `useNotifications.test.js` — covering: signed-out prompt, recent-notifications list +
unread-count CTA, live-tools listing). Verified live via Playwright against the real dev build
(no mocks): anonymous "Se connecter" state confirmed, tools card correctly lists "UI Builder"
from the real `TOOLS` catalogue.
