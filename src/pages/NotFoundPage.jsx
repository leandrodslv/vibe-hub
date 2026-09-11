import { ArrowRight } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import illustration404 from '../assets/404/illustration-404.png';
import { ROUTES } from '../lib/routes';

// Route de secours : toute URL qui ne correspond à aucune route connue (`/`, `/app`, `/admin`)
// atterrit ici. Le rewrite Vercel (cf. vercel.json) sert `index.html` pour ces chemins avec un
// statut 200 — la résolution 404 se fait donc côté client, dans `currentRoute()`.
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-primary selection:text-on-primary">
      <Navbar />

      <main className="px-container-margin py-section-padding max-w-5xl mx-auto flex flex-col items-center text-center">
        <img
          src={illustration404}
          alt=""
          aria-hidden="true"
          className="w-full max-w-2xl h-auto object-contain pointer-events-none mb-8"
        />

        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4 max-w-2xl uppercase">
          Oups&nbsp;! Cette page s&apos;est perdue dans le workflow
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-10">
          Il semble que vous ayez pris un mauvais chemin créatif. L&apos;assistant IA n&apos;a pas
          pu générer cette route.
        </p>

        <a
          href={ROUTES.landing}
          className="inline-flex items-center gap-2 min-h-[44px] bg-primary text-on-primary font-cta-pill text-cta-pill px-8 py-4 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors chunky-shadow chunky-shadow-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Retour à l&apos;accueil
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </main>
    </div>
  );
}
