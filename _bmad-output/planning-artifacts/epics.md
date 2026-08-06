---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/EXPERIENCE.md
---

# Vibe Hub - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Vibe Hub, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: Landing page presents the product and routes into the Workspace — a visitor can view the hero, social proof, program overview, and FAQ sections, and enter the Workspace from a single primary CTA, without authentication. Program-overview/hero sections use real product screenshots, not stock imagery.

FR-2: Designer can browse and open real, distinct course content — every course card has a unique title/description; the duplicated placeholder content in `src/data/courses.js` is retired/replaced before rollout (deployment blocker).

FR-3: Course progress indication — a designer sees session-local, non-persistent Course Progress reflecting real interaction state within the current session (no static/fabricated percentage, no cross-session/device persistence required in v1).

FR-4: Content author can manage courses without a deploy, behind a minimal access gate — Admin surface (`/admin`) CRUD on courses reflects immediately in the Modules tab; `/admin` is protected by a minimal shared-credential access gate enforced server-side/by policy (not route-hiding), and no Supabase credential shipped to the browser can perform admin-level writes on its own.

FR-5: Designer converts a vague idea into a structured generation prompt — the IA tab assistant produces an explicit, copyable prompt block (distinct from conversational text) suitable for pasting into UI Builder.

FR-6: Slash commands and project organization — typing `/` in the chat input surfaces a list of available slash commands with one-line descriptions; conversations can be assigned to and filtered by a named project grouping. Scoped narrowly to design-prompting sessions, not general-purpose chat.

FR-7: Designer generates working UI code from a prompt — submitting a well-formed prompt to UI Builder returns renderable React/Tailwind code within the tool's UI without leaving the Outils tab. Hand-off from IA tab is manual copy-paste in v1 (no auto-fill); pasted text must work as-is with no reformatting.

FR-8: Designer joins a waitlist for a not-yet-built tool — waitlist join is recorded per-tool in Supabase as an anonymous counter; a designer cannot join the waitlist for a tool that is already live.

FR-9: Waitlist demand is visible to decide what to build next — each of the four waitlisted tools has a visible, up-to-date join count reachable through the Admin surface without querying Supabase's table editor or writing SQL.

### NonFunctional Requirements

NFR1: Privacy — Supabase-stored data (course records, per-tool waitlist counts) requires GDPR review now, independent of auth timing; once auth ships (v2), per-user data (Course Progress, saved IA-tab projects) must be isolated so one team member cannot read/write another's.

NFR2: AI transparency — EU AI Act transparency obligations (effective August 2026, current not upcoming) require disclosing AI-driven interaction to users in both the IA tab and UI Builder; current UI copy must be verified to satisfy this before rollout.

NFR3: Accessibility — WCAG 2.1 AA is the formal accessibility bar across the responsive web surface (confirmed decision, not best-effort), per the UX Experience spine.

NFR4: Cost containment — Gemini API usage (chat + UI Builder) is metered; a budget ceiling or rate limit must be defined before the primary success metric (SM-1, which explicitly increases usage of these metered endpoints) is actively optimized against.

NFR5: Security — the Gemini API key must never be shipped to the browser bundle (current `VITE_GEMINI_API_KEY` inlining is an open abuse/cost vector that must be closed); AI-generated code must never be `eval`'d or injected directly into the app's own DOM/React tree.

### Additional Requirements

