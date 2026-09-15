---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/epics-ai-ops.md
  - src/pages/AdminPage.jsx
supersedes: none
extends: _bmad-output/planning-artifacts/epics.md
---

# Vibe Hub — Admin Dashboard Overview Epic Breakdown

## Overview

Today, logging into `/admin` drops the admin straight into the "Cours" CRUD list —
there's no single view that summarizes the three admin surfaces (cours, demande outils,
utilisation IA) at a glance. This document adds the epic needed to give `/admin` a proper
"Accueil" landing view: a compact overview pulling one highlight from each existing admin
view, each linking into the full view it summarizes.

**Note:** a first attempt at this epic (originally epic-12) was built against the wrong
target — the public Workspace (`/app`) instead of `/admin` — and was fully reverted
(commit `ed86850`) once the mistake was caught. This document and its epic number replace
that one; FR-21 (the reverted attempt's requirement) is retired unused.

## Requirements Inventory

### Functional Requirements

FR-22: Admin dashboard overview — logging into `/admin` lands the admin on a new "Accueil"
view (first pill in the nav) instead of directly on the Cours list. It shows: course
publishing stats (total/published/drafts), waitlist demand, and a 7-day Gemini token/cost
summary plus the key-rotation staleness flag — each section linking into the corresponding
existing view (Cours / Demande outils / Utilisation IA) rather than duplicating it.

FR-23: Richer Accueil content — added the same day, in response to Léandro asking for more on
the dashboard. Deepens two existing cards (top 3 tools by demand instead of 1, AI usage broken
down by endpoint instead of one combined total), adds quick actions ("Ajouter un cours",
"Voir le site") next to the page title, and adds a fourth card summarizing the Notification
Center (Epic 7-9) — the first admin-facing view of that data at all.

### Additional Requirements (Architecture)

No new AD. Pure read-composition of data the admin views already fetch through governed
paths: `getAllCourses()`, `getWaitlistCounts()` (AD-4, aggregate only), and
`getAiUsageSummary()`/`getLastKeyRotation()` (Epic 11, AD-12/AD-13). FR-23's notifications
card needed one new aggregate, `get_notifications_overview()` (migration 0015) — same posture
as the other two: `security definer`, `is_admin()`-filtered internally, zero rows for a
non-admin caller, never a per-user row or an email address (AD-4-equivalent guarantee, extended
to the notifications tables which previously had no admin-facing read path at all).

### FR Coverage Map

FR-22: Epic 13 — Stories 13.1 (entry point + course stats), 13.2 (demand + usage highlights)
FR-23: Epic 13 — Story 13.3 (richer cards, quick actions, notifications card)

## Epic List

### Epic 13: Admin Dashboard Overview
An admin logging into `/admin` sees a one-screen summary of courses, tool demand, and AI
usage before drilling into any one of them.
**FRs covered:** FR-22
**Implementation notes:** New `view: 'accueil'` in `Dashboard` (`AdminPage.jsx`), becomes the
default (replacing `'courses'`). New `AdminAccueilView` component in the same file, following
the `WaitlistView`/`AiUsageView` conventions already established. No backend change — reuses
`loadWaitlist()`/`loadAiUsage()` already defined, just triggers both eagerly when Accueil
opens instead of waiting for their own pill to be clicked.

---

## Epic 13: Admin Dashboard Overview

**Status: done — shipped 2026-09-15.**

### Story 13.1: Add the "Accueil" View as the Admin's New Entry Point, with Course Stats

As an admin,
I want to land on an overview when I log in instead of directly on the Cours list,
So that I see the state of the whole admin space before picking where to work.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** an admin logs in and lands on the Dashboard
**When** it first renders
**Then** the `view` state defaults to `'accueil'` (was `'courses'`) — "Accueil" is the first
pill in `AdminHeader`'s nav, before "Cours"

**Given** the Accueil view renders
**When** course data is available (`courses`, already fetched by the existing `load()` effect
— no new fetch)
**Then** it shows Total cours / Publiés / Brouillons and a "Voir les cours" CTA that switches
`view` to `'courses'`

**Given** the "Cours" view (unchanged CRUD list)
**When** it is reached via the Accueil CTA or its own pill
**Then** its behavior is identical to before this story — Accueil only adds a new landing
screen in front of it, nothing about course management itself changes

**Implementation:** `src/pages/AdminPage.jsx` (`Dashboard`'s `view` default, `AdminHeader`'s
nav pill list, new `AdminAccueilView` component — course stats card only at this story's
scope, Story 13.2 adds the other two).

### Story 13.2: Demand and AI-Usage Highlights on the Accueil View

As an admin,
I want the Accueil view to also surface which tool has the most demand and how much AI usage
looks like this week,
So that Accueil is a genuine overview, not just a course-stats widget.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the Accueil view opens
**When** it mounts
**Then** it triggers `loadWaitlist()` and `loadAiUsage()` eagerly (same functions the
"Demande outils"/"Utilisation IA" pills already use, guarded the same way — only fetched if
not already loaded) instead of waiting for those pills to be clicked, since Accueil is now the
first thing an admin sees

**Given** waitlist counts have loaded
**When** the demand card renders
**Then** it shows the single tool with the highest signup count (or an empty state if there is
no demand yet) and a "Voir la demande" CTA to the "Demande outils" view

**Given** AI usage data has loaded
**When** the usage card renders
**Then** it shows total tokens and estimated cost for the last 7 days across both endpoints,
plus the same key-rotation staleness warning already built for `AiUsageView` (reusing
`KEY_ROTATION_WARNING_DAYS`, not a second implementation of the threshold), and a "Voir
l'utilisation" CTA

**Given** either card's fetch fails
**When** the error surfaces
**Then** it degrades to a compact inline error within that card only — one failed fetch never
blanks the whole Accueil view, the other cards render normally

**Implementation:** `src/pages/AdminPage.jsx` (`AdminAccueilView` demand + usage cards,
eager-fetch on mount via existing `loadWaitlist`/`loadAiUsage`). No new tests beyond the
existing `AdminPage.jsx` manual/live verification convention — this view has no dedicated
service function to unit test (pure composition of already-tested data).

### Story 13.3: Richer Cards, Quick Actions, and a Notifications Card

As an admin,
I want more than one highlight per card, a fast way to add a course, and a first look at
Notification Center activity,
So that Accueil is genuinely useful day to day, not just a thin summary.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the "Demande outils" card
**When** it renders
**Then** it shows the top 3 tools by signup count (was 1), each with a proportional bar —
same visual language as the full `WaitlistView`, just compact

**Given** the "Utilisation IA" card
**When** it renders
**Then** it shows the 7-day total (unchanged) plus a per-endpoint breakdown ("Assistant IA" /
"Brouillon vidéo"), so an admin can see at a glance which feature is driving usage without
opening the full view

**Given** the Accueil header
**When** it renders
**Then** a "Ajouter un cours" button (primary, opens `CourseEditor` directly — same handler
the Cours view's own button uses) and a "Voir le site" link (opens `/` in a new tab) sit next
to the page title

**Given** no admin-facing view of the Notification Center existed before this story
**When** Accueil opens
**Then** it also fetches `getNotificationsOverview()` (same lazy/guarded pattern as the other
two) and a fourth card shows: unread count, total notifications sent, registered accounts,
how many have email digest enabled, and the most recent digest date — this card has no CTA
(`AccueilCard`'s `onSelect`/`ctaLabel` became optional for this reason: there is no dedicated
"Notifications" admin view to link to yet)

**Given** `get_notifications_overview()` is called by a non-admin
**When** the RLS-equivalent guard evaluates
**Then** it returns zero rows (`where public.is_admin()`, no `FROM` clause — same pattern as
`get_waitlist_counts()`/`get_ai_usage_summary()`), never a partial or per-user result

**Implementation:** `supabase/migrations/0015_admin_notifications_overview.sql` (applied
live), `src/lib/schemas/notification.js` (`notificationsOverviewSchema`, `.strict()`),
`src/services/supabase.js` (`getNotificationsOverview()`), `src/pages/AdminPage.jsx`
(`openAccueilView` now triggers three lazy fetches, `AccueilCard`'s CTA made optional, the
three enhanced cards). Tests: `src/services/supabase.test.js`. Verified live via Playwright
with mocked REST responses for all three admin-gated RPCs (real admin auth unavailable in this
session) — confirmed the top-3 bars, the per-endpoint breakdown, the notifications card
content, and that the "Ajouter un cours" quick action actually opens the course editor.
