# PRD Quality Review — Vibe Hub

## Overall verdict
This PRD holds up well: it has a real thesis (workflow integration, not the model, as the differentiator), FRs with testable consequences, and an unusually honest assumption/open-question apparatus for a solo-builder document. The main risks are a lightly-loaded persona (§2.1 team-lead JTBD) that never earns a UJ or FR, one internally inconsistent scope claim around auth/progress tracking, and a MVP whose highest-stakes item (Admin surface has zero access control, publicly discoverable) is parked as an Open Question rather than resolved as a decision.

## Decision-readiness — strong
The PRD states real trade-offs rather than smoothing them: §1 explicitly says Gemini/UI Builder is "not a defensible moat" and §8 names commoditization risk from foundation-model "generative UI" features directly threatening UI Builder's mechanism. FR-3's Notes make a real sequencing call ("this FR is **sequenced after** authentication... a session-local or team-wide placeholder is the most that's honestly deliverable") rather than hand-waving progress tracking into existence. Open Question 5 (§9) is genuinely open — it surfaces the admin-surface exposure risk and asks whether it's acceptable, without answering it for the reader.

### Findings
- **high** Admin exposure risk is named but not decided (§9 OQ-5, §4.2 FR-4 Notes, §6.2) — The PRD documents that `/admin` has no access control and any discoverable path lets an untrusted party edit the whole catalog, then defers auth to v2 without a decision-maker adjudicating whether that's acceptable pre-rollout. For a document meant to greenlight a real-team rollout, this is the one item that most needs a stated decision, not another open question. *Fix:* Force a call — either "auth ships before rollout" or "accepted risk because X" — rather than leaving it in the Open Questions bucket alongside lower-stakes items like naming/positioning.

## Substance over theater — adequate
Personas are load-bearing for the most part — UJ-1/UJ-2/UJ-3 each drive concrete FRs (Priya → FR-2/FR-5/FR-7; Léandro → FR-4; the waitlisting designer → FR-8/FR-9). The Vision (§1) is specific to this product (chat-to-tools hand-off phrase, "not a defensible moat" admission) rather than swappable boilerplate. NFRs in §8 carry actual thresholds (WCAG 2.1 AA suggestion, EU AI Act Aug 2026 date) instead of "must be secure/scalable" filler.

### Findings
- **medium** Team-lead/manager JTBD is persona theater (§2.1, tagged `[ASSUMPTION]`) — "As a team lead/manager, I want visibility into whether my design team is actually adopting AI tools" appears once and never resurfaces: no UJ has a manager protagonist, no FR delivers team-level adoption visibility (SM-2 is a product metric Léandro would see, not a manager-facing feature). It reads like a JTBD added for completeness rather than one that shaped scope. *Fix:* Either cut it, or if it's meant to matter, add an FR/UJ for manager-facing visibility — otherwise flag explicitly as deferred so it doesn't imply unbuilt scope.