- AD-1 (Architecture): All Gemini calls must be routed through a new Supabase Edge Function (`gemini-proxy`, Deno, built on `@google/genai` v2.15.0 — not the deprecated `@google/generative-ai`), never called client-side. The Gemini key lives only in Edge Function server-side env, never in a `VITE_`-prefixed variable. Binds FR-5, FR-7.
- AD-2 (Architecture): Only files under `src/services/` may import `@supabase/supabase-js` or call the Edge Function/Gemini. `services/supabase.js` must gain `signIn`, `signOut`, `getSession`, `onAuthStateChange` wrappers; `AdminPage.jsx` must be refactored off the raw Supabase client it currently imports directly for auth.
- AD-3 (Architecture): Write authority on `courses` and `waitlist` tables must be enforced via Postgres RLS policies, not client-side logic. `courses`: anon/public `SELECT` only where `published = true`, authenticated admin role gets full CRUD. `waitlist`: anon/public `INSERT` only (no `SELECT`); admin role receives NO `SELECT` grant on the raw `waitlist` table under any FR — a story implementing FR-8 must not add an admin `SELECT` policy on `waitlist` as a side effect. Binds FR-4, FR-8, FR-9.
- AD-4 (Architecture): Waitlist demand must be read through a `waitlist_counts` aggregate view (plain security-invoker view grouped by `tool_id`, NOT a `SECURITY DEFINER` function), exposed via a new `getWaitlistCounts()` in `services/supabase.js`. Admin RLS grants `SELECT` on the view only, never on `waitlist` itself. Binds FR-9.
- AD-5 (Architecture): AI-generated code from UI Builder must render only inside a sandboxed `<iframe>` (`srcdoc`, no access to parent window/app state) — never `eval`'d or injected into the app's own DOM/React tree. Binds FR-7.
- AD-6 (Architecture): Exactly two persistence tiers, no ad-hoc third: durable/shared data (`courses`, `waitlist`) lives only in Supabase via `services/supabase.js`; ephemeral per-browser UI state (Course Progress per FR-3; IA tab sessions/projects) lives in `localStorage` under feature-prefixed keys (`ai_*`, `progress_*`). No global state manager (Redux/Zustand/Context-as-store) is to be introduced.
- Migration/audit requirement: No RLS or migration files currently exist in the repo — the first implementation step touching FR-4/FR-9 must audit the live Supabase project's actual policies before assuming a clean slate.
- SPA host selection (Vercel vs Netlify) is deferred to deploy time; either satisfies the architecture identically.
- The FR-7 sandbox transform/runtime library choice is deferred to implementation time (Sandpack and react-live both flagged as unsuitable/stale as of this architecture's writing); only the iframe isolation boundary (AD-5) is fixed now.
- Naming/data conventions (must be followed by any story touching these areas): Supabase rows use `snake_case` columns; `order_index` is the sole canonical ordering wherever a course list is shown (never `created_at`); service functions throw on Supabase/Postgres error by default, with the `{ success } / { duplicate } / { error }` return-shape exception reserved solely for cases the caller must branch on (e.g. `addToWaitlist`'s duplicate case) — no third error-handling shape is to be introduced.
- No starter/greenfield template applies — Vibe Hub is a brownfield prototype (React/Vite/Tailwind/Supabase/Gemini already in place); Epic 1 Story 1 does not need scaffolding, only the architectural remediations above (AD-1, AD-2) applied to existing code.

### UX Design Requirements

UX-DR1: Apply the "Franc" visual design system (Bricolage Grotesque display type, Hanken Grotesk body, JetBrains Mono technical labels, franc-violet/green/coral/pink/blue functional color palette) across the entire product surface — public Landing Page and Workspace interior alike — superseding the prototype's earlier strict monochrome register.

UX-DR2: Fix text-on-franc-color contrast per the computed WCAG AA rule: text on a solid franc-color fill must be `on-surface` (near-black), not white, except where {colors.primary} (a darker violet, 6.70:1) is substituted for {colors.franc-violet} on a solid-violet CTA needing white text — {colors.franc-violet} itself is accents/icons/borders only, never a solid fill behind body-weight text.

UX-DR3: Implement Bento-style card components (rounded-xl radius, pill-shaped buttons/chips, chunky color-tinted soft-drop-shadow elevation, "pressed" active state) consistently across Course cards and Tool cards, per the Cards and Elevation & Depth specs.

UX-DR4: Implement the responsive layout system: desktop 12-column grid with persistent left sidebar nav; tablet sidebar collapses to icons with 2-column grid reflow; mobile 4-column grid with bottom pill-shaped Dock nav replacing the sidebar 1:1 — same three destinations (Modules/IA/Outils) at every breakpoint.

UX-DR5: Implement the Prompt Hand-off Card component in the IA tab: visually distinct near-black card (not a chat bubble) with a "Prompt prêt" header, copyable prompt text, a "Modifier" secondary action (edit in place), and a primary "Envoyer au Générateur" pill CTA; copy interaction swaps the CTA to a confirmed state that reverts after a few seconds; the card animates in distinctly from a normal reply as the product's signature moment.

UX-DR6: Implement the persistent, non-dismissible "Assistant IA" disclosure label/chip above the IA tab conversation at all times, visible from the very first paint (not only after the first exchange) and announced to screen readers when a user enters the IA tab — the accessible form of the EU AI Act disclosure requirement, not a one-time dismissible banner.

UX-DR7: Implement the two Tool Card variants in Outils: "Disponible" (functional-color fill, primary pill CTA that launches the tool inline with no navigation away) and "Bientôt disponible" (lower-contrast/lighter fill, coral "Bientôt disponible" badge, waitlist pill CTA that swaps to a filled/checked "Sur la liste ✓" state and becomes visually inert — reduced opacity, no hover affordance — on join).

UX-DR8: Implement Modules tab state patterns: cold-load skeleton (3-4 cards matching the bento grid), inline fetch-error retry state ("Impossible de charger les modules." + "Réessayer" — never a silent empty grid), and a plain "Aucun module pour le moment" empty-catalog state (distinct from a fetch error).

UX-DR9: Implement IA tab state patterns: first-entry empty state with the assistant's opening line and "Assistant IA" label already visible; a typing/thinking indicator during response wait with input left enabled to queue a follow-up; an inline failed/timed-out response error with a retry action that resends the same user turn (message never silently dropped); and in-place prompt-card revision (not a new thread) when the designer requests a refinement.

UX-DR10: Implement Outils/UI Builder state patterns: a "generating" in-progress state replacing the prompt area on submit (never appears to hang with no feedback); an inline generation-failure retry state that preserves the submitted prompt text (no retyping); and a no-manual-migration transition where a tool moves from "Bientôt disponible" to "Disponible" automatically on next load once it goes live.

UX-DR11: Implement the Admin surface UX: a single-field password gate with an inline styled error state on wrong code (not a browser `alert()`, field clears and retains focus, no lockout/attempt-count UI in v1), session-persisted correct-code state (no re-entry per click), inline (non-navigating) success confirmation on course save, inline field/form-level error on course save failure with in-progress edits retained, and a separate waitlist-count dashboard view (distinct from the course CRUD view) showing live per-tool counts.

UX-DR12: Implement the slash command menu in the IA tab input: typing `/` surfaces a list with a one-line description per command; arrow keys navigate, `Enter` inserts, `Esc` dismisses.

UX-DR13: Implement the project filter/grouping control in the IA tab: a lightweight control to assign a conversation to a named project and filter by it — not a full workspace-switcher.

UX-DR14: Meet the WCAG 2.1 AA accessibility floor across the responsive web surface: full keyboard Tab order through nav, course cards, chat input, slash command list, and all Outils/Admin controls (`Esc` closes the slash command menu); visible focus rings at AA contrast on every interactive element, including inside the dark prompt hand-off card; accessible names beyond icon-only buttons for the prompt hand-off card's "Modifier"/"Envoyer au Générateur" actions.

UX-DR15: Apply the approved voice/tone register throughout: French-first, collaborator-style copy (e.g. "Je vais te rédiger le prompt parfait...") — explicitly avoid gamified-cheerleading progress copy ("40% complété ! Continue comme ça 🔥"), overly casual openers, or overly formal/corporate waitlist confirmations, per the Voice and Tone Do/Don't table.

UX-DR16: Ensure mobile touch targets are a minimum of 44px; the bottom dock nav replaces the sidebar 1:1 with the same three destinations; extend the Modules and Outils mobile layouts from the desktop mocks using the bento-to-single-column collapse rule (only the IA tab currently has a confirmed mobile mockup — `mockups/ia-mobile.html`).

### FR Coverage Map

FR-1: Epic 1 - Landing page presents the product and routes into the Workspace
FR-2: Epic 2 - Designer can browse and open real, distinct course content
FR-3: Epic 2 - Course progress indication (session-local)
FR-4: Epic 3 - Content author can manage courses without a deploy, behind a minimal access gate
FR-5: Epic 4 - Designer converts a vague idea into a structured generation prompt
FR-6: Epic 4 - Slash commands and project organization
FR-7: Epic 5 - Designer generates working UI code from a prompt
FR-8: Epic 6 - Designer joins a waitlist for a not-yet-built tool
FR-9: Epic 6 - Waitlist demand is visible to decide what to build next

## Epic List

### Epic 1: Landing Page & Product Introduction
A visitor can see what Vibe Hub is (hero, real product screenshots, FAQ) and enter the Workspace via one primary CTA, with no authentication required.
**FRs covered:** FR-1

### Epic 2: Course Catalog Experience
A designer can browse a catalog of real, distinct courses (no more duplicated placeholders) and see session-local progress as they work through one.
**FRs covered:** FR-2, FR-3
**Implementation notes:** Includes the RLS policy allowing anon `SELECT` on `courses` where `published = true` (AD-3) — required just to read real content, independent of Admin write access.

---

## Epic 1: Landing Page & Product Introduction

A visitor can see what Vibe Hub is (hero, real product screenshots, FAQ) and enter the Workspace via one primary CTA, with no authentication required.

### Story 1.1: View Landing Page Content

As a visitor,
I want to see the hero, program overview, and FAQ sections on the Landing Page,
So that I understand what Vibe Hub is before entering the Workspace.

**Acceptance Criteria:**

**Given** I navigate to the Landing Page
**When** the page loads
**Then** I see a hero section, a program/course overview section, and an FAQ section, without any authentication prompt

**Given** the program overview and hero sections are rendering
**When** I view them
**Then** they display real screenshots of the actual product (Modules/IA/Outils tabs, UI Builder output) — not stock or placeholder imagery

**Given** the Landing Page is internal-only in v1
**When** I read the hero and overview copy
**Then** it is framed as "here's the tool your team just got" (internal rollout communication), not external lead-generation copy, and does not present fabricated testimonials as social proof

**Given** the page is styled
**When** I view it on desktop, tablet, and mobile
**Then** it follows the Franc design system (Bricolage Grotesque display type, Hanken Grotesk body, franc color palette, pill shapes, bento layout per UX-DR1) and the responsive grid rules (12-col desktop / 4-col mobile per UX-DR4)

**Given** I navigate the page using only a keyboard or a screen reader
**When** I move through the hero, overview, and FAQ sections
**Then** all interactive elements are reachable via Tab order and meet WCAG 2.1 AA contrast/focus requirements (UX-DR14)

### Story 1.2: Enter Workspace from Landing Page

As a visitor,
I want to click a single primary call-to-action on the Landing Page,
So that I can enter the Workspace and start using Vibe Hub.

**Acceptance Criteria:**

**Given** I am on the Landing Page
**When** I click the primary CTA
**Then** the view transitions to the Workspace (defaulting to the Modules tab) with no authentication barrier

**Given** there is exactly one primary CTA path into the Workspace
**When** I look at the Landing Page
**Then** no competing or duplicate primary CTAs are present, consistent with the single-CTA requirement in FR-1

**Given** I trigger the CTA via keyboard (Enter/Space on a focused CTA)
**When** the transition occurs
**Then** it behaves identically to a mouse click, meeting the WCAG 2.1 AA keyboard-operability requirement (UX-DR14)

---

## Epic 2: Course Catalog Experience

A designer can browse a catalog of real, distinct courses (no more duplicated placeholders) and see session-local progress as they work through one.

### Story 2.1: Browse Real Course Catalog

As a designer,
I want to view a grid of real, distinct courses,
So that I can find one relevant to what I want to learn.

**Acceptance Criteria:**

**Given** courses exist in Supabase with `published = true`
**When** I open the Modules tab
**Then** I see a grid of course cards, each with a unique title and description — no duplicated placeholder entries, and `src/data/courses.js` is no longer used as a data source

**Given** the course list is being fetched
**When** the request is in flight
**Then** I see 3-4 skeleton cards matching the bento grid layout, per UX-DR8

**Given** the Supabase course fetch fails
**When** the error occurs
**Then** I see an inline retry state ("Impossible de charger les modules." + "Réessayer" button) instead of a silent empty grid, per UX-DR8

**Given** no published courses exist
**When** the Modules tab loads successfully with zero results
**Then** I see a plain "Aucun module pour le moment" empty state, distinct from the fetch-error state, per UX-DR8

**Given** courses are displayed
**When** the grid renders
**Then** cards are ordered by `order_index`, never by `created_at` (per Architecture naming convention), and rendered as bento-style cards (rounded-xl radius, category color, Franc design system per UX-DR3)

**Given** anon Supabase access
**When** an unauthenticated client queries `courses`
**Then** it can only `SELECT` rows where `published = true` (RLS per AD-3) — it cannot read unpublished courses or write to the table

**Given** I view the Modules tab on a mobile device
**When** I browse the course grid
**Then** card tap targets are a minimum of 44px, and the grid extends from the desktop mock using the bento-to-single-column collapse rule, since Modules has no confirmed mobile mockup of its own (UX-DR16)

### Story 2.2: Open and View Course Content

As a designer,
I want to click a course card and view its content,
So that I can learn from it.

**Acceptance Criteria:**

**Given** I am viewing the Modules tab grid
**When** I click anywhere on a course card
**Then** I am taken to the Course Detail view for that course (click-anywhere card, no separate "open" button, per UX-DR interaction primitives)

**Given** the Course Detail content is loading
**When** I first land on the page
**Then** I see a skeleton matching the content layout, per UX-DR8, and the progress bar does not show a fabricated interim value until content has loaded

**Given** the course content has loaded
**When** I view the Course Detail page
**Then** the content shown is the real, distinct module content for that specific course, not placeholder text

### Story 2.3: See Session-Local Course Progress

As a designer,
I want to see my progress through a course update as I move through it,
So that I know where I left off within my current session.

**Acceptance Criteria:**

**Given** I am moving through a course's content in the Course Detail view
**When** I advance through it
**Then** the progress indicator reflects my real interaction state within the current browser session — never a static or fabricated percentage

**Given** progress is session-local per FR-3 and AD-6
**When** I close and reopen the browser (new session)
**Then** progress resets — no cross-session or cross-device persistence is required, and no backend write occurs for progress

**Given** progress data is stored
**When** it is persisted
**Then** it lives only in `localStorage` under a feature-prefixed key (e.g. `progress_*`), per AD-6 — not `sessionStorage`, `IndexedDB`, or a new global store

**Given** progress is displayed on the course card and in Course Detail
**When** the copy is written
**Then** it uses plain, factual phrasing (e.g. "2/5 leçons") — never gamified cheerleading copy (e.g. "40% complété ! Continue comme ça 🔥"), per UX-DR15

---

## Epic 3: Secure Course Content Management

Léandro (or another content owner) can create, edit, and delete courses via a gated Admin surface — changes go live with no deploy, and the gate is enforced server-side/by policy, not by hiding the `/admin` route.

### Story 3.1: Gate Admin Access with a Shared Credential

As Léandro (content owner),
I want `/admin` protected by a shared password gate,
So that only someone with the credential can reach or modify course data.

**Acceptance Criteria:**

**Given** I navigate directly to `/admin` without having authenticated
**When** the page loads
**Then** I see a single password field, not the course CRUD interface

**Given** I enter the wrong password
**When** I submit
**Then** I see an inline styled error ("Code incorrect.") under the field, using `{colors.error}`/`{colors.on-error}` — not a browser `alert()` — the field clears and retains focus, and there is no lockout/attempt-count UI in v1

**Given** I enter the correct password
**When** I submit
**Then** my session is authenticated and persisted for the remainder of the session — I am not re-prompted on every click within that session

**Given** the codebase currently imports the raw Supabase client directly in `AdminPage.jsx` for auth calls
**When** this story is implemented
**Then** `AdminPage.jsx` uses new `signIn`, `signOut`, `getSession`, `onAuthStateChange` wrappers added to `services/supabase.js` instead of calling `supabase.auth.*` inline (AD-2) — no component outside `src/services/` imports `@supabase/supabase-js` directly

**Given** an unauthenticated client attempts to write to `courses` via a direct API call (bypassing the UI)
**When** the request is made
**Then** it is rejected — the gate is enforced server-side/by Postgres RLS policy, not merely by hiding the `/admin` route client-side

### Story 3.2: Manage Courses via Admin CRUD

As Léandro (content owner),
I want to create, edit, and delete course records from the Admin surface,
So that the Modules tab always reflects real course content without a deploy.

**Acceptance Criteria:**

**Given** the current Supabase project has no migration files in the repo
**When** this story begins implementation
**Then** the live Supabase project's actual existing RLS policies are audited first — no clean-slate schema is assumed

**Given** I am authenticated on `/admin` (per Story 3.1)
**When** I create, edit, or delete a course record (title, description, time estimate, image)
**Then** the change is reflected in the Modules tab (`ModulesTab`) without any code deploy

**Given** RLS policies on `courses`
**When** an authenticated admin session performs a write
**Then** it succeeds via the authenticated-admin RLS policy (full CRUD per AD-3); an anon/unauthenticated session attempting the same write is rejected

**Given** I submit a course save
**When** the save succeeds
**Then** I see an inline confirmation on the course form itself (not a page navigation), per UX-DR11

**Given** I submit a course save
**When** the save fails (validation error or write failure)
**Then** I see an inline error on the specific failing field(s), or a general form-level error for a write failure, and my in-progress edits are retained — never discarded, per UX-DR11

**Given** any Supabase credential shipped to the browser (anon key)
**When** it is used from the client
**Then** it cannot perform admin-level writes on its own — write authority is enforced entirely by Postgres RLS (AD-3), not by client-side checks in `AdminPage.jsx`, which remain UX-only convenience

---

## Epic 4: AI Design Assistant (IA tab)

A designer can describe a vague design problem in natural language and receive a structured, copyable generation prompt, with slash commands and project-based conversation organization.

### Story 4.1: Chat with the AI Design Assistant

As a designer,
I want to have a basic conversation with the AI assistant in the IA tab,
So that I can describe a design problem in natural language.

**Acceptance Criteria:**

**Given** the current prototype calls Gemini directly from the browser (`VITE_GEMINI_API_KEY`)
**When** this story is implemented
**Then** all Gemini calls are routed through a new `gemini-proxy` Supabase Edge Function (Deno, built on `@google/genai`) — the Gemini key lives only in server-side Edge Function env, never in a `VITE_`-prefixed variable, and `services/ai.js` calls the Edge Function over HTTPS rather than any Gemini SDK directly (AD-1, NFR5)

**Given** I open the IA tab for the first time with no messages
**When** the tab loads
**Then** I see an empty state with the assistant's opening line ("Bonjour ! Comment puis-je vous aider aujourd'hui ?") and the "Assistant IA" disclosure label already visible from first paint (UX-DR9)

**Given** the "Assistant IA" label is present
**When** I use a screen reader to enter the IA tab
**Then** the label is announced, not just visually present (NFR2, UX-DR14)

**Given** I send a message
**When** the assistant is generating a response
**Then** I see a lightweight typing/thinking indicator and my input stays enabled so I can queue a follow-up (UX-DR9)

**Given** the assistant call fails or times out
**When** this happens
**Then** I see an inline error bubble ("La réponse a échoué. Réessayer ?") with a retry action that resends the same user turn — my message is never silently dropped (UX-DR9)

**Given** only `src/services/` files may call the Edge Function or import external SDKs
**When** this story is implemented
**Then** no component calls the Edge Function or Gemini directly — only `services/ai.js` does (AD-2)

### Story 4.2: Convert a Design Idea into a Structured Prompt

As a designer,
I want the assistant to turn my vague design description into a structured, copyable generation prompt,
So that I can use it in UI Builder.

**Acceptance Criteria:**

**Given** I describe a design problem in a way that's suitable for prompt generation
**When** the assistant responds
**Then** it produces a distinct Prompt Hand-off Card — a near-black card, not a chat bubble — containing a "Prompt prêt" header, the copyable prompt text, a "Modifier" secondary action, and a primary "Envoyer au Générateur" pill CTA (UX-DR5)

**Given** the prompt card appears
**When** it renders
**Then** it animates in distinctly from a normal reply, as the product's signature moment (UX-DR9)

**Given** the prompt card is displayed
**When** I click the copy/"Envoyer au Générateur" action
**Then** the prompt text is copied to my clipboard and the button label swaps to a confirmed state, then reverts after a few seconds (UX-DR5)

**Given** I've received a prompt card and want changes
**When** I tell the assistant "ce n'est pas ce que je veux" (or similar pushback)
**Then** the assistant revises the existing prompt card in place rather than starting a new thread (UX-DR9, UJ-1 edge case)

**Given** the prompt card's actions
**When** a screen reader or keyboard-only user interacts with "Modifier"/"Envoyer au Générateur"
**Then** both have accessible names beyond icon-only buttons, and focus rings are visible at AA contrast against the card's near-black background (UX-DR14)

### Story 4.3: Use Slash Commands in Chat

As a designer,
I want to type `/` in the chat input to see available commands,
So that I can quickly scaffold specific kinds of prompting sessions.

**Acceptance Criteria:**

**Given** I am typing in the IA tab chat input
**When** I type `/`
**Then** a list of available slash commands appears, each with a one-line description of what it does (FR-6) — a stub command with no listing does not satisfy this

**Given** the slash command list is open
**When** I use arrow keys, `Enter`, or `Esc`
**Then** arrow keys navigate the list, `Enter` inserts the selected command, and `Esc` dismisses the list (UX-DR12)

**Given** slash commands exist to scaffold design-prompting sessions
**When** commands are implemented
**Then** they stay scoped to that purpose (e.g. a `/prompt` command scaffolds a generation prompt) — not general-purpose productivity chat features (FR-6 scope note)

### Story 4.4: Organize Conversations into Projects

As a designer,
I want to group related IA tab conversations into named projects,
So that I can find related prompting sessions later.

**Acceptance Criteria:**

**Given** I have one or more conversations in the IA tab
**When** I assign a conversation to a named project
**Then** the assignment is saved and I can later filter conversations by that project (FR-6)

**Given** the project filter is a lightweight grouping control
**When** I use it
**Then** it behaves as a simple filter, not a full workspace-switcher (UX-DR13)

**Given** a chat session references a project
**When** the data relationship is stored
**Then** the session object holds the `projectId` (session → project, one-way) — never the reverse — and any filtering by project queries sessions by `projectId`, never traverses from a project's own session list (Architecture Consistency Convention)

**Given** project/session data is ephemeral, per-browser state
**When** it is persisted
**Then** it lives in `localStorage` under a feature-prefixed key (`ai_*`), per AD-6 — not a new global store

---

## Epic 5: AI-Powered UI Builder

A designer can submit a design prompt to UI Builder and get back real, rendered React/Tailwind code, safely sandboxed from the host application.

### Story 5.1: Launch UI Builder from the Outils Tab

As a designer,
I want to launch UI Builder directly from the Outils tab,
So that I can start generating code without leaving the tab.

**Acceptance Criteria:**

**Given** UI Builder is the one live tool in the Outils tab
**When** I view the Outils grid
**Then** its card renders as the "Disponible" variant — functional-color fill, category icon top-left, title in the display font, primary pill CTA — per UX-DR7

**Given** I click the UI Builder card's primary CTA
**When** it launches
**Then** the tool opens inline within the Outils tab — no navigation away from the tab (UX-DR7, FR-7)

**Given** UI Builder generates AI output
**When** I am using the tool
**Then** a persistent AI-disclosure element is visible, equivalent to the IA tab's "Assistant IA" label, satisfying NFR2 for UI Builder specifically (not just the IA tab)

**Given** the "Disponible" card uses a solid franc-color (green family) fill
**When** its title/label text is rendered
**Then** it uses `{colors.on-surface}` (near-black) text, not white, passing WCAG AA per the computed contrast rule (UX-DR2)

**Given** I view the Outils tab on a mobile device
**When** I interact with the UI Builder card and its controls
**Then** tap targets are a minimum of 44px, and the layout extends from the desktop mock using the bento-to-single-column collapse rule (UX-DR16)

### Story 5.2: Generate and Render UI Code from a Prompt

As a designer,
I want to submit a prompt to UI Builder and see the generated code rendered,
So that I get working React/Tailwind output from my design idea.

**Acceptance Criteria:**

**Given** I have a well-formed prompt (typed directly, or pasted from the IA tab's hand-off card)
**When** I submit it to UI Builder
**Then** pasted text works as-is with no manual reformatting required, and I receive renderable React/Tailwind code within the tool's UI

**Given** I submit a prompt
**When** generation is in progress
**Then** the prompt area is replaced by a "Generating Component..." in-progress state — it never appears to hang with no feedback (UX-DR10)

**Given** the Gemini call errors or times out
**When** generation fails
**Then** I see an inline failure state ("La génération a échoué. Réessayer ?") that preserves my submitted prompt so I don't have to retype it (UX-DR10)

**Given** generated code is untrusted AI output
**When** it is rendered
**Then** it renders only inside a sandboxed `<iframe>` (`srcdoc`, no access to the parent window/app state) — it is never `eval`'d or injected directly into the app's own DOM/React tree (AD-5)

**Given** UI Builder calls Gemini
**When** a generation request is made
**Then** it goes through the same `gemini-proxy` Edge Function established in Epic 4 (AD-1) — no separate client-side Gemini call path is introduced

---

## Epic 6: Tool Waitlist & Demand Signal

A designer can signal interest in a not-yet-built tool with one click; Léandro can see aggregated per-tool waitlist demand from the Admin surface to decide what to build next.

### Story 6.1: Join the Waitlist for a Not-Yet-Built Tool

As a designer,
I want to join the waitlist for a tool that isn't built yet,
So that I can signal my interest without waiting for it to ship.

**Acceptance Criteria:**

**Given** a tool is marked "coming soon" (Code Auditor, Content Writer, Color Studio, or Vision Lens)
**When** I view its card in the Outils tab
**Then** it renders as the "Bientôt disponible" variant — lower-contrast fill, coral "Bientôt disponible" badge, waitlist pill CTA — per UX-DR7

**Given** I click the waitlist-join CTA
**When** the join is recorded
**Then** it is written to Supabase as an anonymous per-tool counter (no auth, no identity attached), and the button immediately swaps to a joined state ("Sur la liste ✓") that becomes visually inert (reduced opacity, no hover affordance, no confirmation dialog) — per UX-DR7 and FR-8

**Given** I have already joined the waitlist for a tool in this session
**When** I view that tool's card again
**Then** I cannot join it a second time — the button remains in its joined state

**Given** a tool is already live (not waitlisted)
**When** I view its card
**Then** there is no waitlist-join affordance for it — I cannot submit to the waitlist for a live tool

**Given** the Supabase write for a waitlist join fails
**When** the failure occurs
**Then** the button stays in its default (not-yet-joined) state and a brief inline "Réessayer" message appears — it never silently shows "Sur la liste ✓" without a confirmed write (UX-DR10)

**Given** RLS policies on `waitlist`
**When** an anon client writes a join
**Then** it can only `INSERT` — it has no `SELECT` grant on the table (AD-3)

**Given** the "Bientôt disponible" badge and joined-state chip use solid franc-color (coral) backgrounds
**When** their text is rendered
**Then** it uses `{colors.on-surface}` (near-black) text, not white, per the WCAG AA contrast rule (UX-DR2)

**Given** I view the Outils tab on a mobile device
**When** I interact with a waitlisted tool card
**Then** the waitlist-join tap target is a minimum of 44px, and the card layout extends from the desktop mock using the bento-to-single-column collapse rule (UX-DR16)

### Story 6.2: View Aggregated Waitlist Demand in Admin

As Léandro (decision-maker),
I want to see the aggregated waitlist join count for each not-yet-built tool,
So that I can decide what to build next based on real demand signal.

**Acceptance Criteria:**

**Given** I am authenticated on `/admin` (per Epic 3)
**When** I open the waitlist dashboard view
**Then** I see a separate view from the course CRUD view, showing each of the four waitlisted tools with an up-to-date join count (FR-9, UX-DR11)

**Given** I can see this data without querying Supabase's table editor or writing SQL
**When** I view the dashboard
**Then** the counts are reachable entirely through the Admin surface UI

**Given** aggregate demand must not require broader read access than needed
**When** the count is fetched
**Then** it comes from a `waitlist_counts` Postgres view (plain security-invoker, grouped by `tool_id` — not a `SECURITY DEFINER` function) exposed via a new `getWaitlistCounts()` in `services/supabase.js` (AD-4)

**Given** admin RLS grants
**When** the admin role is evaluated
**Then** it receives `SELECT` on the `waitlist_counts` view only — it receives no `SELECT` grant on the raw `waitlist` table under any FR, including this one (AD-3, AD-4)

### Epic 3: Secure Course Content Management
Léandro (or another content owner) can create, edit, and delete courses via a gated Admin surface — changes go live with no deploy, and the gate is enforced server-side/by policy, not by hiding the `/admin` route.
**FRs covered:** FR-4
**Implementation notes:** Includes AD-2 (refactor `AdminPage.jsx` off the raw Supabase client onto `services/supabase.js` auth wrappers), AD-3 admin-write RLS on `courses`, and the mandatory audit of the live Supabase project's actual policies (no migration files exist yet — first story here must not assume a clean slate).

### Epic 4: AI Design Assistant (IA tab)
A designer can describe a vague design problem in natural language and receive a structured, copyable generation prompt, with slash commands and project-based conversation organization.
**FRs covered:** FR-5, FR-6
**Implementation notes:** Stands up the `gemini-proxy` Supabase Edge Function (AD-1) for the first time — Epic 5 reuses this proxy rather than duplicating it. Includes the persistent "Assistant IA" disclosure chip (NFR2, UX-DR6).

### Epic 5: AI-Powered UI Builder
A designer can submit a design prompt to UI Builder and get back real, rendered React/Tailwind code, safely sandboxed from the host application.
**FRs covered:** FR-7
**Implementation notes:** Reuses Epic 4's `gemini-proxy` Edge Function (AD-1); adds the sandboxed `<iframe>` rendering boundary (AD-5).

### Epic 6: Tool Waitlist & Demand Signal
A designer can signal interest in a not-yet-built tool with one click; Léandro can see aggregated per-tool waitlist demand from the Admin surface to decide what to build next.
**FRs covered:** FR-8, FR-9
**Implementation notes:** Includes the `waitlist_counts` aggregate view (AD-4) — admin role gets `SELECT` on the view only, never on the raw `waitlist` table, even though FR-8 (join) ships first within this epic.
