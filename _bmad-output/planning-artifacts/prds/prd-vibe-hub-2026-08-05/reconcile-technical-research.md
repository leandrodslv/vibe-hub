---
title: PRD Reconciliation — Technical Research (Supabase vs Firebase)
date: 2026-08-06
source: _bmad-output/planning-artifacts/research/technical-supabase-vs-firebase-backend-research-2026-08-05.md
target: _bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md
---

# Reconciliation: Technical Research vs PRD

## Context

The research report's premise ("Vibe Hub currently has no backend... no authentication") is now outdated: the PRD (§1, §4.2, §4.4) confirms Supabase is already live for course data and the waitlist, and the platform choice the research recommended has already been adopted. Most of the report's Supabase-vs-Firebase comparison content (pricing tables, SDK setup steps, migration tooling, self-host escape hatch, GraphQL/RPC options) is now moot at the PRD level — that decision is made and most of it is implementation detail that belongs in architecture docs, not a PRD.

This reconciliation focuses only on what remains **decision-relevant at the requirements level** and is not yet reflected in the PRD.

## Findings

### 1. Per-user data isolation (RLS) is not named as a requirement, despite being the research's core security recommendation

The research repeatedly identifies Row-Level Security scoped to `auth.uid()` as the load-bearing mechanism for course-progress privacy (Design Principles §"Multi-tenancy / data isolation", Security Architecture Patterns, Security Considerations §6, and explicitly as a Success Metric: *"RLS verified: a user cannot read/write another user's progress rows"*).

The PRD's FR-3 (Course progress indication) only requires that progress reflect "real interaction state, not a static/fabricated percentage" — it has no testable consequence requiring that one user cannot read or write another user's progress data. The PRD's Constraints §8 covers GDPR at a compliance-framing level but never states the actual data-isolation guarantee the product needs once user-specific data exists. This is a PRD-appropriate requirement (a testable FR consequence / NFR), not an implementation detail — RLS is one way to satisfy it, but the *requirement* ("a user's progress/personal data must not be visible to other users") belongs in the PRD regardless of which mechanism enforces it.

**Suggested PRD addition:** an explicit consequence under FR-3 (or a new cross-cutting NFR in §8) stating that per-user data must be isolated such that no user can read or write another user's progress/personal records.

### 2. FR-3 (per-user progress) and the Auth deferral (§6.2) are not reconciled — a sequencing gap the research explicitly warns about

The research's Implementation Roadmap and "Technology Adoption Strategies" section is explicit that the correct migration order is **auth first, then progress persistence** — precisely because "per-user" progress only means something once there's a stable notion of "user." The PRD's MVP scope (§6.2) defers "Authentication and user accounts" entirely while still carrying FR-3 (progress tracking, framed as per-user: "a designer sees which courses **they've** started/completed") as an in-scope requirement with only vague qualification ("beyond what FR-3 requires at minimum").

The PRD's Open Question 5 raises auth only in the context of Admin-surface access control, not in the context of what "per-user" progress even means without it. This is a real product-requirements gap: the PRD should either (a) clarify FR-3 means device/session-local progress with no real per-user guarantee for v1, or (b) acknowledge that meaningful per-user progress tracking depends on auth landing first, per the research's recommended sequencing.

### 3. Admin surface access-control gap could point at the specific mechanism, not just "access control" in the abstract

The PRD already flags (FR-4 Notes, Open Question 5) that `/admin` has no access control today. The research goes further by naming the specific two-sided risk once a real backend is exposed to writes: RLS/policy enforcement on the data side, and never shipping the `service_role` key to the client (only the public `anon` key, which is safe only because policies restrict it). The PRD doesn't mention this key-hygiene distinction at all. This is arguably borderline architecture-level, but the underlying requirement — "the Admin surface's write access must be restricted by a real access-control mechanism before rollout, not just security-by-obscurity of an undiscovered URL" — is PRD-appropriate and currently only implied, not stated as a testable consequence.

### 4. Minor: no glossary/data-model anchor for "progress" despite it being a named FR

The Glossary (§3) defines Course, Waitlist tool, Workspace, etc., but has no entry for course progress / enrollment as a first-class concept, even though FR-3 treats it as one. Not a technical-research-specific gap per se, but it's the natural PRD-level place to capture finding #1's isolation requirement once added, and its absence is consistent with per-user progress being under-specified.

## Non-gaps (research content correctly excluded from the PRD)

- Backend platform selection (Supabase vs Firebase) — already decided and implemented; correctly out of PRD scope.
- SQL migrations, `supabase gen types typescript`, CLI workflows, PostgREST/RPC details, Realtime deferral — implementation/architecture-level, correctly absent from a PRD.
- Pricing/cost-predictability comparison — moot once the platform choice is made; PRD's own cost note (§8) about Gemini API usage is the more relevant current cost concern.

## Summary of Gaps

1. No explicit requirement/NFR for per-user data isolation (RLS-equivalent guarantee) despite it being the research's central security recommendation and named success metric.
2. FR-3 (per-user progress) is not reconciled with the Auth deferral in §6.2 — the research explicitly sequences auth before progress persistence, and the PRD doesn't address what "per-user" progress means without auth.
3. Admin-surface access-control gap (already flagged) could be sharpened with the research's specific mechanism (policy-restricted anon key vs. secret service-role key) as the testable bar for "resolved."
4. No glossary/data-model anchor for course progress as a first-class concept, despite FR-3 depending on it.
