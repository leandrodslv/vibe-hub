export default function SocialProof() {
  return (
    <section className="border-y border-[#EAEAEA] py-10 bg-white">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <span className="text-[13px] font-semibold text-[#888888] uppercase tracking-widest">
          Approuvé par les designers de
        </span>
        <div className="flex items-center gap-12 opacity-40 grayscale">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-6 h-6 rounded bg-black"></div> ACME Corp
          </div>
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-6 h-6 rounded-full border-4 border-black"></div> Globex
          </div>
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-6 h-6 rotate-45 bg-black"></div> Hooli
          </div>
          <div className="hidden md:flex items-center gap-2 font-bold text-xl">
            <div className="flex gap-1">
              <div className="w-2 h-6 bg-black" />
              <div className="w-2 h-6 bg-black" />
            </div>{' '}
            Initech
          </div>
        </div>
      </div>
    </section>
  );
}
