import { useState, useDeferredValue, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles, ArrowRight, Network, LayoutTemplate, ShieldCheck,
  PenTool, Palette, Eye, ChevronLeft, Search, X, Zap, Bell, Check, Mail,
  Accessibility, ScanSearch, Wand2, AlertTriangle
} from 'lucide-react';
import { addToWaitlist } from '../../../services/supabase';

const TOOLS = [
  {
    id: 'ui-builder',
    name: 'UI Builder',
    description: 'Générez des interfaces React/Tailwind complètes à partir de simples prompts.',
    icon: LayoutTemplate,
    gradient: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/20',
    tags: ['Design', 'Code'],
    status: 'live',
    category: 'Design',
  },
  {
    id: 'code-auditor',
    name: 'Code Auditor',
    description: 'Analyse de bugs, sécurité et optimisation de performances pour votre code.',
    icon: ShieldCheck,
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
    tags: ['Dev', 'Sécurité'],
    status: 'coming',
    category: 'Dev',
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'Rédaction assistée par IA pour vos articles, newsletters et réseaux sociaux.',
    icon: PenTool,
    gradient: 'from-orange-500 to-rose-500',
    shadowColor: 'shadow-orange-500/20',
    tags: ['Texte', 'SEO'],
    status: 'coming',
    category: 'Texte',
  },
  {
    id: 'color-studio',
    name: 'Color Studio',
    description: 'Créez des thèmes et des palettes de couleurs harmonieuses pour vos projets.',
    icon: Palette,
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
    tags: ['Design', 'UX'],
    status: 'coming',
    category: 'Design',
  },
  {
    id: 'vision-lens',
    name: 'Vision Lens',
    description: "Analysez et extrayez des informations à partir d'images ou de captures d'écran.",
    icon: Eye,
    gradient: 'from-sky-500 to-blue-600',
    shadowColor: 'shadow-sky-500/20',
    tags: ['IA', 'Vision'],
    status: 'coming',
    category: 'IA',
  },
  {
    id: 'diagnostic-rgaa',
    name: 'Diagnostic RGAA',
    description: "Analysez l'accessibilité d'un code HTML/JSX : contraste, ARIA, clavier, lecteur d'écran — conforme RGAA 4.1 / WCAG 2.1 AA.",
    icon: Accessibility,
    gradient: 'from-cyan-500 to-teal-600',
    shadowColor: 'shadow-cyan-500/20',
    tags: ['A11y', 'RGAA'],
    status: 'live',
    category: 'Accessibilité',
  },
];

const CATEGORIES = ['Tous', 'Design', 'Dev', 'Texte', 'IA', 'Accessibilité'];

