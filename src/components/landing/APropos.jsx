export default function APropos() {
  return (
    <section
      id="apropos"
      className="py-32 px-6 bg-surface-container-lowest border-t border-surface-container-high"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden flex-shrink-0 border border-surface-container-high shadow-[0_20px_40px_-15px_rgba(28,27,27,0.12)] relative group">
          <div className="absolute inset-0 bg-on-surface/5 group-hover:bg-transparent transition-colors z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
            alt="Portrait de l'instructeur"
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
          />
        </div>
        <div>
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3 block">
            À propos
          </span>
          <h2 className="font-display-lg text-3xl md:text-4xl tracking-tight mb-4 text-on-surface">
            Julien D.
          </h2>
          <h3 className="font-body-lg text-xl text-on-surface-variant mb-6 font-medium">
            Lead Product Designer & AI Explorer
          </h3>
          <p className="font-body-lg text-on-surface-variant text-lg leading-relaxed max-w-2xl">
            Avec plus de 10 ans d&apos;expérience en conception d&apos;interfaces, j&apos;ai passé
            la dernière année à intégrer l&apos;intelligence artificielle au cœur de mes flux de
            travail. Mon but avec <b className="text-on-surface">Vibe Hub</b> : vous aider à
            décupler votre productivité de designer sans compromettre votre créativité.
          </p>
        </div>
      </div>
    </section>
  );
}
