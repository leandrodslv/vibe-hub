# Spine Pair Review — Vibe Hub

## Overall verdict
The pair is directionally strong — UJ coverage, glossary discipline, and visual-reference linking are clean and both files resolve their sources correctly. It is not yet a clean source-extraction contract: DESIGN.md's Components section doesn't have a matching row for several components EXPERIENCE.md names (Tool card, Slash command menu, Project filter, Admin password gate, Waitlist dashboard, Assistant IA label), State Patterns skip two of the product's highest-stakes moments (UI Builder generation, Gemini/IA errors) plus Course detail and Landing entirely, and DESIGN.md's frontmatter carries ~15 unused Material-3 tokens alongside an unresolved AA-contrast risk on its own "white text on saturated card" component rule.

## 1. Flow coverage — strong
Sources frontmatter → PRD §2.3 UJ-1/2/3, verbatim-named in EXPERIENCE.md Key Flows, each with a named protagonist, numbered steps, an explicit "Climax:" beat, and (UJ-1, UJ-2) an "Edge case:" failure path.
### Findings
- **low** UJ-3 has no failure/edge-case step, unlike UJ-1 and UJ-2 (EXPERIENCE.md Key Flows → UJ-3). This mirrors the PRD, which also omits an edge case for UJ-3, so it's inherited rather than introduced — but "waitlist join fails" (e.g. Supabase write error) is a plausible failure the spine never addresses anywhere, not even in State Patterns. *Fix:* add a one-line failure state for waitlist-join, or note explicitly why none is needed.
- **low** FR-1 (Landing page) is never tagged by FR number or elaborated with a flow/state anywhere in EXPERIENCE.md — it appears only as one IA table row. *Fix:* not necessarily a Key Flow (it isn't a UJ), but at minimum a State Patterns row for Landing would close the gap (see §4).

## 2. Token completeness — adequate
Extracted every color/typography/rounded/spacing token in frontmatter and every `{path.to.token}` reference in prose (DESIGN.md). All referenced tokens resolve; no color token is missing a hex value.
### Findings
- **high** The DESIGN.md `colors` frontmatter carries ~15 Material Design 3 tokens (`inverse-surface`, `inverse-on-surface`, `primary-fixed*`, `secondary-fixed*`, `tertiary-fixed*`, `surface-tint`, `inverse-primary`, `outline`, `outline-variant`, `background`, `on-background`, `surface-variant`) that are never referenced by `{path}` anywhere in either file — inherited unpruned from the Stitch/M3 export. A downstream consumer can't tell which are load-bearing. *Fix:* prune unused tokens or fold them under a clearly-marked "inherited/unused" note.
- **high** No contrast ratios are stated for load-bearing combinations, and DESIGN.md's own Components spec creates one that's likely to fail: "Chips & Badges: High-saturation backgrounds with white text" against `franc-blue` (#00d1ff) or `franc-coral` (#ff7a59) — both are light/bright enough that white text plausibly fails WCAG AA 4.5:1. EXPERIENCE.md's Accessibility Floor defers this ("verify... before shipping") rather than resolving it, and neither file gives a fallback (e.g., dark text on light franc colors). *Fix:* compute contrast per franc-color × text-color pairing now and either fix the palette-component pairing or document per-color text-color rules.

## 3. Component coverage — thin
Extracted every component named in DESIGN.md.Components and EXPERIENCE.md.Component Patterns and cross-matched.
### Findings
- **high** "Tool card (Disponible)" and "Tool card (Bientôt disponible)" (EXPERIENCE.md Component Patterns) have no DESIGN.md row — only the generic "Cards (Bento Style)" entry plus a Colors-section mention of category tinting. No visual spec exists for the waitlist-button visual states, live-vs-waitlisted card distinction, or CTA placement. *Fix:* add a Tool card row to DESIGN.md.Components.
- **medium** "Waitlist dashboard" (`/admin`) has no DESIGN.md row at all — a full admin data view with no layout/typography/table spec. *Fix:* add a row, even a minimal one referencing existing table/list conventions.
- **medium** "Slash command menu" and "Admin password gate" (EXPERIENCE.md) have no DESIGN.md rows — no visual spec for menu positioning/item styling/keyboard-highlight state, or for the password screen's layout beyond the generic Input Fields entry. *Fix:* add rows or explicitly fold into an existing generic component with a note.
- **low** "Project filter" and "Assistant IA label" lack dedicated DESIGN.md rows; the label is only described inline inside the AI Prompt Hand-off Card entry ("a persistent 'Assistant IA' label chip") without its own color/size spec, despite being the EU AI Act disclosure mechanism — a load-bearing compliance element. *Fix:* give the Assistant IA label its own row given its compliance weight.
- **low** DESIGN.md's "Chips & Badges" (generic, e.g. "Nouveau"/"Bêta" tags) has no EXPERIENCE.md behavioral counterpart (when they appear/dismiss). Minor since these are decorative, not flow-critical.

## 4. State coverage — thin
Walked each IA surface (Landing, Modules, IA, Outils, Course detail, `/admin`) against EXPERIENCE.md's State Patterns table.
### Findings
- **critical** Outils/UI Builder has no loading or error state for code generation — the product's core-loop climax (UJ-1 step 5, FR-7) has zero defined behavior for "generating..." or "Gemini call failed/timed out," despite PRD §8 flagging Gemini as metered and rate-limit-relevant. *Fix:* add generation-in-progress and generation-failed rows to State Patterns.
- **high** IA tab has no error state for a failed/timed-out assistant response (Gemini failure) and no defined empty/cold state for first entry into the tab. Only "mid-conversation, awaiting response," "prompt hand-off produced," and "refinement requested" are covered. *Fix:* add both.
- **medium** Course detail (a named IA surface) has zero State Patterns coverage — no cold-load, no progress-update feedback, despite being where FR-3 progress actually updates. *Fix:* add at least a cold-load row.
- **medium** `/admin` course CRUD (create/edit/delete) has no success/error/validation states — only the password-gate states are covered, yet UJ-2's whole climax is "the module appears correctly" after a save. *Fix:* add a save-success/save-error row.
- **low** Landing has no state coverage at all (no loading state for the real-screenshot program overview, no FAQ interaction state). Likely low-stakes if static, but worth an explicit line saying so rather than silence.
- **low** Modules has no defined error state for a failed Supabase fetch (only cold-load and empty-catalog are covered).

## 5. Visual reference coverage — strong
All 10 files in `mockups/` (5 HTML + 5 PNG: landing, modules, ia-desktop, outils, ia-mobile) are referenced from DESIGN.md (Brand & Style, Layout & Spacing, Components, Visual References) and/or EXPERIENCE.md (IA composition reference, Responsive & Platform). No orphans. "Spine wins on conflict" is stated once, in EXPERIENCE.md's IA section. `imports/` is empty; no wireframes folder exists.
### Findings
- **low** DESIGN.md's Visual References section restates the same 5 links already scattered inline elsewhere in the file (Brand & Style, Layout & Spacing, Cards, Navigation) — mild redundancy, not a coverage gap (see Bloat section).

## Mechanical notes
- **Component name consistency**: names aren't identical across files — EXPERIENCE.md's "Course card" maps only loosely to DESIGN.md's generic "Cards (Bento Style)"; several EXPERIENCE component names (Tool card, Slash command menu, Admin password gate, Waitlist dashboard) have no DESIGN.md counterpart name at all (see §3).
- **Glossary consistency**: PRD §3 terms (Workspace, Modules/IA/Outils tab, Course, Admin surface, Waitlist tool, Prompt hand-off, Course Progress) are used identically in EXPERIENCE.md; no drift found. DESIGN.md's French UI terms ("Disponible"/"Bientôt disponible") match EXPERIENCE.md and PRD.
- **Cross-refs**: All `{path.to.token}` references in DESIGN.md resolve to defined frontmatter keys — none dangling. EXPERIENCE.md correctly points to `DESIGN.md.<Section>` by name rather than using token syntax, per spec convention.
- **Raw pixel values bypassing tokens**: DESIGN.md.Components repeatedly states raw px values that duplicate existing scale entries instead of referencing them — e.g. "Rounded-lg (16px)" for Input Fields duplicates `{rounded.lg}` (1rem = 16px) without using the token; "32px"/"24px" padding values in Buttons/Cards aren't tied to `{spacing.base}` multiples via `{spacing.*}` refs. Undermines the frontmatter's single-source-of-truth purpose. Bloat/overspecification finding, medium severity.
- **Section order**: DESIGN.md follows the canonical order exactly (Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → [Visual References, an added section after Do's and Don'ts' slot — Do's and Don'ts itself is omitted]). The omission of a formal "Do's and Don'ts" section is defensible since equivalent hard rules are folded into Elevation/Shapes prose ("Avoid semi-transparent layers or blurs..."), but a consumer scanning for that exact section name won't find it.
- **EXPERIENCE.md shape fit**: all required-default sections present (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows), plus required-when-applicable Responsive & Platform (multi-surface, triggered) and Inspiration & Anti-patterns (triggered by memlog's rejected-direction history and market-research rejects). No invented sections beyond what's justified.
- **No Mermaid diagrams present in either file** — n/a for this pair.
