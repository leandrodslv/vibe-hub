import { ArrowRight, PlayCircle } from 'lucide-react';
import heroCollage from '../../assets/landing/hero-collage.png';
import { appHref, MENTION_NOUVEL_ONGLET, NOUVEL_ONGLET } from '../../lib/routes';

// Builds a smooth, rounded text-shadow outline (concentric rings of offsets)
// so the sticker border hugs the letterforms without the sharp/jagged corners
// a single thick text-stroke produces.
function buildStickerOutline(radius, color) {
  const shadows = [];
  for (let r = radius; r >= 1; r--) {
    const steps = Math.max(8, Math.round(r * 4));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      shadows.push(
        `${(r * Math.cos(angle)).toFixed(2)}px ${(r * Math.sin(angle)).toFixed(2)}px 0 ${color}`
      );
    }
  }
  return shadows.join(', ');
}

const STICKER_OUTLINE = buildStickerOutline(6, '#ffffff');

// Rendu en <section> et non en <header> : ce bloc est la première section de contenu, pas la
// bannière du site — un <header> de premier niveau créait un landmark `banner` en double avec la nav.
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-titre"
      className="px-container-margin py-section-padding md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 bg-surface"
    >
      <div className="flex-1 space-y-8">
        <h1
          id="hero-titre"
          className="font-display-xl text-display-xl md:text-[80px] leading-tight text-on-surface"
        >
          L&apos;IA dans votre workflow créatif.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
          Vibe Hub fusionne des modules de formation, un assistant IA et un générateur
          d&apos;interfaces. Découvrez les outils que votre équipe design a déjà à sa disposition.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <a
            href={appHref()}
            {...NOUVEL_ONGLET}
            className="bg-on-surface text-surface font-cta-pill text-cta-pill px-8 py-4 rounded-full hover:scale-105 transition-transform chunky-shadow chunky-shadow-pressed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Découvrir Vibe Hub
            <span className="sr-only">{MENTION_NOUVEL_ONGLET}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="#programme"
            className="bg-surface-container text-on-surface font-cta-pill text-cta-pill px-8 py-4 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Voir le programme
            <PlayCircle className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/*
        Hero visual — the approved brand illustration from the Stitch design system
        (mockups/landing.html), not a screenshot of live app UI or a stock photo of an
        unrelated company/person. This is a legitimate decorative design asset shipped as
        part of the approved deliverable, distinct from FR-1's "no fabricated screenshot/
        stock imagery" concern (which targets fake app-UI mockups and generic stock photography,
        not this brand's own commissioned illustration).
        A real product screenshot (Modules/IA/Outils or UI Builder output) is still a separate
        open item — see Dev Notes/Completion Notes for the "Aperçu produit" note that used to
        live here before this illustration was restored.
      */}
      <div className="flex-1 w-full relative h-[420px] md:h-[500px] rounded-3xl p-6 flex items-center justify-center">
        <div className="absolute top-10 right-10 w-24 h-24 bg-primary rounded-full opacity-80 blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-primary-container rounded-full opacity-80 blur-2xl animate-pulse [animation-delay:700ms]"></div>

        <div className="relative z-10 w-full max-w-md h-full rotate-2 hover:rotate-0 transition-transform duration-500">
          <img
            src={heroCollage}
            alt="Illustration de la marque Vibe Hub"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Floating UI Stickers — the white outline is a ring of concentric text-shadows,
            so it hugs the letterforms with smooth, rounded corners (not a bounding box),
            and the lift shadow is a drop-shadow filter that follows that same silhouette. */}
        <div
          className="absolute top-1/4 left-1 md:-left-6 z-20 -rotate-6"
          style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))' }}
        >
          <p
            className="font-display-xl font-extrabold leading-tight text-lg text-black whitespace-nowrap"
            style={{ textShadow: STICKER_OUTLINE }}
          >
            IA ASSISTANT
          </p>
          <p
            className="font-display-xl font-extrabold leading-tight text-lg text-black whitespace-nowrap"
            style={{ textShadow: STICKER_OUTLINE }}
          >
            Prompt structuré
          </p>
        </div>
        <div
          className="absolute bottom-1/4 right-12 z-20 rotate-3"
          style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))' }}
        >
          <p
            lang="en"
            className="font-display-xl font-extrabold leading-tight text-lg text-black whitespace-nowrap"
            style={{ textShadow: STICKER_OUTLINE }}
          >
            UI BUILDER
          </p>
          <p
            className="font-display-xl font-extrabold leading-tight text-lg text-black whitespace-nowrap"
            style={{ textShadow: STICKER_OUTLINE }}
          >
            Code généré
          </p>
        </div>
      </div>
    </section>
  );
}
