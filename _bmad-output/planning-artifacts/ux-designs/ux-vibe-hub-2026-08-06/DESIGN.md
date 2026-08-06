---
name: Vibe Hub
description: A high-fidelity workspace design system for UI/UX designers — premium craft over corporate neutrality, bold expressive type, and a franc multicolor palette assigned by functional domain.
status: final
updated: 2026-08-06
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#484555'
  primary: '#5b3cdd'
  on-primary: '#ffffff'
  primary-container: '#7459f7'
  on-primary-container: '#fffbff'
  secondary: '#a7391e'
  on-secondary: '#ffffff'
  secondary-container: '#fd7958'
  on-secondary-container: '#6e1500'
  tertiary: '#00647c'
  on-tertiary: '#ffffff'
  tertiary-container: '#007f9c'
  on-tertiary-container: '#fafdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  franc-violet: '#7b61ff'
  franc-green: '#27ae60'
  franc-coral: '#ff7a59'
  franc-pink: '#ff4e8e'
  franc-blue: '#00d1ff'
typography:
  display-xl:
    fontFamily: Bricolage Grotesque
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  cta-pill:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  stack-gap: 16px
  section-padding: 40px
  grid-gutter: 20px
---

## Brand & Style

The design system is a high-fidelity workspace tailored for designers, blending professional rigor with creative energy. It aims to evoke a sense of "premium craft" through a heavy, intentional visual language that prioritizes character over corporate neutrality.

The style is a sophisticated mix of **High-Contrast Bold** and **Tactile Modernism**. It deliberately avoids the generic "AI slop" aesthetic — two earlier local exploration passes that leaned on skewed system fonts and flat generic SVG blobs were rejected for exactly that reason (see `.memlog.md`) — by utilizing:

- **Chunky 3D Accents:** Soft-touch, matte 3D objects (bells, stars, abstract forms) that provide physical presence.
- **Collage Illustration:** Bespoke cut-out imagery mixed with geometric vectors to ground the digital experience in human art direction.
- **Graphic Depth:** Large radii and pill-shaped elements that create a friendly but authoritative interface.
- **Bilingual Context:** While the system is primarily in French, the visual grammar remains universal for a global design audience.

This direction applies to the entire product surface — the public Landing Page and the Workspace interior alike ([mockups/landing.html](mockups/landing.html)) — superseding the prototype's earlier strict monochrome register.

## Colors

The "Franc" palette utilizes highly saturated, distinct hues assigned to specific functional domains to aid navigation and semantic recognition — not decorative variety for its own sake.

- **Violet ({colors.franc-violet}):** Reserved for Intelligence Artificielle (IA) and core logic processing — the IA tab, the assistant, prompt hand-off surfaces.
- **Green ({colors.franc-green}):** Assigned to Outils (Tools) and utility-based actions — the "Disponible" tool group, confirmations, joined-waitlist states.
- **Coral ({colors.franc-coral}):** Used for social elements, notifications, and urgent creative alerts — the "Bientôt disponible" tool group, badges.
- **Pink ({colors.franc-pink}):** Dedicated to creative assets and styling modules.
- **Blue ({colors.franc-blue}):** System-level information and data visualization.

The base uses a warm off-white ({colors.surface}, `#FBF9F4`) to reduce eye strain during long design sessions, while near-black ({colors.on-surface}) is used for impactful typography and primary CTA containers.

**Text-on-franc-color contrast (WCAG AA, computed):** white text fails 4.5:1 against every franc color at full saturation (best case is {colors.franc-violet} at 4.20:1, still short). The rule: text on a solid franc-color fill is {colors.on-surface} (near-black), not white — this passes AA on green (5.98:1), coral (6.69:1), pink (5.51:1), and blue (9.46:1). {colors.franc-violet} fails AA with *either* white or near-black text at body-copy sizes (4.20:1 / 4.09:1) — for a solid-violet fill needing white text (e.g. a primary AI-context CTA), use {colors.primary} (`#5b3cdd`, a deliberately darker violet) instead of {colors.franc-violet}; it passes at 6.70:1. {colors.franc-violet} itself is reserved for accents, icons, and borders — not as a solid fill behind body-weight text.

## Typography

The typography strategy focuses on a high-contrast relationship between display and utility text.

- **Headlines:** Use *Bricolage Grotesque* ({typography.display-xl.fontFamily}) for its quirky, expressive personality, at heavy weights (Bold/ExtraBold) with tight tracking. This is the deliberate, considered display treatment the earlier rejected local attempts (faked skew/condensed system fonts) failed to deliver.
- **UI & Body:** *Hanken Grotesk* ({typography.body-md.fontFamily}) provides a sharp, contemporary sans-serif experience that stays legible in dense workspace layouts.
- **Technical Labels:** *JetBrains Mono* ({typography.label-caps.fontFamily}) is used for metadata, AI parameters, and technical status updates to reinforce the workspace/tool feeling.

French grammar (accents and ligatures) must be checked carefully — the display font's character shouldn't interfere with the readability of characters like 'Ç' or 'Ê'.

## Layout & Spacing

This design system uses a **Fluid-Fixed Hybrid Grid**. The workspace canvas is fluid to accommodate creative tools, but individual cards and panels follow a strict internal rhythm based on an {spacing.base} baseline.