export default function OutilsTab({ initialPrompt }) {
  const [activeToolId, setActiveToolId] = useState(null);

  // Hand-off depuis l'Assistant IA : un prompt "envoyé au Générateur" ouvre directement l'UI Builder.
  useEffect(() => {
    if (initialPrompt) setActiveToolId('ui-builder');
  }, [initialPrompt]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  const deferredSearch = useDeferredValue(searchQuery);
  const activeTool = TOOLS.find(t => t.id === activeToolId);

  const filteredTools = TOOLS.filter(t => {
    const matchesSearch =
      !deferredSearch ||
      t.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(deferredSearch.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] rounded-2xl overflow-hidden border border-[#EAEAEA] shadow-sm">
      {!activeToolId ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* ─── Header ─── */}
          <div className="px-8 pt-7 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md bg-black flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">
                    VibeHub Tools
                  </span>
                </div>
                <h1 className="text-[22px] font-bold text-black leading-tight mb-1">
                  Bibliothèque d'Outils IA
                </h1>
                <p className="text-[#666] text-[13px]">
                  {TOOLS.length} outils spécialisés pour booster votre productivité.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-64 flex-shrink-0">
                <Search className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher un outil..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#EAEAEA] rounded-xl pl-10 pr-9 py-2.5 text-[13px] outline-none focus:border-black transition-all placeholder:text-[#999] text-black"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666] transition-colors cursor-pointer"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 border-b border-[#EAEAEA]">
              {CATEGORIES.map(cat => {
                const count = cat === 'Tous' ? TOOLS.length : TOOLS.filter(t => t.category === cat).length;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'border-black text-black'
                        : 'border-transparent text-[#666] hover:text-black'
                    }`}
                  >
                    {cat}
                    <span
                      className={`text-[10px] font-bold min-w-[16px] h-4 px-1 rounded flex items-center justify-center ${
                        isActive ? 'bg-black text-white' : 'bg-[#F4F4F4] text-[#999]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Grid ─── */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {filteredTools.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-14 h-14 bg-[#F4F4F4] rounded-2xl flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-[#999]" />
                </div>
                <p className="text-black font-semibold mb-1">Aucun outil trouvé</p>
                <p className="text-[#666] text-sm">Essayez un autre mot-clé ou catégorie.</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('Tous'); }}
                  className="mt-4 text-sm text-black font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => setActiveToolId(tool.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <ToolViewWrapper tool={activeTool} onBack={() => setActiveToolId(null)}>
          {activeToolId === 'ui-builder' ? (
            <UIBuilderView initialPrompt={initialPrompt} />
          ) : activeToolId === 'diagnostic-rgaa' ? (
            <DiagnosticRGAAView />
          ) : (
            <ComingSoonView tool={activeTool} onBack={() => setActiveToolId(null)} />
          )}
        </ToolViewWrapper>
      )}
    </div>
  );
}

/* ─── Tool Card ─── */
function ToolCard({ tool, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-[#EAEAEA] rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 hover:border-[#CCCCCC] flex flex-col h-full overflow-hidden cursor-pointer"
    >
      {tool.status === 'live' && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#F4F4F4] border border-[#EAEAEA] px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          <span className="text-[10px] font-bold text-black">Live</span>
        </div>
      )}

      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white mb-4 shadow-lg ${tool.shadowColor} group-hover:scale-105 transition-transform duration-300`}
      >
        <tool.icon className="w-5 h-5" />
      </div>

      <h3 className="text-[15px] font-bold text-black mb-1.5">{tool.name}</h3>
      <p className="text-[#666] text-[13px] leading-relaxed mb-5 flex-1">{tool.description}</p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {tool.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-bold uppercase tracking-wider text-[#999] bg-[#F4F4F4] px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="w-7 h-7 rounded-full bg-[#F4F4F4] group-hover:bg-black flex items-center justify-center transition-all duration-300 flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-[#999] group-hover:text-white transition-colors duration-300" />
        </div>
      </div>
    </button>
  );
}

/* ─── Tool View Shell ─── */
function ToolViewWrapper({ tool, onBack, children }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div
        className="flex items-center justify-between px-5 border-b border-[#EAEAEA] bg-white z-10 flex-shrink-0"
        style={{ height: '52px' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#666] hover:text-black font-semibold text-[13px] transition-colors bg-[#F4F4F4] hover:bg-[#EAEAEA] px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Bibliothèque
          </button>
          <div className="w-px h-5 bg-[#EAEAEA]" />
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-sm`}
            >
              <tool.icon className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-[13px] font-bold text-black">{tool.name}</h2>
          </div>
        </div>

        {tool.status === 'live' ? (
          <div className="flex items-center gap-1.5 bg-[#F4F4F4] border border-[#EAEAEA] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] font-bold text-black uppercase tracking-wide">Live</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider bg-[#F4F4F4] px-2.5 py-1 rounded-full">
            Bientôt
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

/* ─── Coming Soon View ─── */
function ComingSoonView({ tool, onBack }) {
  const [showModal, setShowModal] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  return (
    <>
      <div className="flex-1 h-full flex flex-col items-center justify-center p-12 text-center bg-[#FAFAFA]">
        <div className="relative mb-7">
          <div
            className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-xl ${tool.shadowColor}`}
          >
            <tool.icon className="w-9 h-9" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-black mb-2">{tool.name} — Bientôt disponible</h2>
        <p className="text-[#666] text-[13px] max-w-sm mx-auto leading-relaxed mb-8">
          Nous développons un outil d'IA de pointe pour{' '}
          <span className="font-semibold text-black">{tool.name.toLowerCase()}</span>.
          Soyez le premier à y avoir accès.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {alreadyDone ? (
            <div className="flex items-center gap-2 text-sm font-bold bg-[#F4F4F4] text-[#666] px-5 py-2.5 rounded-xl border border-[#EAEAEA]">
              <Check className="w-4 h-4 text-black" />
              Vous êtes sur la liste !
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 text-sm font-bold bg-black text-white px-5 py-2.5 rounded-xl hover:bg-[#333] transition-colors shadow-lg shadow-black/10 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              M'avertir au lancement
            </button>
          )}
          <button
            onClick={onBack}
            className="text-sm font-semibold text-[#666] hover:text-black transition-colors cursor-pointer"
          >
            Retour à la bibliothèque
          </button>
        </div>
      </div>

      {showModal && (
        <NotifyModal
          tool={tool}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setAlreadyDone(true); setShowModal(false); }}
        />
      )}
    </>
  );
}

/* ─── Notify Modal ─── */
function NotifyModal({ tool, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | duplicate | error
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setStatus('error'); return; }

    setStatus('loading');
    const result = await addToWaitlist(tool.id, email);

    if (result.success) {
      setStatus('success');
      setTimeout(onSuccess, 1600);
    } else if (result.duplicate) {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 relative">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 text-[#999] hover:text-black transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-5 shadow-lg">
              <Check className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-black mb-1">Vous êtes sur la liste !</h3>
            <p className="text-[#666] text-[13px] leading-relaxed">
              On vous préviendra dès que <span className="font-semibold text-black">{tool.name}</span> sera disponible.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-md`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-black">{tool.name}</h3>
                <p className="text-[#999] text-[12px]">Soyez notifié au lancement</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="block text-[12px] font-semibold text-black mb-1.5">
                Votre adresse email
              </label>
              <div className="relative mb-4">
                <Mail className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
                  placeholder="vous@email.com"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-[13px] outline-none transition-all placeholder:text-[#999] text-black ${
                    status === 'error' || status === 'duplicate'
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#EAEAEA] focus:border-black'
                  }`}
                />
              </div>

              {status === 'error' && (
                <p className="text-[12px] text-red-500 font-medium -mt-2 mb-3">
                  Veuillez entrer une adresse email valide.
                </p>
              )}
              {status === 'duplicate' && (
                <p className="text-[12px] text-[#666] font-medium -mt-2 mb-3">
                  Cet email est déjà inscrit pour {tool.name}.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-black/10"
              >
                {status === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Me notifier
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── UI Builder View ─── */
function UIBuilderView({ initialPrompt }) {
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    if (initialPrompt) setInputValue(initialPrompt);
  }, [initialPrompt]);

  const handleGenerate = () => {
    if (!inputValue.trim() || isGenerating) return;
    setIsGenerating(true);
    setIsGenerated(false);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 2500);
  };

  return (
    <div className="flex-1 h-full flex flex-col p-6 overflow-hidden relative">
      <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-y-auto pb-24">
        {/* Left — wireframe panel */}
        <div className="w-full md:w-1/3 min-h-[260px] bg-[#F4F4F4] rounded-2xl border border-[#EAEAEA] p-5 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-20 h-5 bg-white rounded-lg shadow-sm border border-[#EAEAEA]" />
            <div className="w-7 h-7 bg-white rounded-full shadow-sm border border-[#EAEAEA]" />
          </div>
          <div className="space-y-2.5">
            {[100, 83, 66].map((w, i) => (
              <div key={i} className="h-2.5 bg-white rounded-full border border-[#EAEAEA]" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex-1 h-16 bg-white/60 rounded-xl border border-[#EAEAEA]" />
            <div className="flex-1 h-16 bg-white/60 rounded-xl border border-[#EAEAEA]" />
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#EAEAEA] mt-1 group-hover:scale-[1.02] transition-transform duration-500" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#F4F4F4] to-transparent pointer-events-none" />
        </div>

        {/* Right — output panel */}
        <div
          className={`flex-1 min-h-[360px] rounded-2xl border p-8 flex flex-col items-center justify-center transition-all duration-500 relative ${
            isGenerating || isGenerated
              ? 'bg-white border-[#EAEAEA] shadow-sm'
              : 'bg-[#F4F4F4] border-dashed border-[#CCCCCC]'
          }`}
        >
          {!isGenerating && !isGenerated && (
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-[#EAEAEA] flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 text-[#CCCCCC]" />
              </div>
              <span className="text-black font-bold text-base mb-2">Prêt à créer ?</span>
              <p className="text-[#666] text-[13px] max-w-xs leading-relaxed">
                Décrivez votre interface idéale ci-dessous pour voir la magie opérer.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center gap-7">
              <div className="relative">
                <div className="w-14 h-14 border-[4px] border-[#EAEAEA] border-t-black rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BotIcon className="w-5 h-5 text-black" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-black font-bold text-base animate-pulse">Génération en cours…</span>
                <p className="text-[#666] text-[13px] italic">Assemblage des composants React et styles Tailwind…</p>
              </div>
            </div>
          )}

          {isGenerated && (
            <div className="w-full h-full flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-black rounded-lg" />
                  <div className="w-28 h-4 bg-[#EAEAEA] rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-[#F4F4F4] rounded-lg" style={{ width: '72px' }} />
                  <div className="h-8 bg-black rounded-lg" style={{ width: '72px' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { Icon: Network, value: '4 120', label: 'Visites' },
                  { Icon: Sparkles, value: '+24 %', label: 'Conversion' },
                ].map(({ Icon, value, label }, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#EAEAEA] shadow-sm p-5 flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F4F4F4] flex items-center justify-center text-black">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-black">{value}</div>
                      <div className="text-[10px] font-bold text-[#999] uppercase tracking-wider">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-1 bg-white rounded-2xl border border-[#EAEAEA] shadow-sm p-6 flex flex-col">
                <div className="w-40 h-4 bg-[#F4F4F4] rounded mb-6" />
                <div className="flex-1 flex items-end gap-2 min-h-[100px]">
                  {[30, 60, 40, 85, 55, 95, 75, 45, 80, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-black/5 rounded-t-md relative"
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-black/40 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Prompt Input Bar ─── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-3xl">
        <div
          className={`w-full h-16 bg-white rounded-2xl border flex items-center px-4 transition-all duration-300 ${
            inputValue
              ? 'border-[#CCCCCC] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]'
              : 'border-[#EAEAEA] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${
              inputValue ? 'bg-black text-white' : 'text-[#999]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              if (isGenerated) setIsGenerated(false);
            }}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="Décrivez l'interface que vous souhaitez générer…"
            className="ml-4 flex-1 h-full bg-transparent outline-none text-[15px] text-black placeholder:text-[#999] font-medium"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !inputValue.trim()}
            aria-label="Générer"
            className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ml-2 shadow-lg shadow-black/10 flex-shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Diagnostic RGAA View ─── */
function DiagnosticRGAAView() {
  const SAMPLE_HTML = `<div class="card">
  <img src="chart.png">
  <div onclick="openDetails()" class="btn">Voir plus</div>
  <input type="text" placeholder="Votre email">
  <p style="color:#999">Erreur : champ requis</p>
</div>`;

  const [code, setCode] = useState('');
  const [axeResult, setAxeResult] = useState(null);
  const [axeError, setAxeError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [isDeepening, setIsDeepening] = useState(false);

  const severityMeta = {
    bloquant: { emoji: '🔴', className: 'bg-red-50 border-red-200 text-red-700' },
    majeur: { emoji: '🟠', className: 'bg-orange-50 border-orange-200 text-orange-700' },
    mineur: { emoji: '🟡', className: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  };

  const handleAnalyze = async () => {
    if (!code.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAxeError(null);
    setAxeResult(null);
    setAiReport(null);
    try {
      const { runAxeAudit } = await import('../../../services/rgaa');
      const result = await runAxeAudit(code);
      setAxeResult(result);
    } catch (err) {
      setAxeError(err.message || "L'analyse a échoué.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeepen = async () => {
    if (!axeResult || isDeepening) return;
    setIsDeepening(true);
    try {
      const { generateRgaaDiagnostic } = await import('../../../services/rgaa');
      const report = await generateRgaaDiagnostic(code, axeResult);
      setAiReport(report);
    } finally {
      setIsDeepening(false);
    }
  };

  const counts = axeResult
    ? axeResult.violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden">
      {/* Left — input */}
      <div className="w-full md:w-[38%] flex flex-col border-r border-[#EAEAEA] bg-[#FAFAFA] overflow-hidden">
        <div className="p-5 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[12px] font-bold text-black uppercase tracking-wider">Code à analyser</label>
            <button
              onClick={() => setCode(SAMPLE_HTML)}
              className="text-[12px] font-semibold text-[#666] hover:text-black underline underline-offset-2 cursor-pointer"
            >
              Essayer un exemple
            </button>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Collez ici un extrait HTML ou JSX…"
            spellCheck={false}
            className="flex-1 w-full bg-white border border-[#EAEAEA] rounded-xl p-4 text-[13px] font-mono text-black outline-none focus:border-black transition-all resize-none placeholder:text-[#999]"
          />
          <button
            onClick={handleAnalyze}
            disabled={!code.trim() || isAnalyzing}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-bold py-3 rounded-xl hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-black/10"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                Analyser
              </>
            )}
          </button>
          <p className="mt-3 text-[11px] text-[#999] leading-relaxed">
            Analyse locale via axe-core — aucune donnée envoyée à un serveur pour cette étape, aucune clé requise.
          </p>
        </div>
      </div>

      {/* Right — results */}
      <div className="flex-1 overflow-y-auto p-6">
        {!axeResult && !axeError && !isAnalyzing && (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 bg-[#F4F4F4] rounded-2xl flex items-center justify-center mb-4">
              <Accessibility className="w-6 h-6 text-[#CCCCCC]" />
            </div>
            <p className="text-black font-semibold mb-1">Prêt à diagnostiquer</p>
            <p className="text-[#666] text-sm max-w-xs">Collez du code à gauche et lancez l'analyse, ou testez avec l'exemple fourni.</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div className="w-10 h-10 border-[3px] border-[#EAEAEA] border-t-black rounded-full animate-spin mb-4" />
            <p className="text-black font-semibold">Analyse en cours…</p>
          </div>
        )}

        {axeError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{axeError}</p>
          </div>
        )}

        {axeResult && (
          <div className="space-y-6">
            {/* Score header */}
            <div className="flex items-center gap-4 bg-white border border-[#EAEAEA] rounded-2xl p-5">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  axeResult.score >= 80
                    ? 'bg-emerald-50 text-emerald-600'
                    : axeResult.score >= 50
                    ? 'bg-orange-50 text-orange-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {axeResult.score}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-black font-bold text-[15px] mb-1">Score de conformité axe-core</p>
                <div className="flex items-center gap-3 text-[12px] font-semibold flex-wrap">
                  <span className="text-red-600">🔴 {counts.bloquant || 0} bloquant{(counts.bloquant || 0) > 1 ? 's' : ''}</span>
                  <span className="text-orange-600">🟠 {counts.majeur || 0} majeur{(counts.majeur || 0) > 1 ? 's' : ''}</span>
                  <span className="text-yellow-600">🟡 {counts.mineur || 0} mineur{(counts.mineur || 0) > 1 ? 's' : ''}</span>
                  <span className="text-[#999]">· {axeResult.passesCount} règles conformes</span>
                </div>
              </div>
            </div>

            {/* Violations list */}
            {axeResult.violations.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm font-semibold">
                <Check className="w-4 h-4" />
                Aucun problème détecté par axe-core sur ce code.
              </div>
            ) : (
              <div className="space-y-3">
                {axeResult.violations.map((v, i) => {
                  const meta = severityMeta[v.severity];
                  return (
                    <div key={i} className={`border rounded-xl p-4 ${meta.className}`}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[13px] font-bold">{meta.emoji} {v.help}</span>
                        <a
                          href={v.helpUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 flex-shrink-0"
                        >
                          En savoir plus
                        </a>
                      </div>
                      <p className="text-[12px] opacity-80 mb-2">{v.description}</p>
                      {v.nodes.slice(0, 3).map((n, j) => (
                        <pre key={j} className="bg-white/60 border border-black/5 rounded-lg p-2 text-[11px] font-mono overflow-x-auto mt-1 whitespace-pre-wrap">
                          {n.target} → {n.html}
                        </pre>
                      ))}
                      {v.nodes.length > 3 && (
                        <p className="text-[11px] opacity-70 mt-1">+ {v.nodes.length - 3} autre(s) occurrence(s)</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI deepen */}
            <div className="border-t border-[#EAEAEA] pt-5">
              {!aiReport && (
                <button
                  onClick={handleDeepen}
                  disabled={isDeepening}
                  className="flex items-center gap-2 text-sm font-bold bg-white border border-[#EAEAEA] text-black px-4 py-2.5 rounded-xl hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeepening ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      L'IA analyse le contexte…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Approfondir avec l'IA
                    </>
                  )}
                </button>
              )}
              {!aiReport && !isDeepening && (
                <p className="mt-2 text-[11px] text-[#999]">
                  Va au-delà d'axe-core : pertinence des textes alternatifs, qualité des libellés, corrections de code prêtes à copier.
                </p>
              )}

              {aiReport && (
                <div className="mt-2 bg-white border border-[#EAEAEA] rounded-2xl p-5 prose prose-sm max-w-none prose-p:leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiReport}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Bot icon (inline SVG) ─── */
function BotIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" /><path d="M20 14h2" />
      <path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
  );
}
