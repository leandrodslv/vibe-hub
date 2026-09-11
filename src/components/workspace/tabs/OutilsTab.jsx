import { useState, useEffect, useRef, useDeferredValue } from 'react';
import {
  Sparkles,
  ArrowRight,
  Network,
  LayoutTemplate,
  ShieldCheck,
  PenTool,
  Palette,
  Eye,
  ChevronLeft,
  X,
  Bell,
  Check,
  Mail,
  Clock,
  Puzzle,
  Plus,
  Search,
  Mic,
  TrendingUp,
  BarChart3,
  Shapes,
} from 'lucide-react';
import { addToWaitlist } from '../../../services/supabase';
import { isValidEmail } from '../../../lib/validation';

const TOOLS = [
  {
    id: 'ui-builder',
    name: 'UI Builder',
    description:
      'Concevez des interfaces utilisateur complexes avec notre constructeur visuel intuitif. Génération de code en temps réel incluse.',
    icon: LayoutTemplate,
    status: 'live',
  },
  {
    id: 'code-auditor',
    name: 'Code Auditor',
    description:
      "Analyse statique et recommandations d'optimisation basées sur l'IA pour vos projets.",
    icon: ShieldCheck,
    status: 'coming',
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description:
      'Générateur de copie UX et de contenu marketing intégré directement dans votre workflow.',
    icon: PenTool,
    status: 'coming',
  },
  {
    id: 'color-studio',
    name: 'Color Studio',
    description:
      'Création et gestion de systèmes de couleurs accessibles avec prévisualisation en direct.',
    icon: Palette,
    status: 'coming',
  },
  {
    id: 'vision-lens',
    name: 'Vision Lens',
    description:
      "Testeur d'accessibilité visuelle simulant différents types de daltonisme sur vos maquettes.",
    icon: Eye,
    status: 'coming',
  },
  {
    id: 'voice-studio',
    name: 'Voice Studio',
    description: 'Synthèse et clonage de voix pour vos prototypes, démos et vidéos.',
    icon: Mic,
    status: 'coming',
  },
  {
    id: 'seo-analyzer',
    name: 'SEO Analyzer',
    description: "Audit SEO automatisé et suggestions d'optimisation on-page en temps réel.",
    icon: TrendingUp,
    status: 'coming',
  },
  {
    id: 'data-viz',
    name: 'Data Viz',
    description: 'Générez des graphiques et tableaux de bord à partir de vos données brutes.',
    icon: BarChart3,
    status: 'coming',
  },
  {
    id: 'icon-forge',
    name: 'Icon Forge',
    description: "Générateur d'icônes cohérentes pour vos design systems et interfaces.",
    icon: Shapes,
    status: 'coming',
  },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export default function OutilsTab({ initialPrompt }) {
  const [activeToolId, setActiveToolId] = useState(null);

  // Hand-off depuis l'Assistant IA : un prompt "envoyé au Générateur" ouvre directement l'UI Builder.
  useEffect(() => {
    if (initialPrompt) setActiveToolId('ui-builder');
  }, [initialPrompt]);

  const [notifyToolId, setNotifyToolId] = useState(null);
  const [joinedIds, setJoinedIds] = useState(() => new Set());
  const [catalogOpen, setCatalogOpen] = useState(false);

  const activeTool = TOOLS.find((t) => t.id === activeToolId);
  const notifyTool = TOOLS.find((t) => t.id === notifyToolId);
  const liveTool = TOOLS.find((t) => t.status === 'live');
  const comingTools = TOOLS.filter((t) => t.status === 'coming');
  const highlightedTools = comingTools.slice(0, 3);
  const remainingCount = comingTools.length - highlightedTools.length;

  if (activeToolId && activeTool) {
    return (
      <ToolViewWrapper tool={activeTool} onBack={() => setActiveToolId(null)}>
        <UIBuilderView initialPrompt={initialPrompt} />
      </ToolViewWrapper>
    );
  }

  if (catalogOpen) {
    return (
      <>
        <CatalogView
          tools={comingTools}
          joinedIds={joinedIds}
          onJoin={(id) => setNotifyToolId(id)}
          onClose={() => setCatalogOpen(false)}
        />
        {notifyTool && (
          <NotifyModal
            tool={notifyTool}
            onClose={() => setNotifyToolId(null)}
            onSuccess={() => {
              setJoinedIds((prev) => new Set(prev).add(notifyTool.id));
              setNotifyToolId(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide pr-2 pb-4 bg-surface animate-in fade-in duration-500">
      {/* En-tête */}
      <div className="mb-10">
        <h1 className="font-display-lg text-display-lg md:text-display-xl text-on-surface leading-[1.05] mb-4">
          Boîte à <br />
          <span className="text-primary">outils</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          L'arsenal créatif complet. Lancez vos projets actuels ou inscrivez-vous pour un accès
          anticipé aux prochaines innovations de l'écosystème Vibe Hub.
        </p>
      </div>

      {/* ─── Disponible ─── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Disponible
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-grid-gutter">
          {liveTool && (
            <FeaturedToolCard tool={liveTool} onClick={() => setActiveToolId(liveTool.id)} />
          )}
          <EcosystemCard />
        </div>
      </section>

      {/* ─── Bientôt disponible ─── */}
      <section className="pt-8 border-t border-surface-variant">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-on-surface-variant" aria-hidden="true" />
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface-variant">
            Bientôt disponible
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
          {highlightedTools.map((tool) => (
            <ComingSoonCard
              key={tool.id}
              tool={tool}
              joined={joinedIds.has(tool.id)}
              onJoin={() => setNotifyToolId(tool.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className={`bg-surface-variant rounded-3xl p-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant hover:bg-surface-container transition-colors min-h-[240px] ${FOCUS_RING}`}
          >
            <div className="w-14 h-14 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 chunky-shadow">
              <Plus className="w-7 h-7 text-primary" aria-hidden="true" />
            </div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
              Voir plus d'outils
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[200px]">
              {remainingCount > 0
                ? `Et ${remainingCount} autre${remainingCount > 1 ? 's' : ''} outil${remainingCount > 1 ? 's' : ''} en préparation.`
                : 'Découvrez le catalogue complet.'}
            </p>
          </button>
        </div>
      </section>

      {notifyTool && (
        <NotifyModal
          tool={notifyTool}
          onClose={() => setNotifyToolId(null)}
          onSuccess={() => {
            setJoinedIds((prev) => new Set(prev).add(notifyTool.id));
            setNotifyToolId(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Carte outil principal (disponible) ─── */
function FeaturedToolCard({ tool, onClick }) {
  const Icon = tool.icon;
  return (
    <div className="rounded-3xl bg-[#e0f2e9] p-8 flex flex-col justify-between min-h-[320px] chunky-shadow relative overflow-hidden">
      <div className="flex justify-between items-start">
        <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full font-label-caps text-label-caps text-on-surface inline-block">
          Outil principal
        </span>
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
          <Icon className="w-8 h-8 text-[#2d6a4f]" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-auto pt-8">
        <h3 className="font-display-lg text-headline-lg md:text-display-lg mb-2 text-[#1a4331]">
          {tool.name}
        </h3>
        <p className="font-body-md text-body-md text-[#2d6a4f] mb-6 max-w-md">{tool.description}</p>
        <button
          type="button"
          onClick={onClick}
          className={`font-cta-pill text-cta-pill bg-on-surface text-surface px-8 py-4 rounded-full flex items-center gap-2 hover:bg-primary hover:text-on-primary transition-colors w-fit ${FOCUS_RING}`}
        >
          Lancer l'outil
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ─── Carte décorative — écosystème en expansion ─── */
function EcosystemCard() {
  return (
    <div className="hidden md:flex rounded-3xl bg-surface-container-low p-8 items-center justify-center relative overflow-hidden">
      <div
        className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div className="text-center z-10">
        <Puzzle className="w-16 h-16 text-outline-variant mb-4 mx-auto" aria-hidden="true" />
        <h4 className="font-headline-lg text-headline-lg text-on-surface-variant">
          Écosystème en expansion
        </h4>
      </div>
    </div>
  );
}

/* ─── Carte outil à venir ─── */
function ComingSoonCard({ tool, joined, onJoin }) {
  const Icon = tool.icon;
  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-on-surface-variant" aria-hidden="true" />
      </div>
      <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
        {tool.name}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">
        {tool.description}
      </p>
      {joined ? (
        <span className="font-cta-pill text-cta-pill w-full bg-surface-container-highest text-on-surface-variant py-3 rounded-full flex items-center justify-center gap-2">
          <Check className="w-4 h-4" aria-hidden="true" />
          Sur la liste
        </span>
      ) : (
        <button
          type="button"
          onClick={onJoin}
          className={`font-cta-pill text-cta-pill w-full border-2 border-on-surface text-on-surface py-3 rounded-full hover:bg-on-surface hover:text-surface transition-colors ${FOCUS_RING}`}
        >
          Rejoindre la liste
        </button>
      )}
    </div>
  );
}

/* ─── Catalogue complet des outils à venir ─── */
function CatalogView({ tools, joinedIds, onJoin, onClose }) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const filtered = tools.filter((t) => {
    const q = deferredSearch.trim().toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  return (
    <div className="w-full h-full flex flex-col bg-surface animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className={`flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary w-fit bg-surface-container-lowest px-4 py-2 rounded-lg border border-surface-variant shadow-sm transition-all hover:shadow-md mb-6 ${FOCUS_RING}`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" /> Retour à la boîte à outils
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
              Catalogue complet
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {tools.length} outils en préparation.
            </p>
          </div>

          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search
              className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Rechercher un outil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un outil"
              className={`w-full bg-surface-container-lowest border border-surface-variant rounded-xl pl-10 pr-9 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant text-on-surface ${FOCUS_RING}`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Effacer la recherche"
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors rounded ${FOCUS_RING}`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-12 pr-2">
        {filtered.length === 0 ? (
          <div className="bg-surface-container-low border border-surface-variant rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-on-surface-variant" aria-hidden="true" />
            </div>
            <p className="font-headline-lg-mobile text-on-surface mb-2">Aucun outil trouvé</p>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-4">
              Essayez un autre mot-clé.
            </p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className={`text-sm text-on-surface font-semibold underline underline-offset-2 rounded ${FOCUS_RING}`}
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
            {filtered.map((tool) => (
              <ComingSoonCard
                key={tool.id}
                tool={tool}
                joined={joinedIds.has(tool.id)}
                onJoin={() => onJoin(tool.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Tool View Shell ─── */
function ToolViewWrapper({ tool, onBack, children }) {
  const Icon = tool.icon;
  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest border border-surface-variant rounded-3xl shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-5 border-b border-surface-variant bg-surface-container-lowest z-10 flex-shrink-0"
        style={{ height: '56px' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface font-semibold text-[13px] transition-colors bg-surface-container hover:bg-surface-variant px-3 py-1.5 rounded-lg ${FOCUS_RING}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Bibliothèque
          </button>
          <div className="w-px h-5 bg-surface-variant" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e0f2e9] flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-[#2d6a4f]" aria-hidden="true" />
            </div>
            <h2 className="text-[13px] font-bold text-on-surface">{tool.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-primary-container/15 text-primary px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          <span className="font-label-caps text-label-caps">En ligne</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/* ─── Notify Modal ─── */
function NotifyModal({ tool, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | duplicate | error
  const inputRef = useRef(null);
  const Icon = tool.icon;

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus('error');
      return;
    }

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl shadow-xl w-full max-w-sm p-7 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className={`absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors rounded ${FOCUS_RING}`}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mb-5 shadow-lg">
              <Check className="w-7 h-7 text-on-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1">Vous êtes sur la liste !</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              On vous préviendra dès que{' '}
              <span className="font-semibold text-on-surface">{tool.name}</span> sera disponible.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shadow-sm">
                <Icon className="w-5 h-5 text-on-surface-variant" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-on-surface">{tool.name}</h3>
                <p className="text-on-surface-variant text-[12px]">Soyez notifié au lancement</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label
                htmlFor="notify-email"
                className="block text-[12px] font-semibold text-on-surface mb-1.5"
              >
                Votre adresse email
              </label>
              <div className="relative mb-4">
                <Mail
                  className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="notify-email"
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus('idle');
                  }}
                  placeholder="vous@email.com"
                  className={`w-full bg-surface-container border rounded-xl pl-10 pr-4 py-2.5 text-[13px] outline-none transition-all placeholder:text-on-surface-variant text-on-surface ${FOCUS_RING} ${
                    status === 'error' || status === 'duplicate'
                      ? 'border-error focus:border-error'
                      : 'border-transparent focus:border-primary'
                  }`}
                />
              </div>

              {status === 'error' && (
                <p className="text-[12px] text-error font-medium -mt-2 mb-3">
                  Veuillez entrer une adresse email valide.
                </p>
              )}
              {status === 'duplicate' && (
                <p className="text-[12px] text-on-surface-variant font-medium -mt-2 mb-3">
                  Cet email est déjà inscrit pour {tool.name}.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className={`w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-cta-pill text-cta-pill py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed chunky-shadow ${FOCUS_RING}`}
              >
                {status === 'loading' ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" aria-hidden="true" />
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
      <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-y-auto scrollbar-hide pb-24">
        {/* Left — wireframe panel */}
        <div className="w-full md:w-1/3 min-h-[260px] bg-surface-container rounded-2xl border border-surface-variant p-5 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-20 h-5 bg-surface-container-lowest rounded-lg shadow-sm border border-surface-variant" />
            <div className="w-7 h-7 bg-surface-container-lowest rounded-full shadow-sm border border-surface-variant" />
          </div>
          <div className="space-y-2.5">
            {[100, 83, 66].map((w, i) => (
              <div
                key={i}
                className="h-2.5 bg-surface-container-lowest rounded-full border border-surface-variant"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex-1 h-16 bg-surface-container-lowest/60 rounded-xl border border-surface-variant" />
            <div className="flex-1 h-16 bg-surface-container-lowest/60 rounded-xl border border-surface-variant" />
          </div>
          <div className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant mt-1 group-hover:scale-[1.02] transition-transform duration-500" />
          <div
            className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-container to-transparent pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Right — output panel */}
        <div
          className={`flex-1 min-h-[360px] rounded-2xl border p-8 flex flex-col items-center justify-center transition-all duration-500 relative ${
            isGenerating || isGenerated
              ? 'bg-surface-container-lowest border-surface-variant shadow-sm'
              : 'bg-surface-container border-dashed border-outline-variant'
          }`}
        >
          {!isGenerating && !isGenerated && (
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-variant flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 text-outline-variant" aria-hidden="true" />
              </div>
              <span className="font-headline-lg-mobile text-on-surface text-base mb-2">
                Prêt à créer ?
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
                Décrivez votre interface idéale ci-dessous pour voir la magie opérer.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center gap-7">
              <div className="relative">
                <div className="w-14 h-14 border-[4px] border-surface-variant border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BotIcon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="font-headline-lg-mobile text-on-surface text-base animate-pulse">
                  Génération en cours…
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant italic">
                  Assemblage des composants React et styles Tailwind…
                </p>
              </div>
            </div>
          )}

          {isGenerated && (
            <div className="w-full h-full flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-on-surface rounded-lg" />
                  <div className="w-28 h-4 bg-surface-variant rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-surface-container rounded-lg" style={{ width: '72px' }} />
                  <div className="h-8 bg-on-surface rounded-lg" style={{ width: '72px' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { Icon: Network, value: '4 120', label: 'Visites' },
                  { Icon: Sparkles, value: '+24 %', label: 'Conversion' },
                ].map(({ Icon, value, label }, i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest rounded-2xl border border-surface-variant shadow-sm p-5 flex flex-col gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-on-surface">{value}</div>
                      <div className="font-label-caps text-label-caps text-on-surface-variant">
                        {label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-surface-variant shadow-sm p-6 flex flex-col">
                <div className="w-40 h-4 bg-surface-container rounded mb-6" />
                <div className="flex-1 flex items-end gap-2 min-h-[100px]">
                  {[30, 60, 40, 85, 55, 95, 75, 45, 80, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/10 rounded-t-md relative"
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/40 rounded-full" />
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
          className={`w-full h-16 bg-surface-container-lowest rounded-2xl border-2 flex items-center px-4 transition-all duration-300 ${
            inputValue
              ? 'border-primary shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]'
              : 'border-outline-variant shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${
              inputValue ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (isGenerated) setIsGenerated(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Décrivez l'interface que vous souhaitez générer…"
            aria-label="Décrivez l'interface à générer"
            className="ml-4 flex-1 h-full bg-transparent outline-none text-[15px] text-on-surface placeholder:text-on-surface-variant font-medium"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !inputValue.trim()}
            aria-label="Générer"
            className={`w-10 h-10 bg-on-surface text-surface rounded-xl flex items-center justify-center hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-2 shadow-md flex-shrink-0 ${FOCUS_RING}`}
          >
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bot icon (inline SVG) ─── */
function BotIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
