---
title: Reconciliation — Market Research vs PRD
source: _bmad-output/planning-artifacts/research/market-formation-ia-designers-ui-ux-research-2026-08-05.md
target: _bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md
date: 2026-08-06
---

# Reconciliation: Market Research → PRD

## Method

Read both documents fully. Confirmed the PRD already surfaces several research findings explicitly: Le Laptop as a named competitor (§9 Open Question 7), cohort/micro-learning completion rates as a deferred v2 consideration (§6.2), EU AI Act transparency obligations (§4.3, §8), and the Gemini rate-limiting/cost risk (§8). Those are not re-flagged below. What follows is material present in the research that has no reflection — explicit or implicit — anywhere in the PRD.

## Gaps Found

### 1. The "skills" mechanism — the research's central durable differentiator — is entirely absent from the PRD

The research repeatedly identifies a community "skills" marketplace (shareable design heuristics/prompt frameworks/presets) as the single most defensible, hard-to-replicate opportunity: it's named as the top opportunity in the Competitive Landscape section, the closing line of the Perspective Marché Future section ("l'actif le plus durable identifié dans cette recherche"), and Phase 2 of the recommended roadmap ("lancement des premières 'skills' spécialisées design comme fonctionnalité phare"). The word "skill" does not appear anywhere in the PRD — not in the Glossary, not in Features (§4), not in MVP Scope (§6), not in Success Metrics (§7). The PRD's closest analog is "Prompt hand-off" (IA tab → UI Builder), which is a single-user, non-shareable, non-communal mechanism — structurally different from what the research describes (user-contributed, browsable/reusable across the user base, producing a network effect). This isn't a wording difference; the PRD has no feature, FR, or even an Open Question addressing whether/when a skills mechanism gets built.

### 2. Pricing/monetization model — research's #1 priority recommendation — is sidestepped, not resolved

Research Recommendation #1 ("Clarifier le pricing et le modèle avant tout") frames choosing among three market-standard pricing models (bootcamp, subscription+community, B2B catalog) as a prerequisite to conversion. The PRD avoids this by declaring Vibe Hub internal-only with "no external monetization" (§5 Non-Goals, §2.2). That may be a legitimate scoping decision, but the PRD never acknowledges that this sidesteps the research's top-priority recommendation, nor does it note the tension for future readers (e.g., if Vibe Hub is later pitched externally per Open Question 1 on "Mandate," the pricing question resurfaces immediately). No Open Question or Assumption captures this.

### 3. Landing-page credibility/social-proof fixes are not reflected in the Landing Page feature

Research flags placeholder-photo/no-social-proof as a "high, short-term" risk requiring fixes before any acquisition spend (Recommendations #3, Risk Assessment: "placeholders visibles (photo, vidéo) sur un produit au positionnement premium"), and Phase 1 of the roadmap explicitly includes "photo réelle, démo publique." FR-1 (Landing Page) in the PRD covers only structural sections (hero, social proof section, program overview, FAQ) and auth-free rendering — it does not require that the social-proof content be real (vs. placeholder) as a testable consequence, and no FR or Open Question tracks this as a launch gate the way FR-2/SM-3 does for course-content placeholders. Given the PRD is diligent about flagging the analogous course-content placeholder problem as a blocker (FR-2, SM-3), the omission of the equivalent landing-page credibility gate is a real gap, not just different phrasing.

### 4. Freemium-vs-waitlist access model arbitrage is not addressed

Research devotes a full section to arguing, with specific benchmark data (15–24% trial-to-paid conversion, gamified onboarding lift, "master something in one session"), that a closed beta waitlist for *entering the product* underperforms a direct, quota-limited free access model. The PRD's only waitlist mechanism (FR-8) is per-tool (for the four not-yet-built AI tools), not for the product itself — and since v1 has no public signup or auth barrier (§2.3 UJ-1 assumption), the PRD implicitly resolves this differently (open internal access, no gate at all) without ever citing or engaging with the research's freemium-vs-waitlist analysis. Worth flagging because the research's reasoning (time-to-first-value drives conversion) is directly relevant to onboarding/first-session design choices the PRD doesn't currently address.

### 5. Completion-rate benchmarks aren't used to ground Success Metric targets

Research supplies concrete anchor numbers (5–15% completion for free/self-paced vs. 60% for paid-certificate, 85–96% for cohort, 80%+ for micro-learning under 2h) explicitly intended to inform target-setting ("KPIs à suivre ... viser >50% via micro-learning/cohorte"). PRD §7 leaves SM-1/SM-2 targets as "TBD" (flagged as an Open Question, #2) but doesn't reference these benchmark figures as candidate anchors even provisionally, despite pulling other research figures (91% weekly AI adoption, EU AI Act date) into the document elsewhere.

## Non-Gaps (explicitly already covered, not re-flagged)

- Le Laptop / competitive threat — PRD §9 Open Question 7.
- Cohort vs. self-paced completion-rate research — PRD §6.2, named explicitly as a deferred v2 consideration.
- EU AI Act AI-disclosure requirement — PRD §4.3, §8.
- Gemini API cost/rate-limiting risk — PRD §8.
- Generic-vs-design-specific AI training gap — reflected in PRD §1 Vision statement.
