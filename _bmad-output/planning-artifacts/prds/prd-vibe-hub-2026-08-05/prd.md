---
title: Vibe Hub
status: final
created: 2026-08-05
updated: 2026-08-06
---

# PRD: Vibe Hub
*Working title — confirm.*

## 0. Document Purpose

This PRD is for Léandro (product owner, sole builder, and — pending confirmation — sole course-content author) and for whoever picks up UX and architecture work next. It builds directly on `_bmad-output/planning-artifacts/briefs/brief-vibe-hub-2026-08-05/brief.md` and does not repeat its reasoning — see that brief for problem framing and competitive rationale. It also incorporates three research reports already produced (`domain-ai-edtech-platforms-for-ui-ux-designers`, `market-formation-ia-designers-ui-ux`, `technical-supabase-vs-firebase-backend`, all in `_bmad-output/planning-artifacts/research/`) and a fresh codebase reality-check, since Vibe Hub is not a concept — it is a working prototype whose actual state has drifted from what earlier documents assumed. Vocabulary is Glossary-anchored (§3); Features (§4) nest Functional Requirements (FRs), numbered globally; `[ASSUMPTION: ...]` tags mark inferences made without direct confirmation from Léandro and are indexed in §9 — resolve these before treating this PRD as final.

## 1. Vision

Vibe Hub is an internal workspace that teaches UI/UX and product designers to use AI in their existing workflow, then puts a working AI tool in their hands on the same screen as the lesson. It exists because generic AI training doesn't speak design's vocabulary, and dev-oriented AI tooling assumes a comfort with code that the target audience doesn't have and isn't asking for. Vibe Hub closes that gap by fusing two loops in one interface: a course catalog that teaches AI-assisted design workflows, and a live workspace — chat assistant, AI tools grid — where a learner immediately practices what they just learned. The chat assistant explicitly hands off to the tools grid ("I'll write you the perfect prompt to use in the UI Generator"), so learning and doing reinforce each other inside a single session rather than living in separate tabs of the internet.

`[ASSUMPTION]` Today this is a functional but pre-rollout prototype (React/Vite/Tailwind, Gemini-backed chat and UI Builder, Supabase for course data and a waitlist) that has not yet been put in front of the real target team. This PRD describes the product as it should be when it's ready for that first real rollout — not metrics already achieved.

Per the brief, the claimed advantage is workflow integration (never leaving the platform to "try it on ChatGPT"), not the underlying model — Gemini today is replaceable, and the brief is explicit that this is **not a defensible moat**: a well-funded competitor could reproduce the mechanism. The product's own interface quality is itself part of the pitch — a monochrome, design-system-grade UI that embodies the design quality it teaches, not just talks about it. `[ASSUMPTION]` Longer-term, if the loop works, the course catalog is meant to become the onboarding layer of an increasingly tool-rich daily workspace rather than the product's center of gravity — new AI tools should be able to land directly in the Outils grid the team already has open. This reshapes how "success" should eventually be read: not course completions alone, but workspace habit.

## 2. Target User

### 2.1 Jobs To Be Done

- As a UI/UX or product designer with no coding background, I want to learn how to fold AI into my existing workflow without wading through generic prompt-engineering content that isn't built for design.
- As that same designer, I want to immediately try what I just learned, in the same place I learned it, so the lesson doesn't evaporate before I apply it.
- As a designer under pressure to "use AI more," I want a low-stakes space to practice without looking incompetent in front of teammates or clients.
- `[ASSUMPTION]` As a team lead/manager, I want visibility into whether my design team is actually adopting AI tools, not just whether they clicked into a course once. **Deferred:** no FR in this PRD delivers manager-facing visibility (SM-2 in §7 is a metric Léandro would track himself, not a feature); this JTBD is named but explicitly not built in v1.

### 2.2 Non-Users (v1)

- External / public users. Vibe Hub is internal-only in v1 — no public signup, no external monetization. `[ASSUMPTION — from brief, unconfirmed]`
- Developers and non-design internal teams (marketing, engineering). The brief flags possible future expansion here, but v1 is scoped to the design team.
- Designers who want a code-first or plugin-embedded workflow (e.g., inside Figma). Vibe Hub is a standalone workspace, not an IDE/plugin.

### 2.3 Key User Journeys

