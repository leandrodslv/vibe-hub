import { ChevronRight } from 'lucide-react';

export default function Navbar({ onEnterApp }) {
  return (
    <nav className="fixed top-0 w-full bg-[#F9F9F9]/80 backdrop-blur-md z-50 border-b border-[#EAEAEA]/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-xl font-extrabold tracking-tight">vibe hub</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-8">
          <a href="#programme" className="text-[15px] font-medium text-[#666666] hover:text-black transition-colors">
            Programme
          </a>
          <a href="#apropos" className="text-[15px] font-medium text-[#666666] hover:text-black transition-colors">
            À propos
          </a>
          <a href="#faq" className="text-[15px] font-medium text-[#666666] hover:text-black transition-colors">
            FAQ
          </a>
        </div>

        {/* CTA */}
        <button
          onClick={onEnterApp}
          className="bg-black text-white text-[14px] font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 hover:scale-[1.02] transition-all active:scale-95"
        >
          Accès Beta
        </button>
      </div>
    </nav>
  );
}
