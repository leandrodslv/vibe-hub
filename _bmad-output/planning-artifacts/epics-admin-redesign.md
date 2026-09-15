---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/epics-admin-dashboard.md
  - _bmad-output/planning-artifacts/epics-ai-ops.md
  - src/pages/AdminPage.jsx
  - src/components/workspace/Sidebar.jsx
supersedes: none
extends: _bmad-output/planning-artifacts/epics-admin-dashboard.md
---

# Vibe Hub — Admin Dashboard Redesign (SkillPath-Inspired) Epic Breakdown

## Overview

Léandro shared a reference screenshot of "SkillPath", a Bootstrap admin-dashboard template
(LMS-flavored: sidebar nav, gradient hero banner, ring-progress stat cards, charts, list
cards, a "Best Teachers" leaderboard, an "Upcoming Class" banner) and asked for `/admin` to be
restyled to resemble it — **adapted to what Vibe Hub actually is**, keeping every feature
already shipped (Epic 13: Accueil, Cours stats, Demande outils, Utilisation IA, Notifications,
"Ajouter un cours"/"Voir le site" quick actions).

**This is a visual/structural redesign, not a feature clone.** SkillPath is built for a
multi-tenant school: teachers, students, enrollments, assignments, live classes. Vibe Hub is a
single-admin content tool for one course catalogue — there is no student roster, no
per-learner analytics (course progress is anonymous, browser-local, AD-6), no teaching staff,
no live classes. Section by section below, each SkillPath element is either **mapped** onto
real Vibe Hub data, **repurposed** into something real and useful, or **dropped** with the
reason stated — never faked with placeholder numbers.

| SkillPath element | Vibe Hub treatment |
|---|---|
| Sidebar nav (Admin/School/Teacher/Student dashboards, Teachers/Students CRUD) | **Mapped, narrowed.** One sidebar, one role (admin). Nav items = the four existing views (Accueil/Cours/Demande outils/Utilisation IA). No multi-dashboard switcher, no Teachers/Students CRUD — doesn't exist. |
| Top bar: search, messages, favorites, notification bell w/ count | **Dropped except the bell.** No message inbox, no "favorites" concept exists. The bell becomes a real link into the Notifications card's data (already built, Epic 13) — not a decorative badge. |
| Welcome hero banner + "this week's progress" mini-courses | **Repurposed.** No per-admin "my progress" exists (single admin, no per-user course enrollment). Becomes a welcome banner naming the admin (from their session email) plus the top-3 demanded tools (already computed) as the "what's happening" highlight. |
| 4 ring-progress stat cards | **Mapped.** Total/Publiés/Brouillons cours (already computed) + a 4th slot for 7-day AI tokens (already computed) — same numbers already on Accueil, given the ring-card treatment. |
| "Course Enrollment" chart | **Repurposed.** No enrollment data exists. Becomes a real daily Gemini token-usage chart (`ai_usage_log` already has `created_at` — needs one new time-bucketed aggregate, no new tracking). |
| "My Courses" list | **Mapped.** Becomes "Derniers cours" — most recently edited courses with their Publié/Brouillon status (existing `courses` data, no new fetch). |
| "Upcoming Deadlines" list | **Repurposed.** No assignments exist. Becomes "À faire" — real admin signals already computed elsewhere: stale key rotation (Epic 11), unpublished drafts, high-demand tools still `coming`. |
| "Learning Curve" / "Learning Hours" per-learner charts | **Dropped.** No per-learner data exists server-side at all (AD-6: progress is anonymous and browser-local) — there is nothing to chart here without inventing fake analytics. |
| "Best Teachers" leaderboard | **Repurposed.** No teaching staff. Becomes "Outils les plus demandés" as a ranked leaderboard card (upgrades the existing top-3 list, Epic 13, to the badge/rank visual treatment). |
| "Upcoming Class" banner (Join Now / Continue) | **Repurposed.** No live classes. Becomes a single actionable suggestion banner surfacing whichever real signal is most urgent (stale key, or unpublished drafts) with a CTA into the relevant view. |

## Requirements Inventory

### Functional Requirements

