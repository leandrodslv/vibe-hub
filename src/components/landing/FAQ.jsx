import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Content matches the Stitch reference mockup (mockups/landing.html) rather than the legacy
// `FAQS` export in src/data/courses.js, which asks about a paid external course ("Combien de
// temps dure la formation ?", ChatGPT Plus/Midjourney subscriptions) — that no longer reflects
// Vibe Hub as an internal AI workspace tool (FR-1, PRD §4.1).
const FAQS = [
  {
    question: "Comment l'IA s'intègre-t-elle à mon style existant ?",
    answer:
      'Vibe Hub analyse vos tokens de design (couleurs, typographie, espacements) et s’assure que chaque composant généré ou suggéré respecte scrupuleusement votre identité visuelle. Il ne remplace pas votre style, il l’applique à grande échelle.',
  },
  {
    question: 'Puis-je exporter le code généré ?',
    answer:
      'Absolument. Tout ce que vous construisez avec UI Builder peut être exporté en React/Tailwind propre, prêt pour la production.',
  },
  {
    question: "L'accès est-il ouvert à toute l'équipe ?",
    answer:
      "Vibe Hub est disponible dès maintenant pour l'équipe design, sans compte à créer. La gestion du contenu des modules reste réservée à l'équipe produit via l'Admin.",
  },
];

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section id="faq" aria-labelledby="faq-titre" className="py-section-padding bg-surface">
      <div className="max-w-3xl mx-auto px-container-margin reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <h2
          id="faq-titre"
          className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-center mb-12 text-on-surface"
        >
          Questions fréquentes
        </h2>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-surface-container-lowest rounded-2xl border-2 border-surface-variant overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between gap-1.5 p-6 text-on-surface font-cta-pill text-cta-pill text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  {faq.question}
                  <span
                    className={`shrink-0 rounded-full bg-surface-container p-2 text-on-surface transition-transform duration-300 ${
                      isOpen ? '-rotate-180' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
