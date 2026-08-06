import { useEffect } from 'react';
import { LayoutGrid, Wand2, ArrowRight } from 'lucide-react';
import assistantIaImage from '../../assets/landing/assistant-ia.jpg';

export default function Programme({ onEnterApp }) {
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
    <section id="programme" className="py-section-padding px-container-margin max-w-7xl mx-auto">
      <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-center mb-16 max-w-2xl mx-auto text-on-surface reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        Des outils pensés pour les designers, propulsés par l&apos;intelligence.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter reveal opacity-0 translate-y-12 transition-all duration-1000 delay-200 ease-out">
        {/* Assistant IA */}
        <div className="md:col-span-8 bg-tertiary-fixed rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 max-w-md">
            <div className="inline-block bg-surface-container-lowest text-on-tertiary-fixed-variant px-3 py-1 rounded-full font-label-caps text-label-caps mb-4">
              Assistant IA
            </div>
            <h3 className="font-display-lg text-[36px] text-on-tertiary-fixed mb-4">
              Votre co-pilote créatif toujours disponible.
            </h3>
            <p className="font-body-md text-body-md text-on-tertiary-fixed-variant mb-6">
              Décrivez une idée de design en langage naturel et recevez un prompt structuré, prêt à générer.
            </p>
            <button
              onClick={onEnterApp}
              className="bg-on-tertiary-fixed text-tertiary-fixed font-cta-pill text-cta-pill px-6 py-3 rounded-full hover:scale-105 transition-transform flex items-center gap-2 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Découvrir l&apos;IA
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* Approved brand illustration from the Stitch design system (mockups/landing.html) */}
          <div className="absolute right-0 bottom-0 w-2/3 h-2/3 translate-x-1/4 translate-y-1/4 group-hover:translate-x-[15%] transition-transform duration-700 rounded-tl-[100px] overflow-hidden">
            <img
              src={assistantIaImage}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Modules */}
        <div
          id="modules-showcase"
          className="md:col-span-4 bg-primary-container rounded-3xl p-8 flex flex-col relative overflow-hidden text-on-primary-container scroll-mt-24"
        >
          <div className="inline-block bg-surface-container-lowest text-primary px-3 py-1 rounded-full font-label-caps text-label-caps mb-4 w-fit">
            Modules
          </div>
          <h3 className="font-display-lg text-[28px] mb-4">Briques de formation.</h3>
          <p className="font-body-md text-body-md opacity-90 mb-8 flex-grow">
            Des modules pratiques pour intégrer l&apos;IA générative à votre flux de travail design.
          </p>
          <div className="space-y-3 mt-auto">
            <div className="bg-surface-container-lowest/20 p-3 rounded-lg backdrop-blur-sm flex items-center gap-3">
              <LayoutGrid className="w-4 h-4" strokeWidth={2.25} />
              <span className="font-label-caps text-label-caps">Catalogue de modules</span>
            </div>
          </div>
        </div>

        {/* UI Builder */}
        <div
          id="outils-showcase"
          className="md:col-span-12 bg-surface-container rounded-3xl p-8 flex flex-col md:flex-row items-center gap-12 overflow-hidden scroll-mt-24"
        >
          <div className="flex-1">
            <div className="inline-block bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-caps text-label-caps mb-4">
              UI Builder
            </div>
            <h3 className="font-display-lg text-[36px] text-on-surface mb-4">Assemblez plus vite, sans compromis.</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-lg">
              Envoyez un prompt structuré et récupérez du code React/Tailwind fonctionnel, rendu dans un aperçu
              sécurisé.
            </p>
          </div>
          <div className="flex-1 w-full relative">
            <div className="aspect-video bg-surface-container-lowest rounded-2xl shadow-xl border-2 border-outline-variant p-4 flex flex-col gap-4">
              <div className="w-full h-8 bg-surface-container rounded-md flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <div className="w-3 h-3 rounded-full bg-primary-fixed-dim"></div>
                <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim"></div>
              </div>
              <div className="flex-1 bg-surface-container-low rounded-lg relative overflow-hidden flex items-center justify-center border-2 border-dashed border-primary/50">
                <span className="font-label-caps text-label-caps text-primary bg-primary-fixed px-3 py-1 rounded-full flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5" />
                  Zone de génération
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