- **UJ-1. Priya finishes a module and immediately runs the loop.**
  - **Persona + context:** Priya, a mid-level product designer on the internal team, has 20 minutes between meetings and wants something practical, not a video to "watch later."
  - **Entry state:** In the Vibe Hub workspace, Modules tab, no auth barrier assumed in v1 `[ASSUMPTION]`.
  - **Path:** She opens "Introduction à l'IA pour l'UI," finishes the module, switches to the IA chat tab, describes a real screen she's stuck on, and the assistant turns her vague ask into a structured generation prompt.
  - **Climax:** She copies the assistant's prompt into the UI Builder tool and watches real React/Tailwind code render on screen from her own design problem, not a canned demo.
  - **Resolution:** She has a usable component and a reusable prompt pattern for the next time. She leaves the tab open rather than closing it.
  - **Edge case:** If the AI Builder's rendered code doesn't match what she pictured, the chat assistant should let her refine the prompt in place rather than forcing her to start over from the module.

- **UJ-2. Léandro publishes a new course module without touching code.**
  - **Persona + context:** Léandro, `[ASSUMPTION]` currently the sole content author, wants to replace a placeholder module with real content between other work.
  - **Entry state:** Admin surface (`AdminPage`), already present in the codebase today.
  - **Path:** He creates or edits a course record (title, description, time estimate, image) and it becomes live in the Modules tab immediately, since `ModulesTab` reads live from Supabase.
  - **Climax:** The module appears correctly in the catalog with no deploy or code change required.
  - **Resolution:** The course catalog inches closer to being fully real content instead of duplicated placeholders — the deployment blocker named in the brief.

- **UJ-3. Marco signals demand for a tool that isn't built yet.**
  - **Persona + context:** Marco, a designer browsing the Outils tab, wants a tool like Color Studio, which is marked "coming soon."
  - **Entry state:** Outils tab, tool card shows a waitlist affordance instead of a launch button.
  - **Path:** He clicks to join the waitlist for that specific tool; the interest is recorded (Supabase) as an anonymous per-tool count — no auth exists in v1, so this cannot yet be tied to Marco's identity (see FR-8 Notes).
  - **Climax:** Léandro sees the aggregated waitlist count for that tool climb, and uses it as a build-next signal. (Realizes FR-9, newly in-scope — see §6.1.)
  - **Resolution:** Tool-building priority is driven by real internal demand signal instead of guesswork, even though today that signal is "N people want this," not "who."

## 3. Glossary

- **Workspace** — The application shell (as opposed to the public Landing Page) containing the three tabs: Modules, IA, Outils. Unauthenticated in v1 — no user accounts exist (see §6.2).
- **Modules tab** — The course catalog surface, backed live by Supabase course records (see FR-4).
- **IA tab** — The AI chat assistant surface; supports slash commands and project-based organization of conversations.
- **Outils tab** — The grid of AI tools available to designers, mixing live tools (currently only UI Builder) and "coming soon" tools gated behind a waitlist.
- **UI Builder** — The one currently live AI tool: takes a design prompt and generates React/Tailwind component code via Gemini.
- **Waitlist tool** — A tool card in the Outils tab with `status: 'coming'` that captures interest via Supabase instead of launching a live tool. Today: Code Auditor, Content Writer, Color Studio, Vision Lens.
- **Course** — A single catalog entry (title, description, time estimate, image, module content) stored in Supabase and managed via the Admin surface.
- **Admin surface** — The `/admin`-routed page (`AdminPage`) used to create/edit/delete Courses; not part of the designer-facing Workspace.
- **Prompt hand-off** — The IA tab's behavior of producing a ready-to-use generation prompt that a user pastes into the UI Builder, functionally linking the two tabs within one session.
- **Course Progress** — A record of how far a designer has advanced through a Course. Ships session-local (no persistence, no cross-device sync) in v1 since no stable user identity exists yet; becomes a true per-user record once authentication ships (see FR-3). Not to be confused with the current static, non-computed progress values in the prototype.

## 4. Features

### 4.1 Landing Page

**Description:** The public-facing entry surface before a user enters the Workspace: hero section, social proof, program/course overview, FAQ. `[ASSUMPTION]` Since Vibe Hub is internal-only, this page's audience is internal team members being introduced to the tool, not external prospects — copy and CTAs should be written for "here's the tool your team just got," not lead generation.