## Strategic coherence — strong
The thesis is explicit and consistently bet on: the moat is the course→prompt-hand-off→generation loop staying inside one session, not the AI model (§1, restated in §8's commoditization risk, and directly targeted by Open Question 10 on deepening the bidirectional link). SM-1 ("Loop completion") measures exactly this thesis rather than raw activity, and SM-C1 is a real counter-metric (waitlist size without follow-through). MVP scope logic follows the thesis: content-blocker (FR-2/duplicated placeholders) and the loop mechanics (FR-5/FR-7) are in scope; the four waitlisted tools and cohort/graded formats are explicitly deferred (§6.2) rather than smuggled in.

## Done-ness clarity — adequate
Most FRs carry testable consequences with concrete verification (e.g., FR-2: "no duplicated placeholder entries"; FR-7: "returns renderable React/Tailwind code... within the tool's UI"; FR-8: "cannot submit to the waitlist for a tool that is already live"). A grep for common vague-boilerplate phrasing ("gracefully," "user-friendly," "reasonable performance," "seamless") returned nothing — a good sign this dimension was taken seriously.

### Findings
- **medium** FR-6's "documented" consequence is soft (§4.3) — "At least one slash command is available and documented to the user (e.g., via a `/help` or autocomplete affordance)" leaves the bar for "documented" undefined; an engineer could satisfy this with a one-line tooltip or a full command reference and both would pass. *Fix:* Name the minimum affordance (e.g., "typing `/` surfaces a list of available commands with descriptions") so it's independently verifiable.
- **low** FR-9's "viewable somewhere" is a weak bound (§4.4) — "Per-tool waitlist counts are viewable somewhere (Admin surface or direct data access) without querying the database by hand" is testable but sets a very low bar disguised as flexibility, and directly correlates with Open Question 6 asking whether this even exists yet. *Fix:* Once OQ-6 is resolved, tighten this to name the actual surface.

## Scope honesty — strong
Non-Goals (§5) does real work (rules out SaaS, general chat competitor, plugin, certification). `[ASSUMPTION]` tags are used liberally and correctly indexed — the §10 Assumptions Index round-trips cleanly against inline tags (spot-checked: §1, §2.1, §2.2, UJ-1/2/3, FR-3, FR-4, FR-9, §7, §8 all appear both inline and in the index). `[NOTE FOR PM]` callouts land on genuine tensions (admin access control, EU AI Act compliance verification, accessibility bar, content-durability framing) rather than safe checkpoints. Open-items density (10 Open Questions + 15 `[ASSUMPTION]` tags + 6 `[NOTE FOR PM]` callouts) is high, but proportionate: Open Question 1 states the mandate itself is unresolved ("Is Vibe Hub officially sanctioned... or Léandro's own initiative"), which honestly justifies a document that reads as pre-decision rather than green-lit.

## Downstream usability — adequate
Glossary (§3) is present and its ten terms are used consistently in the FRs that follow (spot-checked "Course Progress," "Waitlist tool," "Prompt hand-off," "Admin surface" against their FR usages — no drift found). FR IDs (FR-1–FR-9), UJ IDs (UJ-1–UJ-3), and SM IDs (SM-1–SM-3, SM-C1) are contiguous and unique, and "Realizes UJ-x" cross-references all resolve to UJs that exist. Every UJ has a named protagonist (Priya, Léandro, an unnamed-but-scoped "designer browsing the Outils tab" for UJ-3 — the third is a minor exception to full naming but is contextually anchored, not floating).

### Findings
- **low** UJ-3's protagonist is unnamed (§2.3) — "A designer browsing the Outils tab" versus Priya (UJ-1) and Léandro (UJ-2) — inconsistent with the rubric's "named protagonist" preference and the PRD's own pattern. *Fix:* Give UJ-3 a name for consistency; low stakes since the journey itself is still concrete.

## Shape fit — adequate
This is a consumer-facing-internally-tool with meaningful UX (chat + generation UI), so UJs with named protagonists are appropriately load-bearing here, and the PRD doesn't over-formalize with UJ density beyond the three that matter. It also correctly treats this as brownfield: FR-2's "already true today via Supabase CRUD," FR-4's reference to `AdminPage`/`ModulesTab`, and the Glossary's explicit distinction between current static progress values and the target Course Progress concept keep existing-code references accurate and separated from target-state claims. No over- or under-formalization observed.

## Mechanical notes
- Glossary terms are used consistently; no case/plural drift found in a spot-check.
- ID continuity is clean: FR-1 through FR-9 have no gaps or duplicates; UJ-1–3 and SM-1–3/SM-C1 likewise.
- Assumptions Index (§10) round-trips against inline `[ASSUMPTION]` tags with no orphans found in either direction during spot-checking, though a few inline tags (e.g., §2.3 UJ-1's "no auth barrier assumed in v1") are lightly paraphrased rather than quoted verbatim in the index — harmless but worth a pass for exact-phrase consistency if this PRD is machine-parsed downstream.
- UJ-3's protagonist is unnamed (see Downstream usability finding above) — the only naming gap.
- Required sections for this product type (Vision, Target User incl. JTBD/Non-Users/UJs, Glossary, Features/FRs, Non-Goals, MVP Scope, Success Metrics, Constraints, Open Questions, Assumptions Index) are all present.
