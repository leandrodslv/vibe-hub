import { ArrowRight, Sparkles, LayoutTemplate, MousePointer2 } from 'lucide-react';
import { useTypewriter } from '../../hooks/useTypewriter';

export default function Hero({ onEnterApp }) {
  const promptText = useTypewriter('"Génère un dashboard analytique minimaliste..."');

  return (
    <header className="relative pt-40 pb-20 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <h1 className="text-6xl md:text-[88px] leading-[1.05] font-extrabold tracking-tighter mb-8">
          Master AI <br /> for UI/UX.
        </h1>
        <p className="text-xl md:text-[22px] text-[#666666] max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          Formez-vous aux outils IA qui vont redéfinir votre flux de travail.
        </p>
        <button
          onClick={onEnterApp}
          className="inline-flex items-center justify-center bg-black text-white text-[16px] font-semibold px-8 py-4 rounded-lg hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 group"
        >
          Rejoindre la Beta
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Floating Dashboard Mockup */}
      <div className="mt-20 max-w-5xl mx-auto relative px-4 md:px-0 z-20">
        <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Window Header */}
          <div className="h-12 border-b border-[#EAEAEA] flex items-center px-5 space-x-2 bg-[#FDFDFD]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E5E5E5]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#E5E5E5]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#E5E5E5]"></div>
            <div className="flex-1 flex justify-center">
              <div className="w-48 h-5 bg-[#F4F4F4] rounded-md"></div>
            </div>
          </div>

          {/* Window Body */}
          <div className="flex flex-col md:flex-row h-[500px] bg-white">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-[#EAEAEA] p-6 flex-col gap-4 hidden md:flex bg-[#FAFAFA]/50">
              <div className="w-full h-8 bg-[#F4F4F4] rounded-md mb-4"></div>
              <div className="w-3/4 h-4 bg-[#EAEAEA] rounded"></div>
              <div className="w-1/2 h-4 bg-[#EAEAEA] rounded mb-6"></div>
              <div className="w-full h-24 border border-dashed border-[#D4D4D4] rounded-lg bg-[#F9F9F9] flex items-center justify-center">
                <LayoutTemplate className="text-[#CCCCCC] w-6 h-6" />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 flex flex-col justify-between relative bg-white">
              <div className="absolute top-8 right-8 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center opacity-50 animate-mouse z-20 shadow-sm">
                <MousePointer2 className="w-5 h-5 text-blue-500" />
              </div>

              <div className="flex gap-6 mt-4">
                <div className="flex-1 h-48 bg-[#F4F4F4] rounded-xl border border-[#EAEAEA] p-4 flex flex-col gap-3 relative overflow-hidden">
                  <div className="w-1/3 h-4 bg-white rounded shadow-sm"></div>
                  <div className="w-full h-20 bg-white rounded shadow-sm mt-auto"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent"></div>
                </div>
                <div className="flex-1 h-48 bg-black/5 rounded-xl border border-[#EAEAEA] p-4 flex items-center justify-center border-dashed">
                  <span className="text-[#999999] text-sm font-medium">Generating Component...</span>
                </div>
              </div>

              {/* AI Prompt Bar */}
              <div className="w-full max-w-2xl mx-auto h-16 bg-white rounded-xl border border-[#EAEAEA] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.06)] flex items-center px-6 mt-8 relative z-10 group hover:border-[#CCCCCC] transition-colors">
                <Sparkles className="w-5 h-5 text-black" />
                <span className="text-[#999999] ml-4 text-[15px] flex-1 font-medium">
                  {promptText}
                  <span className="inline-block w-0.5 h-4 bg-black ml-1 animate-pulse align-middle"></span>
                </span>
                <div className="w-8 h-8 bg-[#F4F4F4] rounded-md flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors cursor-pointer">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
