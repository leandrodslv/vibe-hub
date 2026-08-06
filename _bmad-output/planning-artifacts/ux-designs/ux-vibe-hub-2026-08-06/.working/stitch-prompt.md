# Google Stitch prompt — Vibe Hub

Paste everything below into Google Stitch (https://stitch.withgoogle.com). It emits a DESIGN.md-style spec plus per-screen HTML — save whatever it outputs into this folder:
`_bmad-output/planning-artifacts/ux-designs/ux-vibe-hub-2026-08-06/`

---

**Product:** Vibe Hub — an internal web workspace that teaches UI/UX and product designers to use AI in their existing workflow, then puts a working AI tool in their hands on the same screen as the lesson. Audience: professional UI/UX/product designers with no coding background. The interface quality is itself part of the pitch — it needs to read as expert-grade to an audience of design professionals, while feeling bold, energetic, and fun rather than clinical or corporate.

**Surfaces to design:**
1. **Landing page** (public, pre-login): hero, social proof / program overview, FAQ, one primary CTA into the app ("Rejoindre la Beta" or similar). Uses real product screenshots in the overview section, not stock imagery.
2. **Workspace — Modules tab**: a course catalog grid. Each card: title, short description, time estimate, a session-local progress bar (e.g. "2/5 leçons").
3. **Workspace — IA tab**: a chat assistant, mid-conversation, that turns a vague design ask into a copyable, structured generation prompt — visually distinct "prompt hand-off" block, separate from normal chat bubbles. Example line: "Je vais te rédiger le prompt parfait à utiliser dans l'UI Generator." A persistent, discreet "Assistant IA" label near the chat (AI-disclosure requirement, not a dismissible banner).
4. **Workspace — Outils tab**: a tools grid split into two explicit groups — "Disponible" (one live tool: UI Builder) and "Bientôt disponible" (four waitlisted tools: Code Auditor, Content Writer, Color Studio, Vision Lens — each with a waitlist-join button, and a joined state like "Sur la liste ✓").
5. **Workspace shell/nav**: three-tab navigation between Modules / IA / Outils, visible in every workspace screen.

**Form factor:** desktop web is primary (this is a daily workspace tool), but it must also work responsively on mobile — design both a desktop layout and a mobile/responsive companion for at least the IA tab.

**Visual direction — the brief:**
- Bold, confident, characterful display typography for headings and wordmark. Not a generic default SaaS bold-sans. Think of the register in these reference styles (described, not attached): a Dribbble-style quiz app with a big black bold rounded/condensed "Quiz 🏆" wordmark and playful cutout-collage illustration of people; a mood-tracker app with bold flat black headings and friendly emoji-like blob character illustrations on a light background; a "Move & Sync" fitness app with a bold near-italic confident display wordmark, chunky glossy 3D icon accents (a flower, a bell), and both a light and a dark card variant.
- Heavily rounded shapes throughout: pill/capsule buttons and nav elements, large-radius cards.
- **Franc multicolor palette**: multiple fully saturated colors (warm orange/coral, violet, blue, pink, green were explored) assigned *by meaning* — one hue per content category or status (e.g. Modules vs IA vs Outils, "Disponible" vs "Bientôt disponible", success states) — not randomly decorative, and not a muted-neutral-plus-one-accent system.
- Illustration/decoration should feel crafted and premium — real typographic and illustrative craft, not a generic AI-template look. Two local CSS-only attempts at this were rejected as "AI slop": one used plain flat SVG blobs with a generic sans-serif, the other tried to fake a display font with a skewed/condensed system font plus a colored-accent-letter trick and CSS-gradient "glossy" stickers — both read as cheap/gadget rather than premium. Please use real typefaces and genuinely well-crafted illustration/graphic treatment rather than approximating with system fonts or flat gradients.
- Still needs to read as credible for professional design work — playful and energetic, not childish; illustration accents should support the UI, not cover it.

**Existing baseline being evolved away from:** the current live prototype is strictly monochrome (black/white/gray), default Tailwind spacing/radii/shadows — functional but was judged too generic. This new direction fully replaces it, landing page included.

**French microcopy, real content, no lorem ipsum.**

---

Once you have Stitch's output, save the files here and let me know — I'll pull the visual decisions into DESIGN.md and we'll continue with EXPERIENCE.md.
