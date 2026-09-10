// Note: the Stitch reference mockup (mockups/landing.html) shows this strip with fabricated
// company wordmarks (AcmeStudio, GlobalArt...) as pre-rollout "social proof". The PRD explicitly
// rules that out (no fabricated testimonials/adopters before a first real rollout) — this keeps
// the mockup's visual treatment (centered label, bold wordmark row, grayscale/hover reveal) but
// swaps the content for the product's real capabilities instead of fictional customers.
const capabilities = ['Formation IA', 'Assistant IA', 'UI Builder', 'Apprentissage continu'];

export default function SocialProof() {
  return (
    <section aria-labelledby="capacites-titre" className="py-12 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-container-margin">
        {/* Titre balisé en <h2> (et non en <p>) : il introduit bien une rubrique de la page. */}
        <h2
          id="capacites-titre"
          className="text-center font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-8"
        >
          Ce que vous trouverez dès aujourd&apos;hui
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {capabilities.map((label) => (
            <span
              key={label}
              className="font-display-lg text-[32px] font-extrabold text-on-surface"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
