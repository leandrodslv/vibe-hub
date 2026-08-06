---
name: Vibe Hub
status: final
sources:
  - {planning_artifacts}/prds/prd-vibe-hub-2026-08-05/prd.md
  - {planning_artifacts}/research/market-formation-ia-designers-ui-ux-research-2026-08-05.md
  - {planning_artifacts}/research/domain-ai-edtech-platforms-for-ui-ux-designers-research-2026-08-05.md
updated: 2026-08-06
---

# Vibe Hub — Experience Spine

## Foundation

Responsive web app. Desktop is the primary, daily-use surface (a workspace tool used between meetings); mobile/tablet must also work for the same core loop, not just read-only. No native app. `DESIGN.md` is the visual identity reference — Bricolage Grotesque display type, the "Franc" functional multicolor palette, pill shapes, bento-card layout; this spine is the behavior underneath it.

Unauthenticated in v1 — no user accounts (PRD §6.2). The only access control is the single shared-credential gate on `/admin` (FR-4). Course Progress (FR-3) is session-local, not per-user, because no stable identity exists yet.

Two top-level zones:
- **Landing** — public, pre-Workspace, no auth barrier.
- **Workspace** — the app shell, three tabs: Modules, IA, Outils. Reached from the Landing page's single primary CTA.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Landing | Direct URL | Hero, program overview (real product screenshots), FAQ, one primary CTA into the Workspace |
| Workspace / Modules | Workspace nav (default tab) | Course catalog grid, session-local progress per course |
| Workspace / IA | Workspace nav | Chat assistant; turns a vague design ask into a copyable generation prompt; hands off to Outils |
| Workspace / Outils | Workspace nav | Tools grid, split into "Disponible" (UI Builder) and "Bientôt disponible" (4 waitlisted tools) |
| Course detail | Click a course card in Modules | Module content; progress updates as the designer moves through it |
| `/admin` | Direct URL, gated | Password screen → course CRUD + waitlist-count dashboard |

→ Composition reference: `mockups/landing.html`, `mockups/modules.html`, `mockups/ia-desktop.html`, `mockups/outils.html`, `mockups/ia-mobile.html`. Spine wins on conflict.

The Workspace nav (Modules/IA/Outils) is a persistent sidebar on desktop, a bottom pill dock on mobile — same three destinations, no tab is desktop-only or mobile-only.

`/admin` is reached only by direct URL — it is never linked from the designer-facing Workspace nav, consistent with it not being part of that surface (PRD Glossary).

## Voice and Tone

Microcopy. Brand voice and aesthetic posture live in `DESIGN.md.Brand & Style`. French-first; bilingual context per DESIGN.md.

