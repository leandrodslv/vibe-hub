---
baseline_commit: c4667434a2c5ec3da8d36baec5460ec9c40f0ef3
---

# Story 1.1: View Landing Page Content

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want to see the hero, program overview, and FAQ sections on the Landing Page,
So that I understand what Vibe Hub is before entering the Workspace.

## Acceptance Criteria

1. **Given** I navigate to the Landing Page **When** the page loads **Then** I see a hero section, a program/course overview section, and an FAQ section, without any authentication prompt. [Source: epics.md#Story 1.1]
2. **Given** the program overview and hero sections are rendering **When** I view them **Then** they display real screenshots of the actual product (Modules/IA/Outils tabs, UI Builder output) — not stock or placeholder imagery. [Source: epics.md#Story 1.1, prd.md#FR-1 line 90]
3. **Given** the Landing Page is internal-only in v1 **When** I read the hero and overview copy **Then** it is framed as "here's the tool your team just got" (internal rollout communication), not external lead-generation copy, and does not present fabricated testimonials as social proof. [Source: epics.md#Story 1.1, prd.md#§4.1 line 79, prd.md#FR-1 line 90]
4. **Given** the page is styled **When** I view it on desktop, tablet, and mobile **Then** it follows the Franc design system (Bricolage Grotesque display type, Hanken Grotesk body, franc color palette, pill shapes, bento layout per UX-DR1) and the responsive grid rules (12-col desktop / 4-col mobile per UX-DR4). [Source: epics.md#Story 1.1, DESIGN.md]
5. **Given** I navigate the page using only a keyboard or a screen reader **When** I move through the hero, overview, and FAQ sections **Then** all interactive elements are reachable via Tab order and meet WCAG 2.1 AA contrast/focus requirements (UX-DR14). [Source: epics.md#Story 1.1]

Out of scope for this story (belongs to Story 1.2): reducing the Landing Page to a single primary CTA into the Workspace. Leave existing multiple CTA entry points (Navbar, Hero, Programme cards) functionally as-is; only their copy/visual treatment changes here.

## Tasks / Subtasks

- [x] Task 1: Wire the Franc design system into the build (AC: #4)
  - [x] In `tailwind.config.js`, add to `theme.extend`: `colors` (all `franc-*` tokens plus `surface*`, `on-surface*`, `primary*`, `secondary*`, `tertiary*`, `error*` from DESIGN.md front-matter — copy values verbatim, do not invent hex codes), `fontFamily` (`display-xl`/`display-lg`/`headline-lg`/`headline-lg-mobile` → Bricolage Grotesque; `body-lg`/`body-md`/`cta-pill` → Hanken Grotesk; `label-caps` → JetBrains Mono), `fontSize` (with the paired `lineHeight`/`fontWeight`/`letterSpacing` objects, mirroring `mockups/landing.html`'s `tailwind.config` block), `borderRadius` (`sm`/`DEFAULT`/`md`/`lg`/`xl`/`full`), and `spacing` (`base`/`container-margin`/`stack-gap`/`section-padding`/`grid-gutter`).
  - [x] In `src/index.css`, replace the Inter Google Fonts `@import` with Bricolage Grotesque + Hanken Grotesk + JetBrains Mono (see `mockups/landing.html` line 11 for the exact family/weight query string), and update the `body` font-family rule off `'Inter'`.
  - [x] Do not touch `src/components/workspace/**` or `src/pages/WorkspacePage.jsx` — Workspace re-skinning is out of scope for this story; only Landing Page components consume the new tokens here.

- [x] Task 2: Replace fabricated social proof with credible internal-rollout framing (AC: #3)
  - [x] Rewrite `src/components/landing/SocialProof.jsx`: remove the four fake company logos (ACME Corp, Globex, Hooli, Initech) — the PRD explicitly rules out testimonial-style social proof pre-rollout (`prd.md` line 90, `[NOTE FOR PM]`). Replace with a credible statement of what the tool does today / what's coming (e.g. a short capability strip), not fabricated adopters or metrics.
  - [x] Re-theme the section with Franc tokens (Task 1) instead of the current grayscale/monochrome treatment.

- [x] Task 3: Remove the fabricated dashboard mockup in Hero; real screenshot still outstanding (AC: #2 — PARTIALLY SATISFIED, see note)
  - [ ] ~~Run the app locally (`npm run dev`) and capture a real screenshot~~ — **HALTED, not performed.** No browser-automation/screenshot tooling was available in this dev environment to launch the app and capture a real image. Flagged to {user_name}; resolution chosen: ship an honest labeled placeholder now rather than block the story indefinitely, with the real capture as explicit follow-up work before rollout.
  - [x] Replaced `Hero.jsx`'s fabricated fake-browser-chrome mockup (fake window dots, fake sidebar, fake "Generating Component..." panel — none of it a real capture) with a clearly-labeled placeholder ("Aperçu produit — capture à intégrer") that does not claim to be real product UI. This removes the deceptive mockup even though it does not yet add the real screenshot AC2 calls for.
  - [x] `Programme.jsx`'s module cards use only icon+text with no imagery — already compliant with AC2 (no fabricated screenshot present); left as-is.
  - [ ] **OPEN ITEM — before rollout:** swap the Hero placeholder block for an `<img>` of a real captured screenshot of the Workspace (Modules/IA/Outils tabs or UI Builder output). Requires either manual capture by a human with a running dev server, or a browser-automation tool not currently available to this dev agent.

- [x] Task 4: Restyle Hero, Navbar, Programme, FAQ, Footer with the Franc design system (AC: #4)
  - [x] `Hero.jsx`: display headline → `font-display-xl`/`display-lg` (Bricolage Grotesque, per DESIGN.md Typography), CTA button → pill-shaped (`rounded-full`, matching DESIGN.md "Buttons & CTAs" spec: near-black bg / white text, 32px horizontal padding), replace ad hoc `#666666`/`#EAEAEA` hex literals with the new `on-surface-variant`/`surface-container` tokens.
  - [x] `Navbar.jsx`: CTA button → pill-shaped (`rounded-full`) per the same Buttons spec (currently `rounded-lg`).
  - [x] `Programme.jsx`: recompose the 3-card grid as bento-style cards per DESIGN.md "Cards (Bento Style)" (rounded-xl, category-color tint, `headline-lg` titles) instead of the current plain white/border cards; align to the 12-column desktop / 4-column mobile grid per UX-DR4 rather than the current ad hoc `md:grid-cols-3`.
  - [x] `FAQ.jsx`, `Footer.jsx`: swap headline/body fonts to the Franc typography tokens; do not touch the `FAQS` import from `src/data/courses.js` — that export is unrelated to the `COURSES` placeholder data Epic 2 retires and must keep working after this story.
  - [x] `APropos.jsx`: font/token restyle only — its stock Unsplash portrait and "Julien D." instructor bio are NOT covered by AC2 (which only binds hero + program-overview sections) and are out of scope for this story; do not change the photo or copy content, only apply Franc typography/color tokens for visual consistency.

- [x] Task 5: Rewrite copy for internal-rollout tone (AC: #3)
  - [x] Updated Hero's CTA label ("Découvrir Vibe Hub") and supporting copy ("Vibe Hub est en ligne : formez-vous et générez vos interfaces avec les outils IA déjà à votre disposition"), and Navbar's CTA label ("Ouvrir Vibe Hub"), away from external-beta-signup framing toward internal-rollout framing. Kept French throughout.
  - [x] No fabricated testimonials, adopter counts, or metrics present anywhere on the page (verified SocialProof rewrite from Task 2 and no other section introduces any).

- [x] Task 6: Verify keyboard/screen-reader accessibility (AC: #5)
  - [x] Added explicit `focus-visible:ring-2 focus-visible:ring-primary` (AA-contrast violet ring, 6.70:1 against `surface`) to every interactive element across Navbar (links + CTA), Hero (CTA), Programme (Découvrir buttons), FAQ (accordion triggers), and Footer (links + social icons) — Tailwind's browser-default outline was not guaranteed AA-compliant against the new Franc backgrounds. Tab order follows existing DOM/visual order in all five components; no `tabIndex` overrides were introduced.
  - [x] Added `aria-expanded={isOpen}` and `aria-controls`/matching `id` to FAQ accordion trigger buttons and their answer panels.

- [x] Task 7: Manual verification
  - [~] Could not run `npm run dev` and visually verify in an actual browser — no browser tooling available in this dev environment (same limitation as Task 3). Verified via other gates instead: `npm run build` (Vite production build) succeeds with 0 errors across all 1814 modules; confirmed the new Franc Tailwind tokens (`franc-violet`, `display-xl`, `font-cta-pill`, etc.) are actually emitted in the built CSS, ruling out silent class-name typos; read back every edited file for correct token usage (no leftover hex literals in touched files except `APropos.jsx`'s intentionally-unchanged photo/copy). The project has no ESLint config file (pre-existing repo gap, unrelated to this story), so `npm run lint` fails at the config-resolution step — not something this story introduced or is in scope to fix. **Recommend a human visual pass in the browser before merge** given the no-browser-tooling gap.

## Dev Notes

- **Scope boundary:** This story is presentation-only (`src/components/landing/*`, `src/pages/LandingPage.jsx`, `tailwind.config.js`, `src/index.css`). No `services/`, Supabase, or routing changes belong here — Story 1.2 owns the single-CTA-into-Workspace behavior; Epic 2 owns retiring `src/data/courses.js`'s `COURSES` array.
- **All six Landing Page components already exist** (`Navbar.jsx`, `Hero.jsx`, `SocialProof.jsx`, `Programme.jsx`, `APropos.jsx`, `FAQ.jsx`, `Footer.jsx`, composed in `LandingPage.jsx`) — this is a **restyle + content-fix** of existing files, not new-component creation. Read each file before editing; do not rewrite from scratch.
- **Current state is monochrome** (`#F9F9F9`/`#000000`/`#666666`/`#EAEAEA` hex literals throughout, `Inter` font via `src/index.css`) — this entire visual register is being superseded by the Franc palette per DESIGN.md line 108 ("supersedes the prototype's earlier strict monochrome register"). Every hardcoded gray/black hex in the six components should migrate to the new Tailwind color tokens from Task 1, not stay as inline hex.
- **Text-on-franc-color contrast rule (critical, will fail AA if ignored):** text on a solid franc-color fill must be `on-surface` (near-black), never white — except a solid-violet CTA needing white text, which must use `{colors.primary}` (`#5b3cdd`) instead of `{colors.franc-violet}` (`#7b61ff`, which fails AA with either white or near-black body text). `franc-violet` itself is accents/icons/borders only. [Source: DESIGN.md line 122]
- **Buttons are pill-shaped, not `rounded-lg`:** DESIGN.md's Shapes section fixes `rounded.full` for all buttons/chips — both `Hero.jsx` and `Navbar.jsx` currently use `rounded-lg` for their CTAs; this must change.
- **Known content-authenticity gap requiring active fix, not just restyle:** `SocialProof.jsx` currently renders four fabricated fake-company logos (ACME Corp, Globex, Hooli, Initech) as if they were real customers. The PRD is explicit this is disallowed pre-rollout (`prd.md` line 90: "'Social proof' in the testimonial sense is not achievable before a first-ever rollout with no prior users — substitute credible framing instead"). This is a required content change (Task 2), not optional polish.
- **Known content-authenticity gap requiring active fix:** `Hero.jsx`'s "Floating Dashboard Mockup" (lines 25-81) is a fully hand-drawn fake browser window with placeholder gray boxes — it is not a real product screenshot. FR-1 explicitly requires real screenshots of the actual product for the hero section (`prd.md` line 90). This must be replaced with a genuine captured screenshot (Task 3), not left as illustrative UI chrome.
- **Copy tone gap:** current CTA copy ("Rejoindre la Beta" / "Accès Beta") reads as external beta-signup / lead-gen language. PRD §4.1 (line 79) frames the Landing Page audience as internal team members being introduced to an already-built tool ("here's the tool your team just got"), explicitly not lead-generation copy. Update copy accordingly (Task 5) while keeping the CTA functionally wired to `onEnterApp`/`onEnterModules` (unchanged from `App.jsx`'s existing prop wiring).
- **`FAQS` data dependency:** `FAQ.jsx` imports `FAQS` from `src/data/courses.js` alongside the `COURSES` array that Epic 2 retires. `FAQS` is a separate export and is not in scope for removal — do not delete or restructure `src/data/courses.js` in this story; only Epic 2 touches that file's `COURSES` data source status.
- **`APropos.jsx` is explicitly out of AC2's scope** (which binds only hero + "program overview" sections) — leave its Unsplash portrait and instructor bio content untouched; apply only typography/color token updates for visual consistency with the rest of the page.
- **Reference mockup exists:** `_bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/mockups/landing.html` (and matching `landing.png`) is a Stitch-generated reference implementation of this exact page using the target Tailwind config — use it as the source of truth for exact token values (see its inline `tailwind.config` script block) and general layout intent, but do not copy its Material Symbols icon font or its specific copy verbatim; adapt to the existing component structure and `lucide-react` icons already in use.
- **No routing exists yet:** Landing/Workspace toggle via `App.jsx`'s local `view` state (`'landing' | 'app'`), not React Router (`prd.md` line 213 flags this as a known future gap, out of scope here).

### Project Structure Notes

- Files touched: `tailwind.config.js`, `src/index.css`, `src/components/landing/{Navbar,Hero,SocialProof,Programme,APropos,FAQ,Footer}.jsx`. No new files/folders required by the architecture's Structural Seed (`components/landing/` already exists and holds exactly these files).
- No `services/` involvement — this story has no external-system calls, consistent with the Capability → Architecture Map entry for FR-1 ("Paradigm: Presentation only, no adapter needs").
- No conflicts detected between this story's file set and the unified project structure in `ARCHITECTURE-SPINE.md`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1 (lines 127-153)]
- [Source: _bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md#§4.1 Landing Page, line 79]
- [Source: _bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md#FR-1, lines 83-93]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md#Capability → Architecture Map, FR-1 row]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/DESIGN.md — front-matter tokens, Colors, Typography, Shapes, Components/Buttons & CTAs, Cards (Bento Style)]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/mockups/landing.html — reference Tailwind config and layout]

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

- `npm run lint` fails project-wide at config resolution ("ESLint couldn't find a configuration file") — pre-existing repo gap (no `.eslintrc*` anywhere in the repo), not introduced by this story. Not fixed here as it's outside this story's scope (presentation-only Landing Page restyle).
- `npm run build` (Vite) — succeeded, 1814 modules transformed, 0 errors. Used as the primary automated verification gate in place of a test suite, since the project has no test framework (no Jest/Vitest/RTL in `package.json`) and no working lint config.
- No browser-automation/screenshot tool was available in this environment, which blocked two things: (1) capturing a real product screenshot for the Hero section (AC2), (2) an actual in-browser manual QA pass (Task 7). Both are flagged as open items below.

### Completion Notes List

**Revision 23 (copy tweak):** swapped in a plain hyphen instead of the em-dash: "Modules, Assistant IA, UI Builder - accessibles dès aujourd'hui, sans compte à créer."


**Revision 22 (copy tweak):** removed the em-dash in the Footer subtext, now "Modules, Assistant IA, UI Builder accessibles dès aujourd'hui, sans compte à créer."


**Revision 21 (140 icons):** the user asked for many more icons again. Raised `ICON_COUNT` 70→140 and added 5 more product-relevant icons (`Feather`, `Compass`, `Blocks`, `Grid2x2`, `ScanLine`) to the rotation, now 24 distinct icons total. The phyllotaxis placement formula and the bounded gravity/bounce physics from the previous two revisions both scale automatically with count (no other code changes needed) — the per-frame cost stays O(n) simple arithmetic per icon with no layout-forcing calls, so this should still perform reasonably, but **has not been visually/performance-verified in an actual browser** (same recurring tooling gap noted throughout this story); worth an in-browser frame-rate check at this density before merge.


**Revision 20 (softer physics):** the user asked for a less intense effect. Reduced all force constants: `GRAVITY` 0.28→0.1, `DAMPING` 0.985→0.96 (more friction, settles faster), `RESTITUTION` 0.42→0.25 (softer bounce), `REPEL_RADIUS` 140→90px (cursor has to be closer to affect an icon), repel push formula `(3 + speed*0.5)`→`(1 + speed*0.22)`, and mouse-speed cap 60→35 (caps how much a fast shake can amplify the push). Net effect: icons drift and settle calmly, with a noticeably gentler reaction to the cursor.


**Revision 19 (bounded gravity/bounce physics):** the user reported icons crossing above the footer's top edge into the section before it (screenshot showed icons poking above the boundary line), and asked for a "sand" or "plastic ball" feel instead of free-floating confetti. Root cause: the previous spring-back-to-origin model had no hard boundary — a fast cursor flick near the top row of icons could impart enough velocity to carry them past the footer's visual top edge before the spring pulled them back, and `overflow-hidden` on the footer clips rendering but the brief overshoot was still visible mid-motion. Replaced the spring model with a bounded gravity simulation: each icon now has real gravity (`GRAVITY = 0.28`), falls and settles, gets scattered by cursor proximity/speed same as before, and **bounces off the footer's own measured bounding box** (`RESTITUTION = 0.42`) on all four edges — it is now physically impossible for an icon's simulated position to exceed the footer's top/bottom/left/right boundary, not just visually clipped. The footer element itself is now measured via a `footerRef` passed into `ConfettiIconField` as `containerRef` (previously only icon positions were measured, not the container's walls).


**Revision 18 (scale to 70 icons):** the user asked for 50-100 icons. Set `ICON_COUNT = 70` (mid-range of the requested band). Two changes were needed beyond just raising a count: (1) switched the layout formula from a fixed-ring golden-angle placement to a phyllotaxis/sunflower-seed spiral (`radius = minRadius + scale * sqrt(i)`) — the fixed-ring version would have clustered badly at 70 items, the sunflower spiral is the standard approach for evenly filling a field at arbitrary density; (2) **performance fix**: the physics loop previously called `getBoundingClientRect()` on every icon every animation frame, which forces a synchronous layout — fine for ~11-19 nodes, but would have caused visible jank at 70. Changed to measure each icon's rest position once on mount (and on window resize) and do the per-frame math against that cached base position instead. The 19 icon components still cycle (each icon repeats ~3-4 times across 70 slots) with varying size/color per slot — reasonable for a confetti field where repetition reads as texture, not a defect. Chip sizes also reweighted smaller on average so a 70-icon field doesn't look like 70 large buttons.


**Revision 17 (confetti physics + many more icons):** the user wanted real confetti-like physics — icons that get pushed around by cursor proximity and "shaken" by fast mouse movement, not just a single hop — plus many more icons. Replaced `DodgeIcon` with `ConfettiIconField`: a single `requestAnimationFrame` loop (not one per icon) tracks global pointer position + velocity via a `pointermove` listener, and for each icon computes a repel force from cursor proximity (stronger the faster the cursor is moving — the "shake" effect) plus a spring-back-to-rest force and friction/damping, writing `transform: translate(...) rotate(...)` directly to each DOM node via refs (bypassing React state/re-renders for smooth motion with ~19 simultaneous nodes). Icon count expanded from 11 to 19 (`Bot, Paintbrush, MousePointer2, Sparkles, Wand2, LayoutGrid, MessageSquare, Code2, Lightbulb, Palette, Rocket, Cpu, Braces, Layers, PenTool, Zap, Boxes, Star, FileCode` — all product/design/code-relevant), positioned on a golden-angle ring around the headline (even scatter without manual per-icon placement) rather than hand-placed. Skips the physics loop entirely when `prefers-reduced-motion: reduce` is set, and icons are `pointer-events-none` so the moving field never blocks clicks on the CTA buttons or legal links beneath it. **Not visually verified in a browser** (same tooling gap as elsewhere in this story) — the physics constants (repel radius 140px, spring/friction coefficients) are reasoned estimates, not tuned against a live render; recommend an in-browser check before merge.


**Revision 16 (hover instead of drag):** the user clarified they don't want to click-and-hold — just passing the cursor over an icon should trigger movement. Replaced `DraggableIcon` (pointer-capture drag) with `DodgeIcon`: on `onPointerEnter`, it hops to a random point 28–68px away in a random direction, with a 300ms ease-out transition, no click/hold required. Simplified from a `<button>` with pointer-capture drag state to a plain `<span>` with a single `onPointerEnter` handler.


**Revision 15 (more footer icons):** the user asked for many more draggable icons. Expanded from 3 to 11, driven by a `FOOTER_ICONS` config array (icon, position, chip color, size) mapped to `DraggableIcon` instances, varying size (`w-9`/`w-11`/`w-14` chips) and franc-color rotation for visual rhythm. Added `Sparkles`, `Wand2`, `LayoutGrid`, `MessageSquare`, `Code2`, `Lightbulb`, `Palette`, `Rocket` alongside the original `Bot`/`Paintbrush`/`MousePointer2` — all product-relevant (Assistant IA, UI Builder, Modules, prompts, code export), not generic filler icons. Positioned to stay clear of the central headline/CTA column.


**Revision 14 (Footer icon interaction):** the user asked to replace the 3 decorative dots with icons relevant to the product (robot/brush/cursor) that can be dragged around with the cursor. Added a local `DraggableIcon` component in `Footer.jsx` using pointer events (`onPointerDown`/`onPointerMove`/`onPointerUp` + `setPointerCapture`) to let each icon be picked up and repositioned within the footer, with a small scale-up while dragging and a smooth scale-back transition on release. Icons: `Bot` (Assistant IA), `Paintbrush` (design/creative), `MousePointer2` (the "click-anywhere" interaction pattern used elsewhere in the app), each in a colored circular chip using the existing Franc tokens. Kept them `aria-hidden`/non-focusable and hidden on mobile (`hidden md:flex`) — same treatment as the Navbar's decorative icons — since this is a pure delight easter-egg with no functional purpose, not an accessibility-relevant control.


**Revision 13 (Footer redesign):** at the user's request, explored 3 footer directions inspired by external reference screenshots via a published Artifact preview (dot-grid/playful, wordmark+mascot, oversized-background-wordmark), reusing the existing Franc tokens. User picked the oversized-wordmark direction. Rebuilt `Footer.jsx` on that concept, refined per this agent's own stated caveat (footers should stay quiet, so the giant "VIBE HUB" watermark is heavily blurred at 10% opacity rather than a loud confetti field) and reusing the same pill-button CTA pattern already established in Hero/Navbar rather than inventing a new one. **Accessibility correction applied during implementation:** used `bg-primary` (`#5b3cdd`) for the solid full-bleed background with white text, not `bg-franc-violet` (`#7b61ff`) — per DESIGN.md's documented contrast rule, `franc-violet` fails AA with white body text; `primary` is the darker violet reserved for exactly this case. `Footer.jsx` now takes an `onEnterApp` prop (wired from `LandingPage.jsx`) for its primary CTA.


**Revision 12 (content tweak):** the user asked to replace "Modules" and "Liste d'attente" in `SocialProof.jsx`'s capability strip with wording more focused on AI training/learning. Updated to `['Formation IA', 'Assistant IA', 'UI Builder', 'Apprentissage continu']`.


**Revision 11 (post-review correction #10):** the user asked for the exact same icons as Stitch, rather than continued lucide-react approximation. Switched approach: added the Material Symbols Outlined variable font (Google Fonts, same family/axes as `mockups/landing.html`) via a `<link>` in `index.html`, plus a `.material-symbols-outlined` base class in `src/index.css`. Replaced the Navbar's `Bell`/`Cog` lucide icons with `<span className="material-symbols-outlined">notifications</span>` / `settings` ligature glyphs at `FILL:1`, matching the mockup exactly (same font, same glyph names, same fill variant) instead of approximating with a different icon set. This is the only place in the app using Material Symbols — everything else continues to use lucide-react as before; scoped narrowly to these two decorative, non-functional icons for mockup fidelity.


**Revision 10 (post-review correction #9):** the user flagged the Cog icon rendered as a broken spiky/star shape instead of a gear. Root cause: `fill="currentColor"` (added in revision 7 to fake the mockup's Material Symbols "filled" look) breaks on lucide icons — they're built as open stroke paths (separate line segments for each tooth/spoke), not closed fillable shapes, so forcing a fill renders overlapping filled slivers instead of a solid gear silhouette. Reverted `Bell`/`Cog` to plain stroke rendering (`strokeWidth={2}`, no `fill`) — a clean, correctly-rendered outline icon is a better fidelity trade-off than a broken attempt at matching the mockup's filled style.


**Revision 9 (post-review correction #8):** the user flagged the "Accueil" active-state underline was rendering as a rounded pill instead of a straight line. Root cause: the `rounded` utility class (added for the focus-visible ring's corners) was also rounding the visible `border-b-4` bottom border on the same element. Removed `rounded` from that link — the focus ring now falls back to a square corner, which is fine for a text link (no visible border-radius mismatch), and the active-state underline renders as a straight rectangle as intended.


**Revision 8 (post-review correction #7):** the user asked to "fix the buttons" while showing the mockup's Bell/Cog icons, plus separately provided the mockup's exact nav-link treatment (bold, primary-colored, underlined "Accueil" + "Modules" + "Outils"), overriding this agent's earlier deliberate deviation (keeping "Programme"/"FAQ" anchors to avoid extra Workspace entry points per Story 1.2). Fixed the Settings icon: swapped lucide's `Settings` (organic/scalloped shape) for `Cog` (mechanical trapezoidal-tooth gear), matching the mockup's Material Symbols glyph more closely. Replaced the Navbar links with "Accueil" (active state: bold, `text-primary`, `border-b-4 border-primary`), "Modules", "Outils" per the mockup — but kept them as same-page anchor links (`#top`, `#modules-showcase`, `#outils-showcase`) rather than direct Workspace-tab entry points, preserving the Story 1.2 single-CTA principle while matching the mockup's visual/label treatment exactly. Added matching `id`s + `scroll-mt-24` (to clear the sticky nav) to the Modules and UI Builder bento cards in `Programme.jsx`, and `id="top"` to `LandingPage.jsx`'s root element. This also drops the FAQ nav link, matching the mockup (which has no FAQ nav entry despite having an FAQ section on the page).


**Revision 7 (post-review correction #6):** the user flagged the Navbar's Bell/Settings icons didn't match the mockup. Root cause: `mockups/landing.html` uses Material Symbols with `data-weight="fill"` / `font-variation-settings: 'FILL' 1` — i.e. **solid/filled** icon glyphs — while the lucide-react `Bell`/`Settings` icons were rendering in their default **outline/stroke** style. Added `fill="currentColor"` with a thinner `strokeWidth={1}` to approximate the mockup's filled-icon look within the lucide icon set already used consistently across the rest of the app (didn't introduce Material Symbols as a second icon system/font dependency).


**Revision 6 (post-review correction #5):** the user flagged that buttons didn't match the mockup. Found two buttons in `Programme.jsx` that were invented and don't exist in `mockups/landing.html` at all: the "Modules" bento card has no CTA (just a decorative list item), and the "UI Builder" bento card has no CTA (just descriptive text + mock UI visual) — I had added "Voir les modules" and "Découvrir Outils" buttons to both. Removed both, matching the mockup exactly (only the "Assistant IA" card has a button — "Découvrir l'IA" — which was already correct). Removed the now-unused `onEnterModules` prop from `Programme.jsx`'s signature and from `LandingPage.jsx`'s pass-through accordingly.


**Revision 5 (post-review correction #4):** the user flagged the `Navbar.jsx` logo was rendering smaller than the mockup. Root cause: it used `text-2xl` (24px, an arbitrary Tailwind default) instead of the `text-display-lg` token (48px, per `tailwind.config.js`'s `fontSize` scale added in Task 1) that `mockups/landing.html` actually specifies for the TopAppBar logo. Fixed to `text-display-lg`.


**Revision 4 (post-review correction #3):** the user flagged that `Navbar.jsx` was still missing the mockup's notification-bell and settings icon buttons (`mockups/landing.html`'s TopAppBar has them between the nav links and the CTA). Added both as `Bell`/`Settings` lucide icons in circular `bg-surface-container` buttons, matching the mockup visually. Marked them `aria-hidden`/`tabIndex={-1}` since they are non-functional — there is no notification system or settings surface on the unauthenticated public Landing Page (no auth in v1 per FR-1) — so they would otherwise be dead, confusing tab stops for keyboard/screen-reader users (AC5). **Deliberately did NOT** switch the nav *links* to the mockup's "Accueil/Modules/Outils" (which route directly into specific Workspace tabs): that would create additional direct entry points into the Workspace beyond the single primary CTA, conflicting with Story 1.2's "no competing or duplicate primary CTAs" requirement. Kept the existing "Programme"/"FAQ" same-page anchor links instead. Flagged this distinction explicitly to the user in case that reasoning is wrong and full nav-link fidelity is actually wanted.


**Revision 3 (post-review correction #2):** the user pointed out that the Hero/Programme "Assistant IA" decorative illustrations from the mockup were dropped and replaced with a bare `Sparkles` icon placeholder. On reflection, that was an over-application of FR-1/AC2's "no fabricated screenshots or stock imagery" rule: these are the design system's own commissioned brand illustrations (Stitch-generated, referenced directly in the approved `mockups/landing.html`), not stock photos of unrelated people/companies and not fake screenshots posing as real app UI — a different category from what AC2 is actually guarding against. Downloaded both source images (`lh3.googleusercontent.com/aida-public/...` URLs embedded in `mockups/landing.html`, still resolving as of this session) to `src/assets/landing/hero-collage.jpg` and `src/assets/landing/assistant-ia.jpg`, and wired them into `Hero.jsx` (main visual) and `Programme.jsx` (Assistant IA card's decorative graphic) respectively, matching the mockup. **AC2's real-product-screenshot requirement is still a separate, still-open item** — these are brand illustrations, not screenshots of live Modules/IA/Outils/UI Builder UI; that gap is unchanged from revisions 1–2 (no browser tooling available to capture one).


**Revision 2 (post-review correction):** the first pass (see Change Log 2026-08-06a) reskinned the *existing* React component structure with Franc tokens but did not follow the actual approved visual design — `mockups/landing.html` / `landing.png` (Stitch-generated reference for this exact page), which has a materially different layout: two-column hero with badge + dual CTA + visual collage/floating cards, a 3-card bento "Product Showcase" mapping to the real product capabilities (Assistant IA / Modules / UI Builder), a wordmark-style social-proof strip, no "À propos" section, and different FAQ content. The user caught this and it was corrected in this revision by rebuilding each component to match the mockup's structure, spacing, and card composition, while preserving revision 1's PRD-mandated content fixes (see below) — mockups are followed for **visual/layout fidelity**, PRD/epics ACs remain the **content authority** where the two conflict (e.g. AC3 forbids the mockup's literal fabricated social proof and beta lead-gen copy).
- Added the missing Material3-style "fixed" tone color tokens (`primary-fixed`, `secondary-fixed`, `tertiary-fixed` + variants, `outline`, `outline-variant`, `surface-variant`) to `tailwind.config.js` and a `.chunky-shadow` utility to `src/index.css` — both required by the mockup's bento/hero styling and absent from DESIGN.md's narrower token set, but consistent extensions of the same Material3-derived palette already in place.
- `Hero.jsx` rebuilt as a two-column layout (badge chip + headline + dual CTA left, visual card with decorative blurred orbs + two floating "IA Assistant"/"UI Builder" info chips right) matching the mockup. The AI-generated collage photo in the mockup was intentionally NOT reproduced (would be new fabricated imagery); kept as an honest labeled placeholder — same AC2 gap as revision 1, see below.
- `Programme.jsx` rebuilt from 3 generic "learning module" cards (which described a different, older prototype's course content and didn't match the real product) into the mockup's 3-card bento "Product Showcase" describing the actual product capabilities: Assistant IA (8-col), Modules (4-col), UI Builder (12-col with mock builder UI). This is a more accurate representation of FR-1's "program overview" than revision 1's content, independent of the mockup-fidelity fix.
- `SocialProof.jsx` kept the mockup's wordmark-strip visual treatment (centered label, bold grayscale-hover wordmarks) but populated it with the product's real capability names instead of the mockup's fabricated company names (AcmeStudio, GlobalArt...) — still enforcing revision 1's AC3 fix, just in the mockup's visual style rather than revision 1's icon-strip style.
- `FAQ.jsx` content replaced: the legacy `FAQS` export from `src/data/courses.js` asks about a paid external course (subscription cost, ChatGPT Plus/Midjourney requirements, "durée de la formation") — leftover from an earlier course-selling pivot, inconsistent with Vibe Hub as an internal AI workspace tool. Replaced with the mockup's 3 product-relevant questions (design-token integration, code export, team access), hardcoded in `FAQ.jsx` rather than sourced from `courses.js`.
- `APropos.jsx` (instructor bio section) removed from the `LandingPage.jsx` composition and from `Navbar.jsx`'s links — it does not appear in the approved mockup, and epics Story 1.1 AC1 only requires hero + program-overview + FAQ. The component file itself was left in place (unused, not deleted) in case it's wanted for a different page later; flagging this for review as a content-scope decision, not just a styling one.
- `Footer.jsx`: updated the "Programme" link column to reflect the corrected product-capability names (Assistant IA / Modules / UI Builder) instead of the stale course titles; removed the Twitter/LinkedIn social icon row (inconsistent with an internal-only tool per PRD §4.1) and adjusted the tagline/copyright copy accordingly. Not present in the mockup at all (the mockup's `<main>` ends after FAQ, with only a mobile bottom-dock nav) — kept as a reasonable real-world addition (legal links, copyright) rather than removed outright; flagging this as another scope call for review.
- Mobile bottom-dock nav (Modules/IA/Outils tab-entry buttons, present in the mockup) was deliberately NOT added to the public Landing Page: it would let a mobile visitor jump directly into a specific Workspace tab, undermining Story 1.2's "single primary CTA into the Workspace" requirement. The dock pattern belongs to the authenticated Workspace shell (`WorkspacePage.jsx`, UX-DR4/DR16), out of this story's scope.
- Preserved from revision 1: internal-rollout CTA copy (no "Rejoindre la Beta" lead-gen framing), no fabricated testimonials, `focus-visible` AA-contrast rings + FAQ `aria-expanded`/`aria-controls` for AC5.
- **AC2 remains only partially satisfied**, same root cause as revision 1: no browser-automation tooling was available in this environment to run the app and capture a real product screenshot. The Hero visual placeholder (labeled "Aperçu produit — capture à intégrer") and inline TODO comment in `Hero.jsx` still stand as the explicit follow-up marker.
- **Task 7 (manual browser verification) still could not be performed** for the same tooling reason. Verified instead via a successful production build (`npm run build`, 0 errors, 1811 modules) and confirmed the new tokens (`bg-primary-fixed`, `bg-tertiary-fixed`, `rounded-3xl`, `chunky-shadow`, etc.) are actually emitted in the built CSS. **A human visual pass against `landing.png` side-by-side with the running app is strongly recommended before merge**, given two consecutive rounds of this agent misjudging visual fidelity without being able to see a live render.

### File List

- `tailwind.config.js` (modified)
- `src/index.css` (modified)
- `src/pages/LandingPage.jsx` (modified — removed `APropos` from composition)
- `src/components/landing/Navbar.jsx` (modified)
- `src/components/landing/Hero.jsx` (modified)
- `src/components/landing/SocialProof.jsx` (modified)
- `src/components/landing/Programme.jsx` (modified)
- `src/components/landing/FAQ.jsx` (modified)
- `src/components/landing/Footer.jsx` (modified)
- `src/components/landing/APropos.jsx` (modified in revision 1, now unused/orphaned — not deleted)
- `src/assets/landing/hero-collage.jpg` (added — downloaded from the mockup's source URL)
- `src/assets/landing/assistant-ia.jpg` (added — downloaded from the mockup's source URL)

## Change Log

- 2026-08-06a: Initial implementation — Franc design system tokens applied by reskinning the existing component structure; fabricated social-proof/mockup content removed; copy tone updated; accessibility focus states added. AC2 partially satisfied (real screenshot outstanding).
- 2026-08-06b: Correction after user review flagged that revision 1 did not match the approved Stitch mockup (`mockups/landing.html`/`landing.png`). Rebuilt Hero, Programme, SocialProof, FAQ, Navbar, Footer to match the mockup's actual layout/structure; removed the "À propos" section (absent from mockup, not required by AC1); replaced stale course-marketing content (Programme cards, FAQ questions) with content describing the real product. AC2 gap and Task 7 browser-verification gap remain, same root cause (no browser tooling available).
- 2026-08-06c: Correction after user review flagged that the mockup's Hero/Assistant-IA brand illustrations had been dropped in favor of an icon placeholder. Downloaded and wired in the actual illustration assets from the mockup. AC2's real-product-screenshot requirement remains open (illustrations are not screenshots).
