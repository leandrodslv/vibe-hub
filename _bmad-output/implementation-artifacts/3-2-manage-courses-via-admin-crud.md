# Story 3.2: Manage Courses via Admin CRUD

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Léandro (content owner),
I want to create, edit, and delete course records from the Admin surface,
so that the Modules tab always reflects real course content without a deploy.

## Acceptance Criteria

1. **RLS audit precedes implementation.** No migration files exist in the repo (no `supabase/` folder at all) — before writing any policy, the live Supabase project's actual existing RLS state on `courses` must be checked (via Supabase Studio → Authentication → Policies, or `supabase db pull` if CLI-linked). Do not assume a clean slate. [Source: architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md#Deferred]
2. **CRUD reflects live, no deploy.** Authenticated admin creating/editing/deleting a course via `AdminPage` (Dashboard) is reflected in `ModulesTab` without a code deploy. This already works today via `getCourses()`/`getAllCourses()` reading live from Supabase — this AC formalizes it as a requirement and a regression to protect, not new code to write. [Source: prd.md#FR-4]
3. **RLS enforces write authority, not client code.** An authenticated admin-role session can perform full CRUD (`SELECT`/`INSERT`/`UPDATE`/`DELETE`) on `courses`. An anon/unauthenticated session attempting the same write is rejected by Postgres RLS — not merely hidden by the UI. [Source: architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md#AD-3]
4. **Inline success confirmation.** On a successful course save (create or edit), the `CourseModal` shows an inline confirmation on the form itself — not a page navigation, not just a silent modal close. [Source: ux-vibe-hub-2026-08-06/EXPERIENCE.md#State-Patterns — "Admin: course save succeeded"]
5. **Inline failure handling, edits retained.** On a failed course save (validation or write failure), `CourseModal` shows an inline error — on the specific failing field(s) if identifiable, otherwise form-level — and the user's in-progress form input is never discarded. [Source: ux-vibe-hub-2026-08-06/EXPERIENCE.md#State-Patterns — "Admin: course save failed"]
6. **No client-side credential can bypass RLS.** The browser's anon Supabase key cannot perform admin-level writes on its own under any circumstance — write authority is enforced entirely by Postgres RLS (AC 3); any client-side session check in `AdminPage.jsx` remains UX-only convenience, never the actual security boundary. [Source: prd.md#FR-4 Consequences]

## Tasks / Subtasks

- [ ] Task 1: Audit and establish `courses` RLS policy baseline (AC: #1, #3, #6)
  - [ ] 1.1 Check the live Supabase project's Authentication → Policies for the `courses` table; document what (if anything) currently exists — do not assume RLS is even enabled today
  - [ ] 1.2 Initialize `supabase/migrations/` (does not exist yet — no `supabase/` folder in the repo at all) and write a migration enabling RLS on `courses` with: anon/public role `SELECT` only where `published = true`; authenticated role full `SELECT`/`INSERT`/`UPDATE`/`DELETE`
  - [ ] 1.3 **Do not apply the migration to the live project without explicit confirmation** — this is a live Supabase project already storing real course data (per PRD §8 Constraints); writing the migration file is in scope, running `supabase db push` (or pasting into the SQL Editor) against production is a deployment action, flag it back rather than running it autonomously
  - [ ] 1.4 Verify: an anon-key client attempting `insert`/`update`/`delete` on `courses` is rejected after the policy is applied; an authenticated session succeeds
- [ ] Task 2: Add inline success confirmation to course save (AC: #4)
  - [ ] 2.1 In `CourseModal` (`src/pages/AdminPage.jsx`), add local UI state to track a "saved" confirmation after `onSave` resolves successfully
  - [ ] 2.2 Show the confirmation inline within the modal (not a route/page change) before the modal closes — brief visible confirmation, consistent with the existing `saving` spinner pattern already in the submit button
- [ ] Task 3: Add inline failure handling to course save, preserving input (AC: #5)
  - [ ] 3.1 Wrap the `onSave(form)` call in `CourseModal.handleSubmit` in try/catch — today it is unguarded, so a thrown Supabase error (per the service layer's throw-on-error convention) would be an unhandled rejection with no user feedback
  - [ ] 3.2 On catch, display an inline form-level error message in the modal; do NOT clear or reset `form` state — the user's typed values must remain exactly as entered
  - [ ] 3.3 Keep `saving` state accurate through the catch path so the submit button returns to its normal (non-spinner) state and remains clickable to retry
- [ ] Task 4: Regression-check the existing CRUD flow against the new RLS policy (AC: #2, #3)
  - [ ] 4.1 Confirm `getAllCourses`, `createCourse`, `updateCourse`, `deleteCourse` in `src/services/supabase.js` (unchanged by this story) still succeed end-to-end for an authenticated admin session once RLS is applied
  - [ ] 4.2 Confirm a create/edit/delete from the Dashboard is reflected in `ModulesTab`'s `getCourses()` read without any deploy step, per the existing live-Supabase pattern

## Dev Notes

**Scope boundary:** this story only touches the `courses` table and the Dashboard/`CourseModal`/`CourseRow` CRUD surface within `AdminPage.jsx`. It does NOT touch:
- The `LoginScreen`/session-gate logic in `AdminPage.jsx` (raw `supabase.auth.*` calls) — that refactor onto `services/supabase.js` wrappers (`signIn`/`signOut`/`getSession`/`onAuthStateChange`) is **Story 3.1**'s responsibility (AD-2). No Story 3.1 file exists yet in this repo at time of writing — if it hasn't shipped, the admin gate itself (password screen, session handling) is out of scope here; this story assumes an authenticated Supabase session already exists by the time `Dashboard` renders.
- The `waitlist` table or its RLS — that's Epic 6 (AD-3's waitlist half, AD-4).

**Current implementation is already ~80% there.** `src/pages/AdminPage.jsx`'s `Dashboard`, `CourseModal`, `CourseRow`, `DeleteModal`, and `EmptyState` components already implement full course CRUD (add/edit/delete/publish-toggle) against `services/supabase.js`'s `getAllCourses`/`createCourse`/`updateCourse`/`deleteCourse` — which already follow the architecture's "throw on Supabase error" convention correctly. **Do not rewrite this from scratch.** The real gaps are narrow:
1. No RLS policies exist at all (no `supabase/` folder in the repo) — Task 1.
2. `CourseModal.handleSubmit` has no error handling — a failed save today is an unhandled promise rejection with zero user feedback (Task 3).
3. Save success just closes the modal silently — no inline confirmation (Task 2).
4. `order_index` assignment on create (`maxOrder + 1` in `Dashboard.handleSave`) is already correct per the architecture's canonical-ordering rule — do not change this logic.

**Actual `courses` schema (inferred from `CourseModal`'s form state — this is the real shape, not the PRD Glossary's simplified `title/description/time estimate/image`):**
`id`, `module_name` (one of `'MODULE 1' | 'MODULE 2' | 'MODULE 3'`), `title`, `description`, `duration` (free-text string, e.g. `"12:45"`), `image_url`, `video_url`, `published` (boolean), `order_index` (integer, canonical sort key per Architecture Consistency Convention — never `created_at`).

**Known gap — NOT in scope for this story, flagged for Léandro:** `CourseDetail.jsx`'s "Mode Lecture" (reading mode) content — the actual lesson body text (the "Latent Space" / prompt-anatomy paragraphs) — is **entirely hardcoded in the component**, identical for every course regardless of which one is opened. There is no `courses` field for it and no Admin form field to author it. Neither this story's ACs nor Epic 2's Story 2.2 ACs currently define a schema or authoring UI for this. This is a real product gap for "distinct course content" beyond the catalog card (title/description) — see the question at the end of this session.

**RLS reference (AD-3, `courses` half only):**
```sql
alter table courses enable row level security;

create policy "public can read published courses"
  on courses for select
  to anon
  using (published = true);

create policy "authenticated can do anything"
  on courses for all
  to authenticated
  using (true)
  with check (true);
```
Adjust to match whatever the Task 1.1 audit finds already in place — do not blindly apply this if conflicting policies already exist.

**Testing standards:** No test framework is configured in this repo (no `test` script in `package.json`, no Vitest/Jest dependency). There is no existing test convention to follow. Verification for this story is manual: Task 1.4 (RLS rejects anon writes / accepts authenticated writes) and Task 4 (CRUD still works end-to-end and reflects live in `ModulesTab`) — do not introduce a test framework as a side effect of this story.

### Project Structure Notes

- Files to modify: `src/pages/AdminPage.jsx` (CourseModal only — inline confirm/error states)
- Files to create: `supabase/migrations/<timestamp>_courses_rls.sql` (first file in a `supabase/` folder that does not currently exist in this repo)
- No changes needed to `src/services/supabase.js` — its CRUD functions already comply with the architecture's conventions (throw-on-error, `order_index` handling is done by the caller in `AdminPage.jsx`, not the service layer)
- No new dependencies required

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3-Secure-Course-Content-Management, Story 3.2]
- [Source: _bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md#FR-4]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md#AD-3, #AD-2, #Structural-Seed, #Deferred]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/EXPERIENCE.md#State-Patterns, #Information-Architecture]
- [Source: src/pages/AdminPage.jsx — existing Dashboard/CourseModal/CourseRow/DeleteModal implementation]
- [Source: src/services/supabase.js — existing getAllCourses/createCourse/updateCourse/deleteCourse]

## Git Intelligence

Only 3 commits exist in this repo (`37c7352` initial commit, `8beb0ed` brief, `c466743` PRD/UX/Architecture docs) — no prior implementation commits to learn patterns from. The existing `AdminPage.jsx`/`services/supabase.js` code (present since the initial commit) is the only established pattern to follow; treat its conventions (throw-on-error services, component-local `useState`, Tailwind utility classes, no global state manager) as the baseline per AD-6.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