FR-24: Admin sidebar shell — `/admin` moves from the current top-bar pill nav to a persistent
left sidebar (desktop) / off-canvas drawer behind a hamburger button (mobile), holding the
same four destinations (Accueil/Cours/Demande outils/Utilisation IA) plus account/logout. All
existing views (Cours CRUD, `CourseEditor`, `WaitlistView`, `AiUsageView`) keep working
unchanged inside the new shell's content area — this is a layout change, not a feature change.

FR-25: SkillPath-styled Accueil content — the Accueil view gains a welcome hero banner, four
ring-progress stat cards, a real daily AI-usage chart, a "Derniers cours" list, an "À faire"
list, a "Outils les plus demandés" leaderboard card, and a single actionable suggestion
banner — every number sourced from data already fetched today (Epic 13) or one new
time-bucketed aggregate for the chart. The existing Notifications card is kept, not replaced.

### Additional Requirements (Architecture)

AD-14 (new): charts render client-side from data already fetched through governed service
functions — no chart ever fetches data itself or calls Supabase directly (AD-2 still applies:
`services/supabase.js` remains the only importer of the Supabase SDK). The charting library
(recharts — SVG-based, MIT, no native deps, commonly used with React) is a new dependency;
Story 14.3 is the only place it's imported.

No other new AD. The new time-bucketed usage aggregate follows the exact posture already
established for `get_ai_usage_summary()`/`get_notifications_overview()`: `security definer`,
filtered internally on `is_admin()`, zero rows for a non-admin caller.

### FR Coverage Map

FR-24: Epic 14 — Story 14.1 (sidebar shell)
FR-25: Epic 14 — Stories 14.2 (hero + stat rings), 14.3 (usage chart), 14.4 (derniers cours +
à faire), 14.5 (leaderboard), 14.6 (suggestion banner)

## Epic List

### Epic 14: Admin Dashboard Redesign (SkillPath-Inspired)
`/admin` gets a sidebar-based shell and a richer, chart-backed Accueil view in the visual
language of the SkillPath reference — every section wired to real Vibe Hub data, with no
placeholder numbers and every Epic 13 feature preserved.
**FRs covered:** FR-24, FR-25
**Implementation notes:** `src/pages/AdminPage.jsx` gains a new `AdminSidebar` component
replacing `AdminHeader`; `AdminAccueilView` is extended (not replaced) — the four Epic 13
cards stay, joined by the hero banner, stat rings, chart, and two new list-style cards. One
new migration for the time-bucketed usage aggregate. One new dependency (`recharts`).

---

## Epic 14: Admin Dashboard Redesign (SkillPath-Inspired)

**Status: done — shipped 2026-09-15.**

### Story 14.1: Sidebar Shell Replacing the Top Pill Nav

