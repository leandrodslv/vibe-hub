---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - supabase/functions/gemini-proxy/index.ts
  - supabase/functions/course-draft/index.ts
supersedes: none
extends: _bmad-output/planning-artifacts/epics.md
---

# Vibe Hub — AI Operations Epic Breakdown

## Overview

Today, `gemini-proxy` (Epic 4) and `course-draft` (Epic 10) both call the Gemini API through
a single server-side secret, `GEMINI_API_KEY` — but nothing in the app ever looks at what
those calls cost. There is no visibility into how many tokens have been consumed, no
breakdown by feature, and no record of when the key was last rotated. This document adds the
epic needed to close that gap: an admin-only "Utilisation IA" space showing real token usage
captured from the app's own Gemini calls, plus a safe way to track (not perform) API key
rotation.

## Requirements Inventory

### Functional Requirements

FR-19: AI usage visibility — an admin can see, from within `/admin`, how many Gemini tokens
the app has consumed (prompt/output/total), broken down by feature (`gemini-proxy` — the IA
design assistant, vs `course-draft` — the video-to-course brouillon) and by time window,
without leaving the app or logging into Google AI Studio.

FR-20: API key rotation tracking — an admin can see when the active Gemini API key was last
rotated and log a new rotation event (date + optional note) from `/admin`, as a record-keeping
aid — the rotation itself still happens outside the app (see AD-13; this is a deliberate
boundary, not a gap).

### Additional Requirements (Architecture — extends AD-1…AD-11)

- AD-12 (extends AD-1): usage logging is best-effort and strictly after-the-fact. Both Edge
  Functions attempt to insert one `ai_usage_log` row per successful `generateContent` call,
  reading `res.usageMetadata` (`promptTokenCount`/`candidatesTokenCount`/`totalTokenCount`) —
  but the insert is wrapped so any failure (network blip, RLS mistake, missing
  `usageMetadata`) is caught and silently ignored. Logging must never delay, alter, or fail the
  actual response already generated for the end user. Writes go through `service_role` (Edge
  Functions only, per AD-1); `ai_usage_log` has no `INSERT` policy for `authenticated`/`anon`.

- AD-13 (extends AD-1/AD-2): the Gemini API key itself is never read, displayed, written, or
  editable through the app or browser, at any admin level. `supabase secrets set` (CLI) or the
  Supabase dashboard remain the only way to rotate it — unchanged from today. **Investigated
  and explicitly rejected**: a "change key" field in `/admin` that writes the real secret would
  require embedding a Supabase **Management API** personal access token in the app's own
  server environment — a credential with strictly greater blast radius than the Gemini key it
  would replace (full project access: every secret, every table, project deletion), just to
  save the ~10 seconds a manual `supabase secrets set` already takes. FR-20 is deliberately
  scoped to *tracking metadata about* a rotation (when, by whom, optional note) in a new
  `ai_key_rotations` table — never the secret value — same posture as the Facebook-oEmbed
  deferral in Epic 10 (Story 10.4): the safer, less capable option was chosen on purpose.

### FR Coverage Map

FR-19: Epic 11 — Story 11.1 (usage logging), Story 11.2 (dashboard)
FR-20: Epic 11 — Story 11.3 (rotation tracking)

## Epic List

### Epic 11: AI Operations & Cost Visibility
An admin can answer "how much Gemini are we actually using, and when did we last rotate the
key?" from inside `/admin`, without guessing or leaving the app — while the key itself stays
exactly as protected as it is today (server-only secret, AD-1/AD-13).
**FRs covered:** FR-19, FR-20
**Implementation notes:** No client ever sees `GEMINI_API_KEY`. New table `ai_usage_log`
(service_role-written, admin-read) captures real `usageMetadata` from both existing Edge
Functions. New table `ai_key_rotations` is pure metadata, admin-written. New "Utilisation IA"
view in `AdminPage.jsx`, following the same pill-toggle pattern Epic 6 (Story 6.2) established
for "Demande outils".

