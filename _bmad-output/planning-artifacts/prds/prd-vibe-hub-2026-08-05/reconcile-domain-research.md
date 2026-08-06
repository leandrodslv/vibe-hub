---
title: Reconciliation — Domain Research vs PRD
source: _bmad-output/planning-artifacts/research/domain-ai-edtech-platforms-for-ui-ux-designers-research-2026-08-05.md
target: _bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md
date: 2026-08-06
---

# Reconciliation: Domain Research → PRD

## Method

Read both documents in full. Compared every substantive claim, risk, and recommendation in the domain research report against the PRD's Vision, Features/FRs, Constraints, Open Questions, and Assumptions Index. Items already reflected — even under different wording (e.g. EU AI Act disclosure, GDPR exposure via Supabase/auth, the "Le Laptop" competitive gap, internal-only positioning) were excluded. Only items with no meaningful trace in the PRD are listed below.

## Gaps Found

### 1. Commoditization risk of the core AI-generation capability — not carried into the PRD's risk/constraints thinking
The research's single most-repeated strategic risk (flagged in Competitive Dynamics, Technical Trends, Recommendations, and both Executive Summaries) is that foundation-model providers are absorbing point-solution AI design tools directly (Google acquiring Galileo AI → Stitch, mid-2025) and adding native "generative UI" at the model layer (Gemini) — meaning a bare prompt-to-UI generator like Vibe Hub's UI Builder is a shrinking moat, not a durable one. The research's explicit mitigation is to differentiate through curriculum integration rather than raw generation capability.

The PRD's §8 Constraints section covers Privacy, AI transparency, and Cost, but has no "competitive/technology risk" entry at all, and FR-7 (UI Builder) describes the tool as a standalone prompt-to-code generator with no mention of this dependency or erosion risk. Open Question 7 captures the "Le Laptop" competitor by name but not the broader foundation-model-commoditization threat, which the research treats as the more strategically urgent one.

### 2. Curriculum-aware / graded UI Builder — the research's core differentiation recommendation is absent
The research repeatedly recommends (Recommendations, Implementation Opportunities, §6 Strategic Insights, §8 Strategic Recommendations) making the AI UI-generator tab "curriculum-aware" — tying generation to graded/guided exercises linked to course content, and having the chat assistant, modules, and generator interoperate bidirectionally — as the one differentiator no named competitor (Uizard, Figma AI, Google Stitch) offers, since none of them are education-first.

The PRD's Prompt hand-off (Glossary, FR-5/FR-7) only covers one direction — chat produces a prompt, user pastes it into UI Builder — a UX convenience, not the graded/curriculum-linked exercise model the research frames as the actual defensible category-defining feature. This is a positioning-level gap: nothing in Vision, Features, or Non-Goals engages with whether UI Builder output should ever be tied back to course modules as an exercise.

### 3. Accessibility (ADA Title II / WCAG) — not mentioned anywhere in the PRD
The research flags accessibility compliance (ADA Title II, April 2026 deadline) as trending toward a baseline expectation even for consumer-facing products, and worth "building in early." The PRD's Constraints/NFR section has no accessibility mention at all (not in §8, not as a Feature-specific NFR, not in Open Questions). Given this is explicitly called a "Lower near-term risk" in the research (not a blocker), its total absence from the PRD is a minor-to-moderate gap rather than critical, but it's the one compliance category from the Regulatory section with zero trace.

### 4. Content-staleness / "teach judgment over tool UI" risk — not reflected in course-content strategy
The research's Technical Trends and Recommendations sections make a specific, recurring argument: curricula that teach "how to use AI tool X's interface" go stale within months given the pace of model releases, so durable differentiation requires anchoring content on transferable AI-assisted-design judgment rather than tool-specific tutorials. This is called out as directly relevant to Vibe Hub's own course content strategy.

The PRD's Course Catalog feature (§4.2, FR-2/FR-3) discusses content authenticity (retiring placeholder duplicates) and progress tracking, but has no requirement, note, or open question addressing what the course content should teach or how it should be kept current against this staleness risk — a content-strategy gap the research explicitly ties to Vibe Hub's roadmap.

### 5. French-speaking market as a positive opportunity, not just a competitive threat
The research frames the underserved French-speaking design-learner segment as a "near-term regional opening" / strategic opportunity (Strategic Recommendations, §6.2 Strategic Opportunities) — most named global competitors are English-language/US-first, and no dominant player targets francophone learners with this integrated format. The PRD only touches French-language relevance obliquely, through Open Question 7 about the "Le Laptop" competitor as a threat to respond to. The research's framing of French-language as a market advantage Vibe Hub could lean into (rather than only a competitor to worry about) has no counterpart in the PRD's Vision or Strategic positioning.

## Not Flagged (already covered, different wording)

- EU AI Act transparency/disclosure obligations — PRD §4.3 FR-6 note and §8.
- GDPR exposure from Supabase-stored data — PRD §8.
- Age-verification/minor-consent nuance — reasonably out of scope given PRD's internal-only, presumably adult employee-only audience; not flagged as a gap.
- FERPA/COPPA/US state privacy laws — correctly out of scope; PRD is EU/internal-only, research itself frames US layer as conditional on US expansion.
- SOC 2 / institutional-buyer compliance — correctly out of scope per PRD's internal-only, non-institutional-sales framing; research itself calls this "lower near-term risk."
- Competitive landscape / category-gap positioning (no competitor combines tutor + course + generator) — reflected in PRD's Vision (§1) and Open Question 7.
- Foundation-model API dependency (Anthropic/OpenAI/Gemini) — reflected implicitly via PRD's mention of Gemini-backed chat/UI Builder and Supabase backend framing.
