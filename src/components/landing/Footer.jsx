export default function Footer() {
  return (
    <footer className="border-t border-[#EAEAEA] bg-[#F9F9F9] pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0 mb-16">
        <div>
          <span className="text-2xl font-extrabold tracking-tight block mb-4">vibe hub</span>
          <p className="text-[#666666] max-w-sm leading-relaxed text-[15px]">
            L'écosystème d'apprentissage IA exclusif pour les designers UI/UX. Redéfinissez votre flux de travail avec
            les outils de demain.
          </p>
        </div>

        <div className="flex gap-16 md:gap-24">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold tracking-tight text-black">Programme</h4>
            <a href="#" className="text-[#666666] hover:text-black transition-colors text-[15px]">UI & Midjourney</a>
            <a href="#" className="text-[#666666] hover:text-black transition-colors text-[15px]">UX & ChatGPT</a>
            <a href="#" className="text-[#666666] hover:text-black transition-colors text-[15px]">Figma AI Agents</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold tracking-tight text-black">Légal</h4>
            <a href="#" className="text-[#666666] hover:text-black transition-colors text-[15px]">Mentions Légales</a>
            <a href="#" className="text-[#666666] hover:text-black transition-colors text-[15px]">CGV</a>
            <a href="#" className="text-[#666666] hover:text-black transition-colors text-[15px]">Confidentialité</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#EAEAEA] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-[14px] text-[#999999] font-medium">
          © {new Date().getFullYear()} vibe hub. Tous droits réservés.
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-[#999999] hover:text-black transition-colors">
            <span className="sr-only">Twitter</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
          <a href="#" className="text-[#999999] hover:text-black transition-colors">
            <span className="sr-only">LinkedIn</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
