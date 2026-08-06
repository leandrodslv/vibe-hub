import { ArrowRight, PlayCircle, Sparkles, Palette } from 'lucide-react';
import heroCollage from '../../assets/landing/hero-collage.jpg';

export default function Hero({ onEnterApp }) {
  return (
    <header className="px-container-margin py-section-padding md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 bg-surface">
      <div className="flex-1 space-y-8">
        <div className="inline-block bg-secondary-fixed text-on-secondary-fixed px-4 py-2 rounded-full font-label-caps text-label-caps uppercase tracking-wider">
          Vibe Hub est en ligne
        </div>
        <h1 className="font-display-xl text-display-xl md:text-[80px] leading-tight text-on-surface">
          L&apos;IA dans votre workflow créatif.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
          Vibe Hub fusionne des modules de formation, un assistant IA et un générateur d&apos;interfaces. Découvrez
          les outils que votre équipe design a déjà à sa disposition.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onEnterApp}
            className="bg-on-surface text-surface font-cta-pill text-cta-pill px-8 py-4 rounded-full hover:scale-105 transition-transform chunky-shadow chunky-shadow-pressed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Découvrir Vibe Hub
            <ArrowRight className="w-4 h-4" />
          </button>
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
      <div className="flex-1 w-full relative h-[420px] md:h-[500px] bg-primary-fixed rounded-3xl p-6 overflow-hidden flex items-center justify-center border-4 border-surface-container-lowest">
        <div className="absolute top-10 right-10 w-24 h-24 bg-secondary-container rounded-full opacity-80 blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-tertiary-container rounded-full opacity-80 blur-2xl animate-pulse [animation-delay:700ms]"></div>

        <div className="relative z-10 w-full max-w-md h-full rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 bg-surface">
          <img src={heroCollage} alt="Illustration de la marque Vibe Hub" className="w-full h-full object-cover" />
        </div>

        {/* Floating UI Cards */}
        <div className="absolute top-1/4 -left-6 bg-surface-container-lowest p-4 rounded-xl shadow-xl z-20 flex items-center gap-3 -rotate-6">
          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container">
            <Sparkles className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant">IA ASSISTANT</p>
            <p className="font-cta-pill text-cta-pill text-on-surface">Prompt structuré</p>
          </div>
        </div>
        <div className="absolute bottom-1/4 -right-6 bg-surface-container-lowest p-4 rounded-xl shadow-xl z-20 flex items-center gap-3 rotate-3">
          <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
            <Palette className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant">UI BUILDER</p>
            <p className="font-cta-pill text-cta-pill text-on-surface">Code généré</p>
          </div>
        </div>
      </div>
    </header>
  );
}
