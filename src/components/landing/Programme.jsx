import { useEffect } from 'react';
import { PenTool, Network, Sparkles, ChevronRight } from 'lucide-react';

const modules = [
  {
    icon: PenTool,
    title: 'UI & Midjourney',
    desc: "Générez des directions artistiques, des textures et des moodboards haute-fidélité en quelques secondes.",
  },
  {
    icon: Network,
    title: 'UX & ChatGPT',
    desc: "Automatisez vos user stories, analysez vos interviews utilisateurs et structurez vos architectures de l'information.",
  },
  {
    icon: Sparkles,
    title: 'Figma AI Agents',
    desc: "Maîtrisez les nouveaux plugins IA pour créer des systèmes de design entiers à partir de simples prompts.",
  },
];

export default function Programme({ onEnterModules }) {
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
    <section id="programme" className="py-32 px-6 bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">L'écosystème AI.</h2>
          <p className="text-xl text-[#666666] font-normal">Des modules précis pour un impact maximum.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal opacity-0 translate-y-12 transition-all duration-1000 delay-200 ease-out">
          {modules.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-white border border-[#EAEAEA] rounded-2xl p-10 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:border-[#D4D4D4] transition-all duration-300"
            >
              <div className="w-14 h-14 bg-[#F4F4F4] rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-300">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">{title}</h3>
              <p className="text-[#666666] leading-relaxed mb-8">{desc}</p>
              <button
                onClick={onEnterModules}
                className="flex items-center text-[15px] font-semibold text-black group-hover:translate-x-2 transition-transform cursor-pointer w-fit"
              >
                Découvrir <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
