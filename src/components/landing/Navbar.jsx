import { ArrowRight } from 'lucide-react';

export default function Navbar({ onEnterApp }) {
  return (
    <nav className="sticky top-0 w-full bg-surface z-50 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-container-margin h-20 flex items-center justify-between">
        {/* Logo */}
        <span className="font-display-lg text-display-lg font-extrabold tracking-tight text-on-surface">vibe hub</span>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#top"
            className="font-body-md font-bold text-primary border-b-4 border-primary pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Accueil
          </a>
          <a
            href="#modules-showcase"
            className="font-body-md text-on-surface-variant hover:text-primary hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded"
          >
            Modules
          </a>
          <a
            href="#outils-showcase"
            className="font-body-md text-on-surface-variant hover:text-primary hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded"
          >
            Outils
          </a>
        </div>

        <div className="flex items-center gap-4">
          {/*
            Decorative chrome icons from the mockup (notifications/settings), using the same
            Material Symbols Outlined glyphs as mockups/landing.html (FILL:1) rather than a
            lucide-react approximation. Non-functional here — there is no notification system or
            settings surface on the unauthenticated public Landing Page (no auth in v1 per FR-1).
            Marked aria-hidden since they don't do anything yet.
          */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="hidden md:flex w-10 h-10 rounded-full bg-surface-container items-center justify-center text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              notifications
            </span>
          </button>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="hidden md:flex w-10 h-10 rounded-full bg-surface-container items-center justify-center text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              settings
            </span>
          </button>

          {/* CTA */}
          <button
            onClick={onEnterApp}
            className="hidden md:flex items-center gap-2 bg-primary text-on-primary font-cta-pill text-cta-pill px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors chunky-shadow chunky-shadow-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Découvrir Vibe Hub
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