As an admin,
I want the same four destinations in a left sidebar instead of a top pill bar,
So that `/admin` matches the SkillPath layout Léandro wants, with room to grow the nav later.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** a desktop viewport (≥ `md`)
**When** `/admin` renders (any view, not just Accueil)
**Then** a fixed left sidebar (same width convention as the Workspace's `Sidebar.jsx`, `w-64`)
shows the "vibe hub" wordmark, the four nav destinations (Accueil/Cours/Demande
outils/Utilisation IA) with active-state highlighting (`aria-current`, same pattern as the
current pills), and account/logout pinned at the bottom — replacing `AdminHeader`'s top bar
entirely

**Given** a narrow viewport (< `md`)
**When** `/admin` renders
**Then** a slim top bar (wordmark + hamburger button) replaces the fixed sidebar, and tapping
the hamburger opens the same nav as an off-canvas drawer (overlay + close on backdrop click or
item selection) — never a bottom tab bar (SkillPath's own pattern is a collapsible sidebar,
and four+ destinations plus account/logout don't fit a thumb-reachable bottom bar cleanly)

**Given** the course editor, "Demande outils", and "Utilisation IA" full views
**When** they render inside the new shell
**Then** their own internals are completely unchanged — only the surrounding chrome (what was
`AdminHeader`) changed; `CourseEditor`/`WaitlistView`/`AiUsageView` accept no new props

**Given** the editor view specifically (`editing` truthy in `Dashboard`)
**When** it renders
**Then** the sidebar's nav item list is hidden or disabled the same way the old pill row was
(`view` prop absent) — editing a course isn't one of the four destinations

**Implementation:** `src/pages/AdminPage.jsx` (`AdminSidebar` — new, replaces `AdminHeader`
and all its call sites; `sidebarItemClass` — renamed from `navPillClass` — styling ported to
sidebar nav items). Verified live via Playwright: desktop (1440px) shows the fixed sidebar with
correct active-state highlighting and working navigation between Accueil/Cours; mobile (390px)
shows the hamburger top bar, the off-canvas drawer opens/closes correctly (overlay, X button,
auto-close on item click); the course editor confirmed to render with zero nav items.

### Story 14.2: Welcome Hero Banner and Ring-Progress Stat Cards

As an admin,
I want a welcome banner and the course/AI stats presented as ring-progress cards,
So that Accueil opens with the same polish as the SkillPath reference.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the Accueil view loads
**When** the hero banner renders
**Then** it greets the admin (from `session.user.email`, no display-name field exists to greet
by first name) and shows the top 3 demanded tools (already computed in Epic 13's "Demande
outils" card) as compact highlights — never a fabricated "your weekly progress", since no
per-admin activity metric exists

**Given** the four ring-progress stat cards
**When** they render
**Then** they show Total cours / Publiés / Brouillons / Tokens IA (7j) — the exact numbers
already computed on Accueil today, each with an SVG progress ring computed from a sensible
ratio (e.g. Publiés/Total, Brouillons/Total, Tokens/an-informal-daily-baseline) — the ring is
a visual treatment of real numbers, never an invented percentage

**Given** any of the four numbers is still loading or errored (waitlist/AI-usage fetches are
async, per Epic 13)
**When** the corresponding ring card renders
**Then** it shows its existing loading/error state instead of a ring animating toward 0 or a
stale value

**Implementation:** `src/pages/AdminPage.jsx` (`AccueilHero`, `StatRingCard` — new; small
inline SVG ring, no charting library needed for this story; `StatRingCard` accepts optional
`loading`/`error` props so the Tokens-IA ring shows `…`/`—` instead of a misleading `0` while
`aiUsage` is still in flight or failed). Verified live: rings render correctly for Total 5,
Publiés 5/5 (full ring), Brouillons 0/5 (empty ring), Tokens IA capped at the informal 20k
baseline.

### Story 14.3: Real Daily AI-Usage Chart

As an admin,
I want to see AI token usage trend day by day, not just a 7-day total,
So that Accueil has a real chart in the SkillPath spirit instead of the SkillPath
"Course Enrollment" chart, which has no Vibe Hub equivalent.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** a new migration
**When** it is applied
**Then** it adds `get_ai_usage_daily(days int default 14)` — `security definer`, filtered on
`is_admin()` exactly like `get_ai_usage_summary()`, returning one row per
`(day, endpoint)` bucket from `ai_usage_log` for the requested window (capped, e.g. max 90) —
zero rows for a non-admin caller

**Given** the Accueil view loads
**When** the chart section renders
**Then** it fetches the last 14 days via a new `getAiUsageDaily()` service function (same
lazy/guarded pattern as the other Accueil fetches) and renders a stacked/grouped bar or area
chart (endpoint as series) using `recharts` — the only place in the codebase that imports it

**Given** fewer than 14 days of data exist (e.g. right after Epic 11 shipped)
**When** the chart renders
**Then** missing days show as zero rather than being omitted, so the x-axis stays a continuous
14-day window

**Given** the fetch fails or returns no admin data
**When** the chart section renders
**Then** it shows the same compact inline error/empty state convention as the other cards —
never a broken/blank chart area

**Implementation:** `supabase/migrations/0016_ai_usage_daily.sql` (applied live —
`get_ai_usage_daily(days int default 14)`, `generate_series` × the two endpoints × `left join`
onto `ai_usage_log`, capped `[1, 90]`), `src/services/supabase.js` (`getAiUsageDaily()`),
`src/lib/schemas/ai-usage.js` (`aiUsageDailyRowSchema`), `package.json` (`recharts@^3.10.1`,
the only file in the codebase importing it), `src/pages/AdminPage.jsx`
(`AiUsageChartCard`, `pivotAiUsageDaily()`). Tests: `src/services/supabase.test.js`. Verified
live via SQL (continuous-day bucketing confirmed with mocked windows) and via Playwright with
mocked 14-day data — stacked bar chart, legend, axis labels, and tooltip all render correctly
on both desktop and mobile widths.

### Story 14.4: "Derniers Cours" and "À Faire" List Cards

As an admin,
I want a quick list of recently touched courses and a short real to-do list on Accueil,
So that Accueil surfaces actionable next steps, not just totals.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the `courses` data already loaded on Accueil
**When** the "Derniers cours" card renders
**Then** it lists the most recently created/edited courses (sorted by `created_at` desc,
capped e.g. 3-5) with their title and a Publié/Brouillon pill — matching `CourseRow`'s
existing status styling, no new fetch

**Given** the signals already available on Accueil (key-rotation staleness from Epic 11, draft
course count, tools stuck at `status: 'coming'` with nonzero demand from Epic 13)
**When** the "À faire" card renders
**Then** it lists each real condition that's currently true as a short actionable line (e.g.
"Clé Gemini à tourner (120j)", "2 brouillons non publiés", "Code Auditor : 7 inscriptions,
toujours en préparation") — an empty list (nothing currently needs attention) shows a calm
"Rien à signaler" state, never a fabricated task

**Given** neither card duplicates a full view
**When** they render
**Then** "Derniers cours" links to "Cours" and each "À faire" line links to the view where
that signal lives (Cours, or Utilisation IA for the key rotation) — consistent with every
other Accueil card's CTA convention

**Implementation:** `src/pages/AdminPage.jsx` (`RecentCoursesCard`, `TodoCard`,
`computeAdminSignals()` — a single shared signal list consumed by both `TodoCard` and Story
14.6's `SuggestionBanner`, pure derivations of already-loaded state, no new fetch). Verified
live: "Derniers cours" lists real titles with Publié/Brouillon pills; "À faire" showed the
mocked high-demand-tool signal correctly.

### Story 14.5: "Outils les Plus Demandés" Leaderboard Card

As an admin,
I want the top-demand tools presented as a small leaderboard, not a plain list,
So that Accueil has the SkillPath "Best Teachers" card's visual weight without a fake ranking
of people who don't exist.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the existing top-3 "Demande outils" data (Epic 13)
**When** the leaderboard card renders
**Then** each entry shows a rank badge (1/2/3), the tool's existing icon (from `TOOLS`), its
name, and its signup count — same data as the compact Accueil card, different visual
treatment; no invented rating/stars (SkillPath's star rating has no Vibe Hub equivalent — a
tool isn't rated, it's requested)

**Given** this is a second, richer presentation of the same waitlist data already on Accueil
**When** this story is scoped
**Then** it replaces the existing compact top-3 bars in the "Demande outils" card (not an
additional fifth card) — one leaderboard, not two competing views of the same numbers

**Implementation:** `src/pages/AdminPage.jsx` (`DemandLeaderboardCard` — replaces the old
top-3-bars content of the "Demande outils" Accueil card; `WaitlistView`, the full view, is
untouched). Verified live: rank badges 1/2/3 (primary/secondary/tertiary tokens), tool icons
from the shared `TOOLS` catalogue, correct signup counts.

### Story 14.6: Real Suggested-Action Banner

As an admin,
I want a single prominent banner suggesting my next action, if there is one,
So that Accueil closes with the SkillPath "Upcoming Class" banner's visual weight, pointing at
something real instead of a class that doesn't exist.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the "À faire" signals computed in Story 14.4
**When** Accueil renders
**Then** a banner at the bottom of the page shows the single highest-priority item (priority
order: stale/never-rotated key > unpublished drafts > undelivered high-demand tool) with a CTA
button into the relevant view

**Given** no signal is currently true (key fresh, no drafts, no unaddressed demand)
**When** Accueil renders
**Then** the banner either doesn't render at all, or shows a calm "Tout est à jour" state —
never an empty SkillPath-style "Join Now" banner with nothing to join

**Implementation:** `src/pages/AdminPage.jsx` (`SuggestionBanner` — new, reuses
`computeAdminSignals()` from Story 14.4 rather than a second implementation of the same
priority logic). Verified live: with the mocked demand signal present, the banner shows it
with a working CTA; the "Tout est à jour" calm state was verified by code review (same
`signals.length === 0` branch `TodoCard` already exercises).