---

## Epic 11: AI Operations & Cost Visibility

**Status: done — shipped 2026-09-15.**

### Story 11.1: Capture Gemini Token Usage Server-Side

As the app operator,
I want every successful Gemini call to log its token usage,
So that there is a real, first-party record of consumption instead of having to trust memory
or check Google AI Studio by hand.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** a new migration
**When** it is applied
**Then** it creates `ai_usage_log` (`id`, `created_at`, `endpoint` — `check` constrained to
`'gemini-proxy'`/`'course-draft'`, `model`, `prompt_tokens`, `candidates_tokens`,
`total_tokens`) with RLS enabled, a `SELECT` policy re-checking `is_admin()` (same
defense-in-depth pattern as `0011_admin_access_control.sql`), and **no** `INSERT` policy for
`authenticated`/`anon` — only `service_role` (which bypasses RLS) writes to it, exactly like
the Storage bucket pattern from Epic 10 Story 10.5

**Given** `gemini-proxy`'s `generateContent` call succeeds
**When** the response is about to be returned to the caller
**Then** the function separately inserts one `ai_usage_log` row from `res.usageMetadata`,
wrapped in its own `try/catch` that only `console.error`s on failure — a logging failure never
changes the HTTP response already computed for the user (AD-12)

**Given** `course-draft`'s `generateContent` call succeeds (either the `videoUrl` or
`storagePath` branch)
**When** the draft is about to be returned
**Then** the same logging happens, tagged `endpoint: 'course-draft'` — both branches share one
logging helper so the two Edge Functions can't drift on the row shape

**Given** an SDK response with no `usageMetadata` (older SDK version, unexpected shape)
**When** logging runs
**Then** the insert is skipped entirely rather than writing a row of nulls — no bad data,
no crash

**Implementation:** `supabase/migrations/0014_ai_usage_log.sql` (applied live), `supabase/
functions/_shared/ai-usage-log.ts` (new shared module — `logAiUsage(endpoint, model, usage)`,
imported by both functions via a relative path, runs the actual insert through
`EdgeRuntime.waitUntil()` when available so it never delays the response already computed),
`supabase/functions/gemini-proxy/index.ts` and `supabase/functions/course-draft/index.ts`
(both call it right after their `generateContent` call succeeds — `course-draft`'s two
generator helpers now return `{ raw, usageMetadata }` instead of a bare string). Deployed live:
`gemini-proxy` v7, `course-draft` v6 — both smoke-tested post-deploy (400/401 respectively on a
bodyless request, confirming the new relative import resolved and neither function crashed on
boot).

### Story 11.2: "Utilisation IA" Admin Dashboard

As an admin,
I want to see Gemini token usage broken down by feature and time window in `/admin`,
So that I know where consumption is actually going without cross-referencing Google's own
console.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** the admin dashboard's existing pill toggle ("Cours" / "Demande outils", Epic 6 Story
6.2)
**When** this story ships
**Then** a third pill, "Utilisation IA", opens a new view following the same visual pattern
(Franc design tokens, same loading/empty/error states)

**Given** the "Utilisation IA" view loads
**When** it fetches data
**Then** it calls a new admin-gated aggregation (RPC or direct query, following the
`get_waitlist_counts()` precedent — SQL does the aggregation, not the client) returning total
tokens and call counts for the last 7 and 30 days, split by `endpoint`

**Given** the aggregated totals
**When** they are displayed
**Then** an estimated cost is shown alongside the raw token counts, clearly labeled as an
**estimate** computed from `gemini-2.5-flash-lite`'s public per-token pricing — explicitly not
Google's authoritative billing figure, which requires a Google account login and is out of
reach of a server API key call (same class of boundary as the Facebook oEmbed deferral: the
real number lives somewhere this app has no credentialed access to)

**Given** zero usage has been logged yet (fresh deploy, or before Story 11.1 ships)
**When** the view loads
**Then** it shows a clear empty state ("Aucune donnée d'utilisation pour l'instant") rather
than a blank or broken chart

