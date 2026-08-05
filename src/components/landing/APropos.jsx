export default function APropos() {
  return (
    <section id="apropos" className="py-32 px-6 bg-white border-t border-[#EAEAEA]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden flex-shrink-0 border border-[#EAEAEA] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative group">
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
            alt="Portrait de l'instructeur"
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
          />
        </div>
        <div>
          <span className="text-[13px] font-semibold text-[#888888] uppercase tracking-widest mb-3 block">
            À propos
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Julien D.</h2>
          <h3 className="text-xl text-[#666666] mb-6 font-medium">Lead Product Designer & AI Explorer</h3>
          <p className="text-[#666666] text-lg leading-relaxed max-w-2xl">
            Avec plus de 10 ans d'expérience en conception d'interfaces, j'ai passé la dernière année à intégrer
            l'intelligence artificielle au cœur de mes flux de travail. Mon but avec <b>Vibe Hub</b> : vous aider à
            décupler votre productivité de designer sans compromettre votre créativité.
          </p>
        </div>
      </div>
    </section>
  );
}
