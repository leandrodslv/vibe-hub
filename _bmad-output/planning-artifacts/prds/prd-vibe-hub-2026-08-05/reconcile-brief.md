---
title: Reconciliation — PRD vs Brief (Vibe Hub)
created: 2026-08-06
---

# Reconciliation: PRD vs Brief

Source input: `_bmad-output/planning-artifacts/briefs/brief-vibe-hub-2026-08-05/brief.md`
PRD checked: `_bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md`

## Method

Read both documents in full. The PRD explicitly states in §0 that it "builds directly on" the brief and "does not repeat its reasoning," directing readers to the brief for problem framing and competitive rationale — so problem-statement wording differences were not flagged as gaps. The check below is limited to content that is meaningfully absent (not just reworded) from the PRD, including where the PRD's own no-repeat policy leaves a real gap because nothing downstream references the omitted content either.

## Gaps found

### 1. The brief's entire "Ce qui différencie Vibe Hub" section is dropped, including its key self-aware claim

The brief has a dedicated differentiation section making two specific claims:
- The advantage is workflow integration (never needing to leave the platform), not the underlying AI model (Gemini is neither proprietary nor unique).
- **This is explicitly framed as not a defensible moat** — "un concurrent bien financé pourrait reproduire le mécanisme" (a well-funded competitor could replicate the mechanism), to be reassessed once real usage data exists.

The PRD's Vision (§1) mentions the fused-loop mechanism but never states the differentiation is workflow-based rather than technology-based, and — more importantly — never carries forward the "this is not a moat, a competitor could copy it" caveat. This is a real positioning/risk point, not just wording: it affects how a reader should weigh the competitive-response open question (PRD §9.7, "Le Laptop") in the PRD as written. Without it, §9.7 reads as an isolated afterthought rather than as validating a risk already flagged as central to the product's positioning.

### 2. The brief's specific proof-point differentiator — the UI's own design quality — is omitted

The brief states the interface itself ("UI monochrome au niveau d'un vrai design system") is part of the differentiation: the product demonstrates the UI quality it teaches, by being well-designed itself. This is a distinct, concrete claim (product-as-proof-of-concept) that doesn't appear anywhere in the PRD — not in Vision, not in the Landing Page or Workspace feature descriptions, not in any NFR about UI/visual quality bar.

### 3. The brief's longer-term vision (what happens if it works) is not carried into the PRD

The brief's "Vision" section describes a specific end-state trajectory: Vibe Hub becomes the default daily-use internal tool; new AI tools get added directly into the grid the team already uses; the course catalog's role *inverts* over time from being the product's center of gravity to becoming an onboarding layer for an increasingly tool-rich workspace. The PRD's §1 Vision describes only the current/target-for-rollout state (course catalog + live workspace fused in one screen) and stops there — it has no equivalent forward-looking "if this works, here's where it goes" statement, and no mention of the catalog's role shifting over time as more tools ship. This is a distinct piece of directional/strategic intent that's absent, not just condensed.

## Not flagged (covered, just reworded or intentionally deferred per PRD's own scope note)

- Problem framing / current coping mechanisms (YouTube tutorials, Discord tips) — PRD explicitly defers to brief for this, consistent with §0.
- Target user nuance (no-code, no coding background, team-lead secondary user, possible expansion to other internal teams, team size uncertainty) — present in PRD §2.1, §2.2, §9.3.
- Scope boundaries (auth, progress tracking, routing, four waitlisted tools, TypeScript) — present in PRD §6.2, matches brief's "hors périmètre" list.
- Success criteria (loop completion, adoption %, content-credibility launch gate) — present in PRD §7 (SM-1/SM-2/SM-3).
- Mandate/governance uncertainty, content-pipeline bottleneck, competitive mention of "Le Laptop" — present in PRD §9 Open Questions.

## Summary

Three related gaps, all under the same theme: the brief's differentiation/positioning narrative (workflow-not-tech advantage, explicit non-defensibility, product-as-proof-point UI quality) and its forward-looking vision (catalog becomes onboarding layer as tool grid grows) are present in the brief but have no counterpart anywhere in the PRD.
