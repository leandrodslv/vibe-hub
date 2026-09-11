import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import SocialProof from '../components/landing/SocialProof';
import Programme from '../components/landing/Programme';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';

// La landing ne pilote plus le logiciel : ses CTA sont de simples liens vers `/app`, qui
// s'ouvre dans un nouvel onglet. Aucune prop de navigation à faire descendre.
export default function LandingPage() {
  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-12');
            entry.target.classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id="top"
      className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-primary selection:text-on-primary"
    >
      {/* Lien d'évitement (RGAA 12.7) — masqué visuellement, révélé à la prise de focus clavier. */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-on-primary focus:font-cta-pill focus:text-cta-pill focus:px-6 focus:py-4 focus:rounded-full focus:outline-none focus:ring-2 focus:ring-on-surface focus:ring-offset-2"
      >
        Aller au contenu principal
      </a>

      <Navbar />

      <main id="contenu">
        <Hero />
        <SocialProof />
        <Programme />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