**Implementation:** `public.get_ai_usage_summary()` (same migration as 11.1 — `security
definer`, filters internally on `is_admin()`, same guard pattern as `get_waitlist_counts()`),
`src/lib/schemas/ai-usage.js` (`aiUsageSummaryRowSchema`, `.strict()`), `src/services/
supabase.js` (`getAiUsageSummary()`), `src/pages/AdminPage.jsx` (third pill "Utilisation IA",
`AiUsageView`, `estimateUsdCost()` using the `GEMINI_FLASH_LITE_PRICE_PER_1M` constant
verified against ai.google.dev's pricing page on 2026-09-15: $0.10/1M input, $0.40/1M output).
Verified live via Playwright: the view renders and correctly falls into its error state
(`"permission denied for function get_ai_usage_summary"`) when hit by an unauthenticated
session — proof the `revoke ... from anon` + `is_admin()` filter actually blocks a non-admin
caller, same class of check as Story 10.5's Storage RLS test. The populated-data success path
(a real admin session with logged usage) was not exercised in this session.

### Story 11.3: Track API Key Rotation (Metadata Only)

As an admin,
I want to log when I've rotated the Gemini API key and see the last rotation date in
`/admin`,
So that I have a reminder of key hygiene without the app ever touching the real secret (AD-13).

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** a new migration
**When** it is applied
**Then** it creates `ai_key_rotations` (`id`, `rotated_at`, `rotated_by` — `references
auth.users`, `note` nullable) with RLS enabled and both `SELECT`/`INSERT` policies re-checking
`is_admin()` — this table holds only metadata an admin chooses to record, never a secret value

**Given** the "Utilisation IA" view (Story 11.2)
**When** an admin opens it
**Then** it shows "Dernière rotation : `<date>`" (or "Aucune rotation enregistrée" if the table
is empty) sourced from the most recent `ai_key_rotations` row

**Given** an admin has actually rotated the key by hand (`supabase secrets set
GEMINI_API_KEY=...` + `supabase functions deploy`, unchanged from today)
**When** they click "Marquer comme tournée aujourd'hui" and optionally add a note
**Then** a new `ai_key_rotations` row is written with `rotated_by` set to their own admin user
id — this button never contacts Google or Supabase secrets in any way, it only writes to this
app's own database

**Given** the temptation to add a real "paste new key here" field
**When** this story is scoped
**Then** it is explicitly out (AD-13) — the UI only ever displays/collects rotation
*metadata*, and the view includes a short reminder of the real CLI command for admins who
forget it

**Given** no rotation has ever been logged, or the most recent one is 90+ days old
**When** the "Clé Gemini" card renders
**Then** it switches to a visible warning state (error-tinted icon, a bold warning line — "⚠
Plus de 90 jours depuis la dernière rotation" or, if never logged, "⚠ Aucune rotation connue")
instead of the neutral grey state — purely a client-side date comparison against
`GEMINI_API_KEY` threshold `KEY_ROTATION_WARNING_DAYS = 90`, no new infrastructure; a rotation
younger than the threshold shows the plain "Dernière rotation : `<date>` (il y a N jours)" line
with no warning

**Implementation:** `public.ai_key_rotations` (same migration as 11.1, RLS `select`/`insert`
policies re-checking `is_admin()`, same posture as `courses`), `src/lib/schemas/ai-usage.js`
(`keyRotationSchema`), `src/services/supabase.js` (`getLastKeyRotation()`, `logKeyRotation()`),
`src/pages/AdminPage.jsx` (the "Clé Gemini" card inside `AiUsageView` — `KEY_ROTATION_WARNING_
DAYS`, note input, "Marquer comme tournée aujourd'hui" button, staleness warning). Tests:
`src/services/supabase.test.js`. Verified live via Playwright with mocked REST responses (real
admin auth unavailable in this session) across all three states — never rotated, 5 days ago,
120 days ago — confirming the warning triggers and clears exactly at the intended boundary.
