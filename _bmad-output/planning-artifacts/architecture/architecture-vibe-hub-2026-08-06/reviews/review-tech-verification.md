---
name: 'Tech Verification Review — Vibe Hub Architecture Spine'
type: review
target: '_bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md'
date: '2026-08-06'
method: 'web search verification of every version/maintenance claim in the Stack table and Deferred section'
---

# Tech Verification Review — ARCHITECTURE-SPINE.md

## Scope

Verified every version and maintenance-status claim against live web search (August 2026). Ground truth for "what's installed" is `package.json`; this review checks whether any installed/pinned choice is now deprecated, insecure, or superseded in a way relevant to the *new* work this spine authorizes (the `gemini-proxy` Edge Function, the FR-7 sandbox, and any future styling/build work).

## 1. Stack table — version-by-version

| Item | Spine value | Verification result |
| --- | --- | --- |
| React | 18.3.1 | Matches `package.json` (ground truth). React 19.2.x is the current actively-developed line (stable since Dec 2024); React 18 is now security-patches-only. Not a defect in the spine (it correctly reflects installed state), but worth flagging as a fact the spine doesn't surface: **no urgency to migrate**, since React 18 is still the "LTS-recommended, safe, stable" choice per current guidance, just no longer receiving new features. |
| Vite | 5.4.0 | Matches `package.json`. **Finding: stale major.** Current is Vite 8.x (8.2.0 latest, 8.0.0 shipped March 2026); security-patch backporting is now limited to 7.3, 8.0, 8.1, and 6.4 — **Vite 5 is outside the actively backported set**, i.e. it will not receive further security patches. Low urgency for a dev-time build tool with no server exposure, but should be flagged as a debt item, not silently carried forward as "the stack." |
| Tailwind CSS | 3.4.7 | Matches `package.json`. Tailwind v4 (CSS-first config, Oxide engine) has been GA since early 2025 and is now the default recommendation for new work ("zero reason to start with v3 in 2026"). Not a security issue, but any *new* Tailwind usage this spine introduces (FR-7 sandbox styling, new components) will be built against a framework version already superseded upstream. |
| @supabase/supabase-js | 2.104.1 | Matches `package.json`. No deprecation or security advisory found. Fine as-is. |
| @google/generative-ai | 0.24.1 | Matches `package.json`. **Finding — most material one.** This package is officially deprecated. Google's own repo is renamed `deprecated-generative-ai-js` with the notice "This SDK is now deprecated, use the new unified Google GenAI SDK." The replacement, `@google/genai`, is at 2.15.0 and is Google's current recommendation for all Gemini access (Gemini 2.x/3.x, Veo, Imagen). The spine's AD-1 explicitly moves Gemini calls into a **brand-new** Edge Function (`gemini-proxy`) — i.e., new code being written *now*, not legacy code being carried forward. Pinning that new code to a deprecated SDK is avoidable by simply naming `@google/genai` in the Edge Function instead (the browser-side `@google/generative-ai` dependency in `package.json` becomes dead weight once AD-1 lands and can be dropped). The spine's Stack table lists this version with no deprecation flag at all — this should have been caught. |
| react-markdown / remark-gfm | 10.1.0 / 4.0.1 | Matches `package.json`. No deprecation found; both are current major versions with active maintenance. Fine. |
| lucide-react | 0.383.0 | Matches `package.json`. No deprecation found; lucide-react ships frequent 0.x releases by design (no evidence 0.383.0 is unusually behind current, though exact-latest wasn't pinned down — low-stakes icon library, not worth further spend). |

## 2. Deno / Supabase Edge Functions runtime claim

Claim under test: *"Supabase Edge Functions runtime: Deno 2.1.4 (web-verified current, 2026)."*

- Confirmed: Supabase's hosted Edge Runtime (`supabase/edge-runtime`, itself versioned e.g. `1.69.4`) is built on **Deno v2.1.4** specifically — this is a real, checkable pairing, not a fabricated version number.
- However, "current, 2026" is misleading phrasing. Mainline Deno has moved well past 2.1: Deno 2.6 (Dec 2025), 2.7 (Feb 2026), 2.8 (May 2026), 2.9 (Jun 2026, now the LTS line through Jan 2027) have all shipped. There is an **open GitHub discussion, "Upgrade Supabase Edge Runtime to Deno 2.5"**, indicating Supabase's hosted platform was still pinned at the 2.1.x line as of that discussion — i.e., Supabase intentionally lags mainline Deno by multiple minor versions, and community pressure to move forward is active and unresolved.
- **Verdict: the number itself (2.1.4) checks out and is correctly attributed to Supabase's platform, not to Deno-at-large.** But "current, 2026" reads as "this is the current/latest thing," when it's more accurately "this is the version Supabase has pinned, several minors behind Deno's own current release." Recommend rewording to something like *"Deno 2.1.4 — the version Supabase's hosted Edge Runtime is pinned to as of 2026; Supabase lags mainline Deno (now 2.9.x) by design/platform choice, not by staleness of this research."* This avoids a future reader assuming 2.1.4 is Deno's current release.

## 3. Deferred section — Sandpack / react-live claims

Claim under test: *"Sandpack (CodeSandbox) is no longer actively maintained as of March 2026; react-live's latest release (4.1.8) is ~2 years stale."*

- **Both claims verified accurate.** Sandpack: confirmed via GitHub discussion/issue threads and third-party coverage that CodeSandbox announced (around March 18, 2026) that Sandpack moves to maintenance mode — attributed to CodeSandbox's acquisition by together.ai and the last active maintainer departing for Resend. The underlying CodeSandbox *service* itself is still operationally up (99.7%+ uptime reported), but the Sandpack *library* specifically is the one flagged as unmaintained — the spine's distinction is correct.
- react-live: confirmed latest npm version is 4.1.8, with no release in roughly the last 12 months (~2 years stale is the commonly cited figure), 221k weekly downloads showing it's still widely used but effectively unmaintained.
- **Better-maintained current alternative — not conclusively found.** Candidates surfaced:
  - `react-runner` — pitched as "a superset of react-live," but its own npm listing shows a very low version number (1.0.5) with no clear signal of active 2026 development found in this pass. **Do not treat this as a verified "better" pick** — it needs the same maintenance-freshness check the spine already flags as deferred, and this review did not find evidence it clears that bar.
  - Monaco Editor / CodeMirror 6 — these are code *editors*, not sandboxed live-preview runtimes; they solve a different problem (editing UX) and would still need to be paired with a transform+iframe execution layer (which is what AD-5 already requires regardless of editor choice).
  - `@babel/standalone` + hand-rolled iframe transform — the spine's own fallback candidate. This remains the most defensible choice right now: no third-party maintenance risk, and it satisfies AD-5's isolation boundary directly.
  - **No confidently-better-maintained named replacement for react-live/Sandpack emerged from this search.** The spine's decision to defer this to implementation time and re-evaluate "against the then-current landscape" is the correct call, not a gap — asserting a specific winner today would itself be an under-researched claim, which this review is checking against, not encouraging.

## 4. "Every named technology still exists and fits its stated purpose"

Checked: React, Vite, Tailwind, Supabase (Postgres/Auth/Edge Functions), Deno, Gemini API, `@google/generative-ai`/`@google/genai`, react-markdown, remark-gfm, lucide-react, Sandpack, react-live, Vercel, Netlify. All exist and are correctly used for their stated purpose in the spine. No hallucinated or discontinued-to-nonexistence technology found. (`@google/generative-ai` exists and still functions today — it is deprecated, not removed — so AD-1's design is not broken by this, only its Stack-table entry is under-flagged.)

## Summary of Findings by Severity

1. **Medium-High** — `@google/generative-ai` (0.24.1) is officially deprecated by Google in favor of `@google/genai`. The spine's Stack table carries it forward with no flag, even though AD-1 mandates writing brand-new Edge Function code for Gemini access right now. Recommend the Edge Function implementation use `@google/genai` instead, and note in the spine that the browser-side `@google/generative-ai` dependency becomes removable once AD-1 lands.
2. **Medium** — Vite 5.4.0 is outside Vite's currently-backported security-patch set (6.4/7.3/8.0/8.1 only); current major is 8.x. Low practical risk (build-time tool, not runtime-exposed) but should be logged as known debt rather than left unflagged.
3. **Low-Medium** — The Deno 2.1.4 claim is factually correct (that is what Supabase's hosted Edge Runtime is pinned to) but the phrase "web-verified current, 2026" overstates it — mainline Deno is at 2.9.x/LTS by mid-2026, and Supabase is confirmed (via an open community discussion requesting an upgrade to 2.5) to be lagging by design. Reword to avoid implying 2.1.4 is Deno's current release.
4. **Low** — Tailwind 3.4.7 is not deprecated or insecure, but Tailwind v4 is now the default recommendation for new work; worth a one-line debt note given this spine authorizes new UI (FR-7 sandbox, admin views).
5. **Informational, no defect** — Sandpack/react-live claims in the Deferred section are both verified accurate as stated. No confidently-better-maintained named replacement exists yet; the spine's decision to defer the choice to implementation time is correct, not a gap.

## Verdict

The spine's Stack table is accurate as a snapshot of installed dependencies (correctly sourced from `package.json`), and its two headline research claims (Deno 2.1.4, Sandpack/react-live maintenance status) both check out factually — but the table under-flags one materially relevant deprecation (`@google/generative-ai`) that bears directly on new work this spine commissions, and states the Deno version in a way that could be misread as "latest" rather than "what Supabase has pinned."
