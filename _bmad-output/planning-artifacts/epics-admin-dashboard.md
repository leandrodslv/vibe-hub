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
publishing stats (total/published/drafts), the tool with the most waitlist demand, and a
7-day Gemini token/cost summary plus the key-rotation staleness flag — each section linking
into the corresponding existing view (Cours / Demande outils / Utilisation IA) rather than
duplicating it.

### Additional Requirements (Architecture)

No new AD. Pure read-composition of data the three existing admin views already fetch through
governed paths: `getAllCourses()`, `getWaitlistCounts()` (AD-4, aggregate only), and
`getAiUsageSummary()`/`getLastKeyRotation()` (Epic 11, AD-12/AD-13). No new table, no new
Edge Function, no new write path.

### FR Coverage Map

FR-22: Epic 13 — Stories 13.1 (entry point + course stats), 13.2 (demand + usage highlights)

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