- **Desktop:** 12-column grid with {spacing.container-margin} margins. Content is organized into "bento-style" modules.
- **Mobile:** 4-column grid with 16px margins. Stacked layout with horizontal carousels for category navigation — see [mockups/ia-mobile.html](mockups/ia-mobile.html) for the responsive companion to the desktop IA tab.
- **Spacing Rhythm:** Use large padding ({spacing.section-padding}+) for section breaks to maintain the premium, breathable aesthetic. Avoid clutter; if a module is important, it should carry significant visual weight.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering** and **Chunky Shadows** rather than traditional elevation.

1. **Base Layer:** The warm neutral background ({colors.surface}).
2. **Surface Layer:** High-contrast containers (solid white or near-black) with no blur.
3. **Accent Depth:** 3D elements use a custom soft-drop shadow (color-tinted, 15% opacity, 30px blur) to appear as if floating slightly above the UI.
4. **Active State:** Elements use a "pressed" effect where the shadow disappears, mimicking a physical button being pushed into the surface.

Avoid semi-transparent layers or blurs; the design should feel solid, opaque, and definitive.

## Shapes

The shape language is defined by **High Circularity**.

- **Primary Cards:** Use a {rounded.xl} radius to create a soft, friendly containment for complex information.
- **Buttons & Chips:** Always pill-shaped ({rounded.full}).
- **Images:** All photos and collage elements must have rounded corners or be contained within circular masks to maintain the visual "softness" of the brand.
- **Icons:** Thick (2px–2.5px) stroke weights with rounded caps and joins to match the typography's weight.

## Components

### Buttons & CTAs
- **Primary:** Near-black background with white text, pill-shaped ({rounded.full}), large internal horizontal padding (32px).
- **Secondary:** Functional-category color background (e.g. violet for AI actions) with high-contrast text.
- **Icon Button:** Circular container, typically housing a 24px thick-stroke icon.

### Cards (Bento Style)
- Background matches the card's functional category (e.g. a green-tinted card for tools).
- Content is left-aligned with a minimum of 24px internal padding.
- Card titles use the display font ({typography.headline-lg.fontFamily}) to maintain the energetic vibe — see the Modules course cards in [mockups/modules.html](mockups/modules.html).

### Input Fields
- Heavy 2px borders when focused.
- Labels use *JetBrains Mono* in all caps for a professional, "configured" look.
- Rounded-lg (16px) corners for text entries.

### Tool card (Outils)
- **Disponible variant:** functional-color fill (green family per Colors), primary pill CTA that launches the tool inline — no navigation away. Category icon top-left, title in the display font.
- **Bientôt disponible variant:** lower-contrast/lighter fill of the same green family (or {colors.surface-container} neutral) to visually recede behind live tools, coral "Bientôt disponible" badge, waitlist pill CTA. On join, the CTA swaps to a filled/checked state ("Sur la liste ✓") and becomes visually inert (reduced opacity, no hover affordance).
- Both variants share the {rounded.xl} card radius and 24px internal padding from the Cards (Bento Style) spec.

### Chips & Badges
- Floating pills used for tagging categories (e.g. "Nouveau", "Bêta") and tool status (e.g. "Bientôt disponible").
- High-saturation backgrounds with {colors.on-surface} (near-black) text — not white — per the Text-on-franc-color contrast rule in Colors. This keeps the "pop" against the off-white UI while passing WCAG AA.

### Navigation
- Mobile: a floating pill-shaped "Dock" bottom navigation, near-black container with white icons — see [mockups/ia-mobile.html](mockups/ia-mobile.html).
- Desktop: a persistent left-hand sidebar with generous icon spacing — see [mockups/ia-desktop.html](mockups/ia-desktop.html), [mockups/modules.html](mockups/modules.html), [mockups/outils.html](mockups/outils.html).

### AI Prompt Hand-off Card (IA tab)
- Visually distinct from ordinary chat bubbles: a near-black card, not a bubble, containing the copyable generation-prompt text plus a labeled "Prompt prêt" header and a primary "Envoyer au Générateur" pill CTA.
- A persistent "Assistant IA" label chip sits above the conversation at all times (AI-disclosure requirement — see EXPERIENCE.md Accessibility & Compliance).

## Visual References

Key-screen mockups produced by Google Stitch from this spec, saved alongside this file:

- [mockups/landing.html](mockups/landing.html) · [mockups/landing.png](mockups/landing.png) — public Landing Page
- [mockups/modules.html](mockups/modules.html) · [mockups/modules.png](mockups/modules.png) — Workspace, Modules tab
- [mockups/ia-desktop.html](mockups/ia-desktop.html) · [mockups/ia-desktop.png](mockups/ia-desktop.png) — Workspace, IA tab (prompt hand-off moment)
- [mockups/outils.html](mockups/outils.html) · [mockups/outils.png](mockups/outils.png) — Workspace, Outils tab (Disponible / Bientôt disponible)
- [mockups/ia-mobile.html](mockups/ia-mobile.html) · [mockups/ia-mobile.png](mockups/ia-mobile.png) — Workspace, IA tab, mobile/responsive companion

This mock set is the product of record for this visual direction (Stitch project "Vibe Hub Design System"). Two earlier local HTML exploration passes (`.working/direction-*.html`) were rejected during Discovery and are kept only as a record of what was tried — they do not represent the final direction.