**Functional Requirements:**

#### FR-1: Landing page presents the product and routes into the Workspace

A visitor can view the hero, social proof, program overview, and FAQ sections, and enter the Workspace from a primary call-to-action.

**Consequences (testable):**
- Landing page renders without requiring authentication.
- A single primary CTA transitions the view to the Workspace (`app` view in current implementation).
- Program-overview and hero sections use real screenshots of the actual product (Modules/IA/Outils tabs, UI Builder output), not stock or placeholder imagery. `[NOTE FOR PM]` "Social proof" in the testimonial sense is not achievable before a first-ever rollout with no prior users — substitute credible framing instead (e.g. what the tool does today, roadmap for what's coming), and revisit real testimonials once the team has used it for a stretch.

**Out of Scope:**
- External marketing funnel tracking (UTM capture, ad attribution) — not relevant to an internal tool.

### 4.2 Course Catalog (Modules tab)

**Description:** Realizes UJ-1, UJ-2. Designers browse and consume AI-for-design courses. Content is served live from Supabase (`getCourses`), not the static `src/data/courses.js` file, which is legacy seed data and must not be treated as the source of truth going forward.

**Functional Requirements:**

#### FR-2: Designer can browse and open real, distinct course content

A designer can view a grid of courses and open one to consume its content. Realizes UJ-1.

**Consequences (testable):**
- Every course card shown to the designer team has a unique title and description — no duplicated placeholder entries.
- `src/data/courses.js`'s duplicated placeholder content (2 unique modules repeated across 9 entries) is retired or fully replaced before any rollout to the real team. **This is a deployment blocker per the brief, not a nice-to-have.**

**Notes:** Per domain research, AI-tool UIs churn quickly (model/tool versions, feature names); courses should be written to teach durable judgment (how to evaluate and steer AI output) rather than a specific tool's current UI, so content doesn't go stale as fast as the tools it covers. `[NOTE FOR PM]` worth stating explicitly in the content style guide, not just this PRD.

#### FR-3: Course progress indication

`[ASSUMPTION]` A designer sees which courses they've started or completed, tracked as **Course Progress** (§3). **Decision:** since full per-user auth is deferred (§6.2), FR-3 ships in v1 as a **session-local, non-persistent indicator only** — state resets on a new browser session and doesn't sync across devices. This is the explicit MVP form, not a placeholder awaiting a future decision. True per-user, persistent Course Progress is deferred to v2 alongside authentication.

**Consequences (testable):**
- Progress shown to the user reflects real interaction state within the current session, not a static/fabricated percentage (current codebase has static, non-computed progress values — this must not ship as-is to real users).
- Progress is explicitly not expected to persist across sessions or devices in v1 — no backend write for progress is required to satisfy this FR.

**Out of Scope:**
- Certification, scoring, or graded completion — brief and research both stop short of this; cohort/graded formats are a `[NOTE FOR PM]` candidate for v2 (see §6.2).

#### FR-4: Content author can manage courses without a deploy, behind a minimal access gate

`[ASSUMPTION]` Léandro (or another content owner) can create, edit, and delete course records via the Admin surface, and changes reflect immediately in the Modules tab. Realizes UJ-2.

**Decision:** The Admin surface (`/admin`) currently has zero access control — anyone who finds the path can edit or delete the entire catalog. That is not acceptable for the "ready for real rollout" bar this PRD sets (§1). Full user authentication is still deferred (§6.2), but a **minimal access gate on `/admin` specifically (e.g. a single shared credential, not per-user accounts) is in scope for MVP and blocks rollout**, exactly like FR-2's content-duplication fix. This is deliberately lighter than full auth: one gate protecting one write-capable surface, not a login system for the whole Workspace.

**Consequences (testable):**
- Creating/editing/deleting a course via `AdminPage` is reflected in `ModulesTab` without a code deploy (already true today via Supabase CRUD — this FR formalizes it as a requirement, not just an implementation detail).
- `/admin` cannot be reached or written to without passing the access gate; an unauthenticated request to modify course data via the client is rejected. Any Supabase credential shipped to the browser is scoped so it cannot perform admin-level writes on its own — the gate must be enforced server-side/by policy, not by hiding the `/admin` route.

### 4.3 AI Chat Assistant (IA tab)

**Description:** Realizes UJ-1. A chat interface, purpose-built for design prompts rather than generic assistant Q&A, that helps a designer turn a vague idea into a usable generation prompt and hands it off to the UI Builder. Supports slash commands and organizing conversations into projects.

**Functional Requirements:**

#### FR-5: Designer converts a vague idea into a structured generation prompt

A designer can describe a UI/design problem in natural language and receive a structured prompt suitable for pasting into UI Builder. Realizes UJ-1 (Prompt hand-off).

**Consequences (testable):**
- Assistant responses relevant to prompt-crafting include an explicit, copyable prompt block distinct from conversational text.

#### FR-6: Slash commands and project organization

A designer can invoke slash commands within the chat and group related conversations into named projects. **Scope note:** this stays a design-prompt utility, not a general chat product — slash commands and project grouping exist to organize *design prompting sessions* specifically (e.g. a `/prompt` command scaffolds a generation prompt), not to build a general-purpose productivity chat tool (§5 Non-Goal).

**Consequences (testable):**
- Typing `/` in the chat input surfaces a list of available slash commands with a one-line description of what each does — a stub command with no listing does not satisfy this.
- Conversations can be assigned to and later filtered by a project grouping.

**Feature-specific NFRs:**
- `[NOTE FOR PM]` EU AI Act transparency obligations took effect August 2026 — as of this PRD's date, this is a **current**, not upcoming, compliance requirement. Disclosing that the user is interacting with an AI system in the IA tab and UI Builder must be verified before rollout, not deferred as a future item.

### 4.4 AI Tools Grid & UI Builder (Outils tab)

**Description:** Realizes UJ-1, UJ-3. A grid of AI tools for designers. Only UI Builder is live today; the rest are represented as Waitlist tools. UI Builder takes a prompt (often handed off from the IA tab) and generates real React/Tailwind component code via Gemini.

**Functional Requirements:**

#### FR-7: Designer generates working UI code from a prompt

A designer can submit a design prompt to UI Builder and receive rendered React/Tailwind code as output. Realizes UJ-1.

**Consequences (testable):**
- Submitting a well-formed prompt returns renderable React/Tailwind code within the tool's UI, without leaving the Outils tab.
- **Hand-off mechanism (decision):** In v1, hand-off is manual copy-paste, matching the Glossary definition and UJ-1 — the assistant produces a prompt block (FR-5) that the designer copies and pastes into UI Builder. "Without manual reformatting" means the pasted text works as-is, with no edits required — not that the paste step itself is automated. One-click auto-fill between tabs is a v2 candidate, not a v1 requirement.

#### FR-8: Designer joins a waitlist for a not-yet-built tool

A designer can express interest in a "coming soon" tool (Code Auditor, Content Writer, Color Studio, Vision Lens) and have that interest recorded. Realizes UJ-3.

**Consequences (testable):**
- Waitlist join is recorded per-tool in Supabase, distinguishable by which tool the interest is for.
- A designer cannot submit to the waitlist for a tool that is already live.

**Notes:** Since no auth exists in v1, waitlist entries are anonymous per-tool counters, not tied to a designer's identity — this FR supports "how many people want X" (FR-9), not "which designer wants X." If the latter is ever needed (e.g. to personally follow up with interested designers), it requires auth first.

#### FR-9: Waitlist demand is visible to decide what to build next

Léandro or another decision-maker can see aggregated waitlist signal per tool. **Now in-scope for MVP** (§6.1) — this does not exist in the codebase today and needs to be built; it does not depend on the four waitlisted tools themselves shipping.

**Consequences (testable):**
- Each of the four waitlisted tools has a visible, up-to-date count of waitlist joins, reachable through the Admin surface without directly querying Supabase's table editor or writing SQL.

**Out of Scope:**
- Building any of the four waitlisted tools themselves — v1 is the waitlist mechanism and its visibility, not the tools (see §6.2).

## 5. Non-Goals (Explicit)

- Vibe Hub is not a public product or SaaS in v1 — no external monetization, no public signup flow.
- Vibe Hub is not becoming a general-purpose AI chat product; the IA tab exists to serve design prompt-crafting and hand off to tools, not to compete with general assistants. Slash commands and project organization (FR-6) are scoped narrowly to that purpose (see FR-6 Scope note) — their presence is not a step toward general-assistant functionality.
- Vibe Hub is not a Figma/design-tool plugin; it is a standalone workspace.
- Vibe Hub is not, in v1, a certification or graded-learning platform.

## 6. MVP Scope

### 6.1 In Scope

- Landing page: hero, real-screenshot program overview, FAQ (FR-1).
- Workspace with three tabs: Modules (course catalog), IA (chat assistant with slash commands and project organization), Outils (AI tools grid).
- UI Builder as the one fully functional AI tool (Gemini-backed, generates React/Tailwind code), with manual copy-paste hand-off from the IA tab (FR-7).
- Waitlist capture (Supabase) for the four not-yet-built tools, **plus a waitlist-count view** for whoever decides what to build next (FR-8, FR-9).
- Course content management via the existing Admin surface, backed by Supabase (not the static placeholder file) — **gated by a minimal access credential**, not open to anyone who finds `/admin` (FR-4).
- Real, distinct course content replacing the current duplicated placeholders — **blocking** for any rollout to the real team (FR-2).
- Session-local (non-persistent) course progress indication only (FR-3) — not per-user, not saved across sessions.

### 6.2 Out of Scope for MVP

- Full user authentication and accounts for designers — deferred to v2. (This is distinct from FR-4's minimal Admin-surface gate, which *is* in v1 scope — see §6.1.)
- Persistent, per-user course-progress tracking — depends on the authentication deferred above; v1 ships session-local progress only (FR-3).
- Clean URLs / React Router — Landing and Workspace currently toggle via internal state, not real routing.
- The four waitlisted tools (Code Auditor, Content Writer, Color Studio, Vision Lens) themselves — only their waitlist mechanism and count visibility ship in v1.
- TypeScript migration.
- Cohort-based or graded course formats (raised by market research as higher-completion, but a v2+ consideration — reshaping content format is a bigger lift than this PRD's scope).
- One-click auto-fill hand-off between IA tab and UI Builder (v1 is manual copy-paste, see FR-7).

## 7. Success Metrics

`[ASSUMPTION — provisional targets, not yet discussed with Léandro; carried forward from the brief]`

**Primary**
- **SM-1**: Loop completion — share of active team members who, within a session, complete at least one module and then use the IA → UI Builder hand-off at least once. Validates FR-2, FR-5, FR-7. Target: TBD. `[NOTE FOR PM]` Market research puts self-paced course completion at 5-15% vs 60%+ for structured/cohort formats — useful as a sanity-check floor when setting a real target, not as the target itself.

**Secondary**
- **SM-2**: Workspace adoption — share of the design team that opens the Workspace and uses at least one AI tool in a given month. Validates FR-2, FR-7, FR-8. Target: TBD.
- **SM-3**: Content credibility — 100% of published course cards have unique, real content (zero placeholder duplicates) before rollout. Validates FR-2. This is a launch gate, not an ongoing metric.

**Counter-metrics (do not optimize)**
- **SM-C1**: Waitlist size for its own sake. A large waitlist with no resulting tool ever built signals broken follow-through, not success. Counterbalances SM-2.

## 8. Constraints and Guardrails

- **Privacy:** Supabase is already live and already storing data (course records, per-tool waitlist counts) — this is not a hypothetical future concern. Today's data is not tied to individual user identity (no auth, no login), which limits *personal-data* exposure specifically, but the backend itself is real and GDPR review should not wait for auth to exist. Once auth ships (v2), per-user data (Course Progress, saved IA-tab projects) must be isolated so one team member cannot read or write another's — a designer's private practice work is not something a teammate should be able to browse.
- **AI transparency:** Per domain research, EU AI Act transparency obligations (effective August 2026) require disclosing AI-driven interactions to users. The IA tab and UI Builder should make clear the user is interacting with an AI system. `[NOTE FOR PM]` verify current UI copy satisfies this.
- **Accessibility:** `[NOTE FOR PM]` No accessibility bar has been set yet. Domain research flags WCAG-aligned baselines as an increasingly standard expectation even for internal tools; worth a deliberate decision (e.g. target WCAG 2.1 AA) rather than a silent gap, especially since the product's pitch rests partly on demonstrating UI quality.
- **Cost:** Gemini API usage (chat + UI Builder) is metered; no budget or rate-limiting requirement has been confirmed. `[ASSUMPTION]` Given internal-only, small-team usage today, cost risk is low — but SM-1 (§7), the PRD's primary success metric, is explicitly defined to *increase* usage of these metered endpoints. Cost risk should be treated as low-but-rising-by-design, not a static assumption; a budget ceiling or rate limit should be defined before SM-1 is actively optimized against, not after.
- **Product risk — commoditization:** Domain research flags that foundation-model providers (e.g. Gemini's native "generative UI") are absorbing prompt-to-UI generation directly, which risks commoditizing UI Builder's core mechanism. The durable differentiator has to stay the curriculum-to-tool integration (course → prompt hand-off → generation in one session), not the generation capability itself — worth keeping in mind if UI Builder investment is prioritized over the learning loop around it.

## 9. Open Questions

1. **Mandate** — Is Vibe Hub officially sanctioned by the company, or Léandro's own initiative pending a pitch? Unresolved from the brief; affects who maintains it long-term and how much rigor future artifacts need.
2. **Success metrics targets** — SM-1/SM-2 need real numeric targets from Léandro; currently structural placeholders.
3. **Target team size and composition** — Brief estimates "small to medium" (a few to ~15 designers); unconfirmed.
4. **Content pipeline** — Is Léandro the sole course-content author going forward, and if so, does that make content production the actual bottleneck rather than engineering?
5. ~~**Authentication / Admin access**~~ — **Resolved in this revision:** full designer authentication stays deferred to v2, but a minimal Admin-surface access gate is now in MVP scope and blocks rollout (see FR-4, §6.1).
6. ~~**Waitlist visibility (FR-9)**~~ — **Resolved in this revision:** confirmed not to exist yet; a waitlist-count view is now in MVP scope (see FR-9, §6.1).
7. **Competitive response** — Market research flags "Le Laptop" as a close French competitor with an established community. Does this change urgency or positioning? Not addressed in this PRD's scope but flagged for awareness.
8. **Community/peer mechanism** — Market research names a communal "skills"/peer-visibility mechanism as a repeatedly-cited durable differentiator for this category (harder to copy than a solo AI tool). Vibe Hub currently has no communal feature at all — is that a deliberate v1 cut, or a gap worth a v2 feature exploration?
9. **Pricing model, deferred not resolved** — Declaring Vibe Hub internal-only sidesteps market research's top recommendation (pick bootcamp/subscription/B2B pricing) rather than answering it. If Vibe Hub is ever offered beyond this one internal team, this question resurfaces — worth remembering it was deferred, not settled.
10. **Curriculum-aware AI Builder** — Domain research's core differentiation recommendation is a *bidirectional* link between courses and the generator (e.g. graded exercises that use UI Builder, not just chat handing UI Builder a prompt one-way). Today's Prompt hand-off (FR-5) is one-directional UX convenience. Worth a deliberate v2 decision on whether to deepen this integration as the moat-substitute discussed in §1, rather than leaving it to accrue by accident.

## 10. Assumptions Index

- §1 — Vibe Hub is a pre-rollout prototype; this PRD describes the target state for first real rollout, not achieved metrics.
- §2.1 — Team-lead/manager JTBD (visibility into AI adoption) is assumed, not confirmed.
- §2.2 — Internal-only, no external monetization, carried from brief, unconfirmed by direct interview.
- §2.3 UJ-1 — No auth barrier assumed for v1 designer entry into the Workspace.
- §2.3 UJ-2 — Léandro assumed to be the sole current content author.
- §2.3 UJ-3 — Marco is an illustrative name, not a real team member.
- §4.1 — Landing page audience framed as internal rollout communication, not external lead-gen, since the product is internal-only.
- §4.2 FR-3 — Course progress tracking (even session-local) is assumed desired; not explicit in the brief beyond noting current progress values are fake.
- §4.2 FR-4 — Content management via Admin surface is assumed to be a real v1 requirement (it already exists in code) rather than an internal-only convenience.
- §7 — All Success Metrics targets are provisional, carried from the brief's own `[HYPOTHÈSE]` tags, not discussed live with Léandro.
- §8 — Cost risk from Gemini API usage assumed low given small internal scale; not validated against any actual usage data or budget.