| Do | Don't |
|---|---|
| "Bonjour ! Comment puis-je vous aider aujourd'hui ?" | "Salut 👋 Prêt(e) à créer quelque chose d'incroyable ?!" |
| "Je vais te rédiger le prompt parfait à utiliser dans l'UI Generator." | "Voici votre prompt généré automatiquement." (too passive/robotic for a hand-off moment that should feel like a collaborator) |
| "2/5 leçons" | "40% complété ! Continue comme ça 🔥" (no gamified cheerleading — see Anti-patterns) |
| "Sur la liste ✓" | "Merci de votre intérêt, nous vous recontacterons bientôt !" (too formal/corporate for the product's register) |
| "Assistant IA" (disclosure label) | Burying AI disclosure in a settings page or first-run modal that's dismissed and never seen again |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Course card | Modules | Click anywhere opens Course detail. Progress bar reflects real session-local interaction state (FR-3) — never a static/fabricated value. Category color pulled from the course's functional tag, not decorative. |
| Prompt hand-off card | IA tab | Rendered as a distinct card (not a chat bubble) the moment the assistant produces a structured prompt (FR-5). Contains: prompt text, a "Modifier" secondary action (edit in place — see UJ-1 edge case), and a primary "Envoyer au Générateur" pill CTA. Copy interaction: click copies the prompt text to clipboard and the button label swaps to a confirmed state, then reverts after a few seconds. |
| Assistant IA label | IA tab, always | Persistent, non-dismissible chip above the conversation. Not a one-time banner — see EU AI Act requirement in Accessibility Floor. |
| Tool card (Disponible) | Outils | Single live card (UI Builder). Primary action launches the tool inline in the Outils tab — no navigation away (FR-7). |
| Tool card (Bientôt disponible) | Outils | Waitlist-join button. On click: records interest (FR-8), button swaps to a joined state ("Sur la liste ✓") and becomes non-interactive — a designer cannot join twice or join a tool that's already live. |
| Slash command menu | IA tab input | Typing `/` surfaces a list with a one-line description per command (FR-6). Arrow keys navigate, `Enter` inserts, `Esc` dismisses. |
| Project filter | IA tab | Conversations can be assigned to a named project and filtered by it (FR-6) — a lightweight grouping control, not a full workspace-switcher. |
| Admin password gate | `/admin` entry | Single password field. Wrong code: inline styled error state under the field (not a browser `alert()`), field retains focus, no lockout/attempt-count UI in v1. Correct code: session-persisted, no re-entry per click within the session. |
| Waitlist dashboard | `/admin`, separate view from course CRUD | Per-tool count, updated live from Supabase, reachable without querying the table editor directly (FR-9). |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold load | Modules | Skeleton cards (3-4) matching the bento grid, resolve on Supabase fetch. |
| Fetch error | Modules | If the Supabase course fetch fails, show an inline retry state ("Impossible de charger les modules." + "Réessayer" button) in place of the grid — never a silent empty grid, which would be indistinguishable from a genuinely empty catalog. |
| Empty catalog | Modules | Shouldn't occur post-launch (FR-2 blocks rollout on real content) — if it does, show a plain "Aucun module pour le moment" state, not a fabricated placeholder card. |
| Course detail cold load | Course detail | Skeleton matching the content layout while module content resolves; progress bar (FR-3) only starts reflecting real state once content has loaded, never shows a fabricated interim value. |
| First entry, no messages | IA tab | Empty state with the assistant's opening line ("Bonjour ! Comment puis-je vous aider aujourd'hui ?") and the "Assistant IA" label already visible — the disclosure must be present from the very first paint, not only after the first exchange. |
| Mid-conversation, awaiting response | IA tab | Assistant message area shows a lightweight typing/thinking indicator; input stays enabled so the designer can queue a follow-up. |
| Assistant response failed/timed out | IA tab | Inline error bubble in place of the assistant's turn: "La réponse a échoué. Réessayer ?" with a retry action that resends the same user turn — the designer's message is never silently dropped. |
| Prompt hand-off produced | IA tab | Prompt card animates in distinctly from a normal reply — this is the product's signature moment (PRD §1) and should read as a event, not just another chat bubble. |
| Refinement requested | IA tab | If the designer pushes back on a prompt ("ce n'est pas ce que je veux"), the assistant revises the existing prompt card in place rather than starting a new thread (UJ-1 edge case, PRD §2.3). |
| UI Builder generating | Outils | On submit, the prompt area is replaced by a generation-in-progress state (matches the "Generating Component..." pattern already proven in the existing prototype) — this is the core-loop climax (UJ-1 step 5, FR-7) and must never appear to hang with no feedback. |
| UI Builder generation failed | Outils | If the Gemini call errors or times out, show an inline failure state ("La génération a échoué. Réessayer ?") that preserves the submitted prompt so the designer doesn't retype it — silent failure here breaks the product's central promise. |
| Waitlist already joined | Outils | Button shows "Sur la liste ✓", disabled, no further action available for that tool/session. |
| Waitlist join failed | Outils | If the Supabase write fails, the button stays in its default (not-yet-joined) state and a brief inline message ("Réessayer") appears — never silently shows "Sur la liste ✓" without a confirmed write (UJ-3). |
| Tool goes live (was waitlisted) | Outils | Card moves from "Bientôt disponible" to "Disponible" on next load — no manual migration step exposed to the designer. |
| Admin: wrong password | `/admin` | Inline error below the field, using {colors.error}/{colors.on-error}: "Code incorrect." Field clears, retains focus. |
| Admin: session expired | `/admin` | Redirect to the password screen; no destructive action was mid-flight to recover (course CRUD saves are per-action, not batched). |
| Admin: course save succeeded | `/admin` | Inline confirmation on the course form (not a page navigation) — this is UJ-2's climax ("the module appears correctly... no deploy required") and needs visible confirmation, not just a silent Modules-tab update elsewhere. |
| Admin: course save failed | `/admin` | Inline error, using {colors.error}/{colors.on-error}, on the specific field(s) that failed validation or on the form generally for a write failure — the admin's in-progress edits are retained, never discarded. |

## Interaction Primitives

- **Copy-paste hand-off (v1, deliberate):** the IA → UI Builder hand-off is manual copy-paste (FR-7 decision) — the prompt card's "Envoyer au Générateur" button copies text and switches the designer to the Outils/UI Builder context; it does not auto-fill across tabs. Pasted text must work as-is, no reformatting required.
- **Click-anywhere cards:** course cards and live tool cards are single click targets — no separate "open" button competing with the card body.
- **Slash commands:** `/` in the IA input opens the command list; this is the only keyboard-driven affordance specific to Vibe Hub — the product is not keyboard-first like a power-user tool (PRD's audience is designers without a dev-tool background).
- **Waitlist join is one click, no confirmation dialog** — low-stakes, reversible-in-spirit (it's just an interest signal), matches the "reduce friction over gating" pattern from market research.
- **Mobile:** tap targets sized for touch (44px minimum); the bottom dock nav replaces the sidebar 1:1, same three destinations.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` (verify the Franc palette combinations hold AA contrast against `{colors.surface}` and `{colors.on-surface}` before shipping — the palette was chosen for functional/semantic clarity, not pre-verified for contrast).

- **WCAG 2.1 AA** across the responsive web surface — formal bar, not best-effort (per Discovery decision).
- Keyboard navigation: full Tab order through nav, course cards, chat input, slash command list, and all Outils/Admin controls. `Esc` closes the slash command menu.
- Focus rings visible at AA contrast on every interactive element, including inside the dark prompt hand-off card (a known contrast risk given its near-black background).
- Screen reader: the persistent "Assistant IA" label must be announced when a screen reader user enters the IA tab, not just visually present — this is the accessible form of the AI Act disclosure requirement, not decoration.
- The prompt hand-off card's "Modifier"/"Envoyer au Générateur" actions need accessible names beyond icon-only buttons.

**AI transparency (EU AI Act, effective August 2026 — current, not upcoming):** the "Assistant IA" chip is the disclosure mechanism for the IA tab; UI Builder needs the equivalent persistent label since it also generates AI output (PRD §4.3 Feature-specific NFR). This must hold for screen readers and sighted users alike — see above.

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| Desktop (primary) | Persistent left sidebar nav (Modules/IA/Outils). Bento-grid cards, multi-column. |
| Tablet | Sidebar may collapse to icons; grids reflow to 2-column. |
| Mobile | Bottom pill dock nav replaces sidebar (see `mockups/ia-mobile.html`). Single-column stacked cards. Prompt hand-off card and slash command menu both need full mobile-width treatment — this was a mid-session scope addition (session decided v1 must be responsive, not desktop-only) and has only one confirmed mockup (IA tab); Modules and Outils mobile layouts are spine-only for now — extend from the desktop mocks using the same grid-collapse rule (bento → single column) rather than inventing new patterns per surface. |

## Inspiration & Anti-patterns

- **Rejected — gamified streaks/badges/leaderboards for Course Progress:** market research flagged gamification as a strong completion-rate lever (Duolingo-style), but the product owner explicitly chose a plain progress bar to stay consistent with the product's sober, factual register (Discovery decision) — the visual system's playfulness lives in illustration/color, not in progress mechanics.
- **Rejected — generic "AI SaaS template" look:** two early visual explorations were rejected specifically for reading as generic/AI-generated (skewed system fonts, flat decorative blobs) — this is a standing bar for anything added later to the product: it must read as considered, not templated.
- **Rejected — dismissible one-time AI disclosure banner:** the EU AI Act disclosure is a persistent label, not a banner a designer dismisses once and never sees again.
- **Adopted — reduce-friction waitlist over closed-beta gating:** market research pattern; Vibe Hub's waitlist is a single click with immediate confirmed state, no application/approval step.
- **Deferred, not rejected — community/skills feed:** market research names a public peer-visibility "skills" mechanism as a durable differentiator, but it's explicitly out of PRD v1 scope (§9 Q8). Nothing in this spine should be built assuming it exists yet, but IA/data shape decisions shouldn't actively foreclose it either.

## Key Flows

Names mirror PRD §2.3 verbatim.

### UJ-1 — Priya finishes a module and immediately runs the loop

1. Priya, mid-level product designer, has 20 minutes between meetings. She opens the Workspace directly to Modules (no auth barrier).
2. She opens "Introduction à l'IA pour l'UI," works through it — progress bar on the course card fills as she goes, session-local.
3. She switches to the IA tab. The "Assistant IA" label is visible above the chat. She describes a real screen she's stuck on.
4. The assistant replies conversationally, then produces a distinct prompt hand-off card: "Je vais te rédiger le prompt parfait à utiliser dans l'UI Generator," followed by the structured prompt.
5. **Climax:** She clicks "Envoyer au Générateur," lands in Outils on UI Builder with the prompt copied, submits it, and watches real React/Tailwind code render from her own design problem — not a canned demo.
6. **Resolution:** She has a usable component and a reusable prompt pattern. She leaves the tab open.
7. **Edge case:** If the generated code doesn't match what she pictured, she returns to the IA tab; the assistant revises the existing prompt card in place (State Patterns → "Refinement requested") rather than making her restart the module.

### UJ-2 — Léandro publishes a new course module without touching code

1. Léandro navigates directly to `/admin` and enters the shared password (session-persisted afterward).
2. He creates a course record: title, description, time estimate, image.
3. **Climax:** The module appears correctly in Modules immediately — no deploy, no code change (Supabase-backed, FR-4).
4. **Resolution:** The catalog inches toward being fully real content, closing the deployment blocker named in the brief.
5. **Edge case:** If he mistypes the admin password, the inline error state ("Code incorrect.") keeps him on the same screen with the field refocused, not a jarring browser alert.

### UJ-3 — Marco signals demand for a tool that isn't built yet

1. Marco browses Outils, sees Color Studio in "Bientôt disponible."
2. He clicks the waitlist-join button; it swaps immediately to "Sur la liste ✓," no confirmation dialog, no auth required (anonymous per-tool counter, FR-8).
3. **Climax:** Léandro later opens the dedicated waitlist dashboard in `/admin` and sees Color Studio's count climb relative to the other three tools.
4. **Resolution:** Léandro uses the aggregated signal — not any individual designer's identity, since none exists in v1 — to decide what to build next (FR-9), while treating waitlist size itself as a counter-metric, not a goal (PRD SM-C1).
