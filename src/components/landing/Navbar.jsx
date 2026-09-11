import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { appHref, MENTION_NOUVEL_ONGLET, NOUVEL_ONGLET } from '../../lib/routes';

const LINKS = [
  { href: '#top', label: 'Accueil' },
  { href: '#modules-showcase', label: 'Modules' },
  { href: '#outils-showcase', label: 'Outils' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState(LINKS[0].href);

  return (
    <nav
      aria-label="Navigation principale"
      className="sticky top-0 w-full bg-surface z-50 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
    >
      <div className="max-w-7xl mx-auto px-container-margin h-20 flex items-center justify-between">
        {/* Logo */}
        <span className="font-display-lg text-display-lg font-extrabold tracking-tight text-on-surface">
          vibe hub
        </span>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center gap-6">
          {LINKS.map(({ href, label }) => {
            const current = activeHref === href;
            return (
              <a
                key={href}
                href={href}
                onClick={() => setActiveHref(href)}
                aria-current={current ? 'page' : undefined}
                className={`inline-flex items-center min-h-[44px] px-2 font-body-md rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  current
                    ? 'font-bold text-primary border-b-4 border-primary rounded-none'
                    : 'text-on-surface-variant hover:text-primary hover:scale-105 transition-transform'
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications ouvre le centre de notifications du logiciel (nouvel onglet, comme
              le CTA principal) : ce n'est plus décoratif. Réglages reste un chrome décoratif —
              il n'y a pas d'écran de profil/réglages sur la Landing publique (pas d'auth en v1). */}
          <a
            href={appHref('notifications')}
            {...NOUVEL_ONGLET}
            aria-label={`Notifications${MENTION_NOUVEL_ONGLET}`}
            className="hidden md:flex w-10 h-10 rounded-full bg-surface-container items-center justify-center text-on-surface hover:bg-surface-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              aria-hidden="true"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              notifications
            </span>
          </a>
          <span
            aria-hidden="true"
            className="hidden md:flex w-10 h-10 rounded-full bg-surface-container items-center justify-center text-on-surface"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              settings
            </span>
          </span>

          {/* CTA — desktop */}
          <a
            href={appHref()}
            {...NOUVEL_ONGLET}
            className="hidden md:flex items-center gap-2 min-h-[44px] bg-primary text-on-primary font-cta-pill text-cta-pill px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors chunky-shadow chunky-shadow-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Découvrir Vibe Hub
            <span className="sr-only">{MENTION_NOUVEL_ONGLET}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>

          {/* Déclencheur du menu — mobile */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="menu-mobile"
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full bg-surface-container text-on-surface hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
            <span className="sr-only">{isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
          </button>
        </div>
      </div>

      {/* Panneau — mobile. Les liens et le CTA étaient auparavant en `hidden md:flex` sans
          remplacement : sous 768px la navigation principale disparaissait entièrement. */}
      {isMenuOpen && (
        <div
          id="menu-mobile"
          className="md:hidden border-t border-surface-container-high bg-surface px-container-margin py-4"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map(({ href, label }) => {
              const current = activeHref === href;
              return (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => {
                      setActiveHref(href);
                      setIsMenuOpen(false);
                    }}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center min-h-[44px] px-3 rounded-lg font-body-md hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                      current ? 'font-bold text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href={appHref()}
            {...NOUVEL_ONGLET}
            onClick={() => setIsMenuOpen(false)}
            className="mt-3 w-full flex items-center justify-center gap-2 min-h-[44px] bg-primary text-on-primary font-cta-pill text-cta-pill px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors chunky-shadow chunky-shadow-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Découvrir Vibe Hub
            <span className="sr-only">{MENTION_NOUVEL_ONGLET}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </nav>
  );
}
