import { ChevronRight } from 'lucide-react';

const TABS = ['IA', 'Modules', 'Outils'];

export default function TopBar({ activeTab, onTabChange, onBack }) {
  return (
    <div className="h-14 border-b border-[#EAEAEA] bg-white flex items-center justify-between px-6 z-20 flex-shrink-0">
      <button
        onClick={onBack}
        className="flex w-32 items-center text-sm font-semibold text-[#666666] hover:text-black transition-colors"
      >
        <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Retour au site
      </button>

      <div className="flex items-center bg-[#F4F4F4] p-1 rounded-full gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab.toLowerCase())}
            className={`px-6 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${
              activeTab === tab.toLowerCase()
                ? 'bg-white shadow-sm text-black'
                : 'text-[#666666] hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="w-32 text-right">
        <span className="text-xs font-bold uppercase tracking-widest text-[#999999]">Workspace Beta</span>
      </div>
    </div>
  );
}
