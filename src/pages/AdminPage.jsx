import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  BookOpen,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  GripVertical,
  Mail,
  Lock,
  Video,
  FileText,
  Sparkles,
  Download,
  KeyRound,
  BarChart3,
  Wrench,
  Bell,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  signIn,
  signOut,
  getSession,
  onAuthChange,
  isAdmin,
  getWaitlistCounts,
  uploadCourseDraftVideo,
  getAiUsageSummary,
  getAiUsageDaily,
  getLastKeyRotation,
  logKeyRotation,
  getNotificationsOverview,
} from '../services/supabase';
import { generateCourseDraftFromVideo, generateCourseDraftFromUploadedVideo } from '../services/ai';
import {
  matchesHost,
  extractYouTubeVideoId,
  captionToTitle,
  sanitizeText,
} from '../lib/validation';
import { TOOLS } from '../data/tools';

const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be'];

// Tarif public gemini-2.5-flash-lite (ai.google.dev/gemini-api/docs/pricing,
// vérifié 2026-09-15) — sert UNIQUEMENT à une estimation affichée à l'admin,
// jamais la facturation réelle Google (qui exige un compte Google, hors de
// portée d'une simple clé API serveur — Epic 11, epics-ai-ops.md).
const GEMINI_FLASH_LITE_PRICE_PER_1M = { input: 0.1, output: 0.4 };
// Seuil au-delà duquel on considère la clé Gemini "à tourner bientôt" —
// pratique courante pour une clé API, pas une contrainte technique. Purement
// indicatif côté client : aucune conséquence fonctionnelle si on l'ignore.
const KEY_ROTATION_WARNING_DAYS = 90;
function estimateUsdCost({ prompt_tokens, candidates_tokens }) {
  return (
    (prompt_tokens / 1_000_000) * GEMINI_FLASH_LITE_PRICE_PER_1M.input +
    (candidates_tokens / 1_000_000) * GEMINI_FLASH_LITE_PRICE_PER_1M.output
  );
}

const MODULES = ['MODULE 1', 'MODULE 2', 'MODULE 3'];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

/* ════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════ */
export default function AdminPage() {
  const [session, setSession] = useState(undefined); // undefined = loading
  // undefined = pas encore vérifié, null = vérifié et refusé, true = admin confirmé.
  const [admin, setAdmin] = useState(undefined);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null));
    return onAuthChange(setSession);
  }, []);

  // Vérifie les droits admin à chaque changement de session — le contrôle réel
  // reste la RLS Postgres (AD-3) ; ceci ne fait qu'éviter de laisser l'UI
  // échouer silencieusement sur chaque action pour un compte non-admin.
  useEffect(() => {
    if (!session) {
      setAdmin(undefined);
      return;
    }
    let alive = true;
    isAdmin()
      .then((ok) => alive && setAdmin(ok))
      .catch(() => alive && setAdmin(false));
    return () => {
      alive = false;
    };
  }, [session]);

  const handleLogout = async () => {
    await signOut();
  };

  // Chargement initial (session ou vérification admin en cours)
  if (session === undefined || (session && admin === undefined)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-surface-variant border-t-primary rounded-full animate-spin"
          role="status"
          aria-label="Chargement"
        />
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  if (!admin) return <AccessDenied email={session.user?.email} onLogout={handleLogout} />;
  return <Dashboard onLogout={handleLogout} email={session.user?.email} />;
}

/* ════════════════════════════════════════
   ACCÈS REFUSÉ — session valide, pas admin
════════════════════════════════════════ */
function AccessDenied({ email, onLogout }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-surface-variant rounded-bento shadow-sm w-full max-w-sm p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-on-error-container" aria-hidden="true" />
        </div>
        <h1 className="font-headline-lg-mobile text-[16px] font-bold text-on-surface mb-1.5">
          Accès refusé
        </h1>
        <p className="font-body-md text-[13px] text-on-surface-variant mb-6">
          {email ? (
            <>
              Le compte <span className="font-semibold text-on-surface">{email}</span> n&apos;a pas
              les droits admin.
            </>
          ) : (
            "Ce compte n'a pas les droits admin."
          )}
        </p>
        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-cta-pill text-sm font-bold py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   LOGIN — Supabase Auth
════════════════════════════════════════ */
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    }
    // Si succès, onAuthStateChange met à jour session → Dashboard s'affiche automatiquement
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-surface-variant rounded-bento shadow-sm w-full max-w-sm p-8">
        <div className="mb-7 text-center">
          <span className="font-display-lg text-xl font-extrabold tracking-tight text-on-surface">
            vibe hub
          </span>
          <p className="font-label-caps text-label-caps text-on-surface-variant mt-1 uppercase">
            Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="admin_email"
              className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="admin_email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="admin@vibehub.com"
                className={`w-full bg-surface-container-lowest border rounded-xl pl-10 pr-4 py-2.5 text-[13px] outline-none transition-all placeholder:text-on-surface-variant/50 text-on-surface ${FOCUS_RING} ${
                  error ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="admin_password"
              className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5"
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="admin_password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••••"
                className={`w-full bg-surface-container-lowest border rounded-xl pl-10 pr-10 py-2.5 text-[13px] outline-none transition-all placeholder:text-on-surface-variant/50 text-on-surface ${FOCUS_RING} ${
                  error ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer rounded ${FOCUS_RING}`}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="font-body-md text-[12px] text-error font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-cta-pill text-sm font-bold py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer chunky-shadow ${FOCUS_RING}`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   SIDEBAR (marque + nav + déconnexion, commune à la liste et à l'éditeur)
   Epic 14 story 14.1 : remplace l'ancienne barre d'onglets du haut par une
   sidebar fixe en desktop / tiroir hors-écran derrière un hamburger en mobile
   — même posture que Sidebar.jsx (Workspace), adaptée aux 4 destinations admin.
════════════════════════════════════════ */
function sidebarItemClass(active) {
  return `flex items-center px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-colors duration-200 cursor-pointer ${FOCUS_RING} ${
    active
      ? 'bg-primary text-on-primary'
      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
  }`;
}

const ADMIN_NAV_ITEMS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'courses', label: 'Cours' },
  { id: 'waitlist', label: 'Demande outils' },
  { id: 'ai-usage', label: 'Utilisation IA' },
];

function AdminSidebar({
  onLogout,
  view,
  onSelectAccueil,
  onSelectCourses,
  onSelectWaitlist,
  onSelectAiUsage,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Absent sur l'éditeur de cours (view non fourni) : éditer un cours n'est pas
  // une des 4 destinations, même posture que l'ancienne barre d'onglets.
  const handlers = {
    accueil: onSelectAccueil,
    courses: onSelectCourses,
    waitlist: onSelectWaitlist,
    'ai-usage': onSelectAiUsage,
  };

  const navList = view && (
    <nav aria-label="Navigation admin" className="flex flex-col gap-1">
      {ADMIN_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            handlers[item.id]();
            setMobileOpen(false);
          }}
          aria-current={view === item.id ? 'page' : undefined}
          className={sidebarItemClass(view === item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );

  const logoutButton = (
    <button
      onClick={onLogout}
      className={`flex items-center gap-1.5 text-[13px] font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded px-3 py-2 ${FOCUS_RING}`}
    >
      <LogOut className="w-4 h-4" aria-hidden="true" />
      Déconnexion
    </button>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface-container-lowest border-r-2 border-surface-variant p-6 z-30">
        <a
          href="/"
          className={`font-display-lg text-xl font-extrabold tracking-tight text-on-surface hover:text-primary transition-colors rounded mb-1 w-fit ${FOCUS_RING}`}
        >
          vibe hub
        </a>
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-8">
          Admin
        </span>
        {navList}
        <div className="mt-auto">{logoutButton}</div>
      </aside>

      {/* Barre du haut mobile : hamburger + marque */}
      <div className="md:hidden flex items-center gap-3 h-14 px-4 bg-surface-container-lowest border-b-2 border-surface-variant sticky top-0 z-30">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className={`text-on-surface-variant hover:text-primary rounded ${FOCUS_RING}`}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <span className="font-display-lg text-lg font-extrabold tracking-tight text-on-surface">
          vibe hub
        </span>
      </div>

      {/* Tiroir mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-on-surface/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface-container-lowest p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display-lg text-lg font-extrabold tracking-tight text-on-surface">
                vibe hub
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className={`text-on-surface-variant hover:text-primary rounded ${FOCUS_RING}`}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            {navList}
            <div className="mt-auto">{logoutButton}</div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════ */
function Dashboard({ onLogout, email }) {
  const [view, setView] = useState('accueil'); // 'accueil' | 'courses' | 'waitlist' | 'ai-usage'
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | { mode: 'add'|'edit', course? }
  const [deleteTarget, setDeleteTarget] = useState(null); // course object

  // null = pas encore chargé (fetch paresseux, seulement à l'ouverture de l'onglet).
  const [waitlistCounts, setWaitlistCounts] = useState(null);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState(null);
  // Garde synchrone contre le double-fetch : `waitlistLoading` (state) n'est mis à
  // jour qu'au prochain render, donc deux clics rapides sur l'onglet liraient tous
  // les deux `false` via leur closure et lanceraient chacun un appel RPC. Un ref
  // est mutable immédiatement, sans attendre de re-render.
  const waitlistFetchInFlight = useRef(false);

  // Epic 11 — "Utilisation IA" : mêmes garde-fous que la demande outils
  // ci-dessus (fetch paresseux à l'ouverture, ref synchrone anti-double-fetch).
  const [aiUsage, setAiUsage] = useState(null);
  const [lastRotation, setLastRotation] = useState(null);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);
  const [aiUsageError, setAiUsageError] = useState(null);
  const [rotationSaving, setRotationSaving] = useState(false);
  const aiUsageFetchInFlight = useRef(false);

  // Epic 13 story 13.3 — carte "Notifications" de l'Accueil : mêmes garde-fous
  // (fetch paresseux, ref synchrone anti-double-fetch) que waitlist/ai-usage.
  const [notifOverview, setNotifOverview] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const notifFetchInFlight = useRef(false);

  // Epic 14 story 14.3 — série journalière pour le graphique Accueil, même
  // garde-fous que les autres fetchs paresseux de cette vue.
  const [aiDaily, setAiDaily] = useState(null);
  const [aiDailyLoading, setAiDailyLoading] = useState(false);
  const [aiDailyError, setAiDailyError] = useState(null);
  const aiDailyFetchInFlight = useRef(false);

  const load = async () => {
    setLoading(true);
    const data = await getAllCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Accueil est l'écran d'atterrissage (view initial) : on lance tout de suite
    // ses deux fetchs paresseux au lieu d'attendre un premier clic sur les pills
    // "Demande outils"/"Utilisation IA" — `openAccueilView` est redéfinie à
    // chaque rendu mais n'est appelée qu'une fois le composant monté (effet),
    // donc sa position dans le fichier (plus bas) n'a pas d'incidence ici.
    openAccueilView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWaitlist = async () => {
    if (waitlistFetchInFlight.current) return;
    waitlistFetchInFlight.current = true;
    setWaitlistLoading(true);
    setWaitlistError(null);
    try {
      setWaitlistCounts(await getWaitlistCounts());
    } catch (err) {
      setWaitlistError(err.message || 'Impossible de charger la demande.');
    } finally {
      setWaitlistLoading(false);
      waitlistFetchInFlight.current = false;
    }
  };

  const openWaitlistView = () => {
    setView('waitlist');
    if (waitlistCounts === null) loadWaitlist();
  };

  const loadAiUsage = async () => {
    if (aiUsageFetchInFlight.current) return;
    aiUsageFetchInFlight.current = true;
    setAiUsageLoading(true);
    setAiUsageError(null);
    try {
      const [summary, rotation] = await Promise.all([getAiUsageSummary(), getLastKeyRotation()]);
      setAiUsage(summary);
      setLastRotation(rotation);
    } catch (err) {
      setAiUsageError(err.message || "Impossible de charger l'utilisation IA.");
    } finally {
      setAiUsageLoading(false);
      aiUsageFetchInFlight.current = false;
    }
  };

  const openAiUsageView = () => {
    setView('ai-usage');
    if (aiUsage === null) loadAiUsage();
  };

  const loadNotifOverview = async () => {
    if (notifFetchInFlight.current) return;
    notifFetchInFlight.current = true;
    setNotifLoading(true);
    setNotifError(null);
    try {
      setNotifOverview(await getNotificationsOverview());
    } catch (err) {
      setNotifError(err.message || 'Impossible de charger les notifications.');
    } finally {
      setNotifLoading(false);
      notifFetchInFlight.current = false;
    }
  };

  // Epic 13 — Accueil est désormais le premier écran vu après connexion : on y
  // déclenche les trois fetchs paresseux tout de suite (mêmes fonctions que les
  // pills "Demande outils"/"Utilisation IA", même garde "déjà chargé ?") plutôt
  // que d'attendre que l'admin clique dessus pour la première fois.
  const loadAiUsageDaily = async () => {
    if (aiDailyFetchInFlight.current) return;
    aiDailyFetchInFlight.current = true;
    setAiDailyLoading(true);
    setAiDailyError(null);
    try {
      setAiDaily(await getAiUsageDaily(14));
    } catch (err) {
      setAiDailyError(err.message || "Impossible de charger l'historique IA.");
    } finally {
      setAiDailyLoading(false);
      aiDailyFetchInFlight.current = false;
    }
  };

  const openAccueilView = () => {
    setView('accueil');
    if (waitlistCounts === null) loadWaitlist();
    if (aiUsage === null) loadAiUsage();
    if (notifOverview === null) loadNotifOverview();
    if (aiDaily === null) loadAiUsageDaily();
  };

  const handleLogRotation = async (note) => {
    setRotationSaving(true);
    try {
      setLastRotation(await logKeyRotation(note));
    } catch (err) {
      setAiUsageError(err.message || "Échec de l'enregistrement de la rotation.");
    } finally {
      setRotationSaving(false);
    }
  };

  const handleSave = async (formData) => {
    if (editing.mode === 'add') {
      const maxOrder = courses.reduce((m, c) => Math.max(m, c.order_index), 0);
      const newCourse = await createCourse({ ...formData, order_index: maxOrder + 1 });
      setCourses((prev) => [...prev, newCourse]);
    } else {
      const updated = await updateCourse(editing.course.id, formData);
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
    setEditing(null);
  };

  const handleDelete = async () => {
    await deleteCourse(deleteTarget.id);
    setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const togglePublished = async (course) => {
    const updated = await updateCourse(course.id, { published: !course.published });
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const published = courses.filter((c) => c.published).length;

  // Édition/création : une vraie page, pas une modale par-dessus la liste —
  // le contenu écrit d'un cours a besoin de place pour être confortable à rédiger.
  if (editing) {
    return (
      <div className="min-h-screen bg-surface">
        <AdminSidebar onLogout={onLogout} />
        <div className="md:ml-64">
          <CourseEditor
            mode={editing.mode}
            course={editing.course}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar
        onLogout={onLogout}
        view={view}
        onSelectAccueil={openAccueilView}
        onSelectCourses={() => setView('courses')}
        onSelectWaitlist={openWaitlistView}
        onSelectAiUsage={openAiUsageView}
      />

      {/* ── Content ── */}
      <div className="md:ml-64 max-w-5xl mx-auto px-8 py-10">
        {view === 'accueil' ? (
          <AdminAccueilView
            email={email}
            courses={courses}
            published={published}
            waitlistCounts={waitlistCounts}
            waitlistLoading={waitlistLoading}
            waitlistError={waitlistError}
            aiUsage={aiUsage}
            lastRotation={lastRotation}
            aiUsageLoading={aiUsageLoading}
            aiUsageError={aiUsageError}
            aiDaily={aiDaily}
            aiDailyLoading={aiDailyLoading}
            aiDailyError={aiDailyError}
            notifOverview={notifOverview}
            notifLoading={notifLoading}
            notifError={notifError}
            onSelectCourses={() => setView('courses')}
            onSelectWaitlist={openWaitlistView}
            onSelectAiUsage={openAiUsageView}
            onAddCourse={() => setEditing({ mode: 'add' })}
          />
        ) : view === 'waitlist' ? (
          <WaitlistView
            counts={waitlistCounts}
            loading={waitlistLoading}
            error={waitlistError}
            onRetry={loadWaitlist}
          />
        ) : view === 'ai-usage' ? (
          <AiUsageView
            usage={aiUsage}
            lastRotation={lastRotation}
            loading={aiUsageLoading}
            error={aiUsageError}
            rotationSaving={rotationSaving}
            onRetry={loadAiUsage}
            onLogRotation={handleLogRotation}
          />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total cours', value: courses.length },
                { label: 'Publiés', value: published },
                { label: 'Brouillons', value: courses.length - published },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-surface-container-lowest border border-surface-variant rounded-[24px] p-5 shadow-sm"
                >
                  <div className="font-display-lg text-2xl font-bold text-on-surface mb-0.5">
                    {value}
                  </div>
                  <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Header liste */}
            <div className="flex items-center justify-between mb-5">
              <h1 className="font-headline-lg-mobile text-[22px] font-bold text-on-surface">
                Cours
              </h1>
              <button
                onClick={() => setEditing({ mode: 'add' })}
                className={`flex items-center gap-2 bg-primary text-on-primary font-cta-pill text-[13px] font-bold px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer chunky-shadow ${FOCUS_RING}`}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Ajouter un cours
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div
                  className="w-8 h-8 border-2 border-surface-variant border-t-primary rounded-full animate-spin"
                  role="status"
                  aria-label="Chargement des cours"
                />
              </div>
            ) : courses.length === 0 ? (
              <EmptyState onAdd={() => setEditing({ mode: 'add' })} />
            ) : (
              <div className="space-y-2.5">
                {courses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    onEdit={() => setEditing({ mode: 'edit', course })}
                    onDelete={() => setDeleteTarget(course)}
                    onToggle={() => togglePublished(course)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          course={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   LIGNE COURS
════════════════════════════════════════ */
function CourseRow({ course, onEdit, onDelete, onToggle }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-[24px] px-5 py-4 flex items-center gap-4 hover:border-outline-variant transition-colors shadow-sm">
      <GripVertical className="w-4 h-4 text-outline-variant flex-shrink-0" aria-hidden="true" />

      {/* Image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface-variant">
        {course.image_url ? (
          <img src={course.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-outline" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">
            {course.module_name}
          </span>
          <span className="text-[10px] font-medium text-on-surface-variant">{course.duration}</span>
          {course.video_url && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-on-tertiary-fixed-variant bg-tertiary-fixed px-1.5 py-0.5 rounded">
              <Video className="w-3 h-3" aria-hidden="true" /> Vidéo
            </span>
          )}
        </div>
        <p className="text-[14px] font-bold text-on-surface truncate">{course.title}</p>
        <p className="text-[12px] text-on-surface-variant truncate">{course.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggle}
          aria-label={course.published ? 'Masquer' : 'Publier'}
          title={course.published ? 'Masquer' : 'Publier'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${FOCUS_RING} ${
            course.published
              ? 'bg-primary text-on-primary'
              : 'bg-surface-variant text-on-surface-variant hover:bg-outline-variant'
          }`}
        >
          {course.published ? (
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onEdit}
          aria-label="Modifier"
          className={`w-8 h-8 rounded-lg bg-surface-variant text-on-surface-variant hover:bg-outline-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Supprimer"
          className={`w-8 h-8 rounded-lg bg-surface-variant text-on-surface-variant hover:bg-error-container hover:text-on-error-container flex items-center justify-center transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ACCUEIL — vue d'atterrissage admin (Epic 13 + Epic 14, epics-admin-redesign.md)
   Pure composition en lecture : chaque section reflète une donnée déjà fetchée
   ailleurs dans Dashboard — aucun composant ci-dessous ne fait son propre appel
   Supabase (AD-2 : seul services/supabase.js importe le SDK).
════════════════════════════════════════ */
function AccueilCard({ title, icon: Icon, children, onSelect, ctaLabel }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-[24px] p-5 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
        </div>
        <h2 className="text-[14px] font-bold text-on-surface">{title}</h2>
      </div>
      <div className="flex-1 mb-4">{children}</div>
      {/* Pas toutes les cartes n'ont une vue complète à renvoyer (ex. Notifications,
          Epic 13 story 13.3 — pas encore d'onglet admin dédié) : le CTA est optionnel. */}
      {onSelect && ctaLabel && (
        <button
          type="button"
          onClick={onSelect}
          className={`self-start text-[13px] font-bold text-primary hover:underline underline-offset-2 cursor-pointer rounded ${FOCUS_RING}`}
        >
          {ctaLabel} →
        </button>
      )}
    </div>
  );
}

/* ── Epic 14 story 14.2 : bannière de bienvenue ─────────────────────────── */
function AccueilHero({ email, topTools }) {
  const name = email ? email.split('@')[0] : 'admin';
  const demanded = topTools.filter((t) => t.signups > 0);
  return (
    <div className="rounded-[24px] p-6 mb-4 bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-sm">
      <p className="text-[17px] font-bold mb-0.5">Bienvenue, {name} 👋</p>
      <p className="text-on-primary text-opacity-80 text-[13px] mb-4">
        Voici ce qui se passe cette semaine.
      </p>
      {demanded.length === 0 ? (
        <p className="text-[13px] text-on-primary text-opacity-80">
          Pas encore de demande sur les outils cette semaine.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {demanded.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <div
                key={tool.id}
                className="flex items-center gap-1.5 bg-on-primary bg-opacity-10 rounded-full pl-2.5 pr-3 py-1.5"
              >
                <ToolIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="text-[12.5px] font-semibold">{tool.name}</span>
                <span className="text-[12px] text-on-primary text-opacity-70">{tool.signups}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Epic 14 story 14.2 : carte à anneau de progression ─────────────────── */
function StatRingCard({ label, value, ratio, onSelect, loading, error }) {
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const displayValue = loading ? '…' : error ? '—' : value;
  const clamped = loading || error ? 0 : Math.min(1, Math.max(0, ratio));
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className={`text-left bg-surface-container-lowest border border-surface-variant rounded-[24px] p-4 shadow-sm flex items-center gap-3 ${
        onSelect
          ? `cursor-pointer hover:border-outline-variant transition-colors ${FOCUS_RING}`
          : 'cursor-default'
      }`}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" className="flex-shrink-0" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r={r}
          strokeWidth="5"
          fill="none"
          className="text-surface-variant"
          stroke="currentColor"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          strokeWidth="5"
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="min-w-0">
        <div className="font-display-lg text-xl font-bold text-on-surface">{displayValue}</div>
        <div className="font-label-caps text-label-caps uppercase text-on-surface-variant truncate">
          {label}
        </div>
      </div>
    </button>
  );
}

/* ── Epic 14 story 14.3 : graphique quotidien d'utilisation IA ──────────── */
const ENDPOINT_LABELS = { 'gemini-proxy': 'Assistant IA', 'course-draft': 'Brouillon vidéo' };
const ENDPOINT_COLORS = { 'gemini-proxy': '#5b3cdd', 'course-draft': '#7459f7' };

function pivotAiUsageDaily(rows) {
  const byDay = new Map();
  for (const row of rows) {
    if (!byDay.has(row.day)) byDay.set(row.day, { day: row.day });
    byDay.get(row.day)[row.endpoint] = row.total_tokens;
  }
  return [...byDay.values()];
}

function AiUsageChartCard({ daily, loading, error, onSelect }) {
  const data = pivotAiUsageDaily(daily || []);
  const hasData = data.some((d) => (d['gemini-proxy'] ?? 0) + (d['course-draft'] ?? 0) > 0);

  return (
    <AccueilCard
      title="Utilisation IA — 14 derniers jours"
      icon={BarChart3}
      onSelect={onSelect}
      ctaLabel="Voir l'utilisation"
    >
      {loading ? (
        <p className="text-on-surface-variant text-sm">Chargement…</p>
      ) : error ? (
        <p className="text-on-surface-variant text-sm">Indisponible pour l&apos;instant.</p>
      ) : !hasData ? (
        <p className="text-on-surface-variant text-sm">Aucune donnée pour l&apos;instant.</p>
      ) : (
        <div className="h-56 -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e2e1" />
              <XAxis
                dataKey="day"
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                }
                tick={{ fontSize: 11, fill: '#484555' }}
                axisLine={{ stroke: '#e5e2e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#484555' }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                formatter={(v) => Number(v).toLocaleString('fr-FR')}
                labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR')}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => ENDPOINT_LABELS[v] || v} />
              <Bar
                dataKey="gemini-proxy"
                stackId="tokens"
                fill={ENDPOINT_COLORS['gemini-proxy']}
                name="gemini-proxy"
              />
              <Bar
                dataKey="course-draft"
                stackId="tokens"
                fill={ENDPOINT_COLORS['course-draft']}
                name="course-draft"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AccueilCard>
  );
}

/* ── Epic 14 stories 14.4/14.6 : signaux admin partagés ──────────────────
   Une seule liste, dans l'ordre de priorité — TodoCard l'affiche en entier,
   SuggestionBanner n'en montre que le premier. Jamais deux implémentations
   du même calcul. */
function computeAdminSignals({
  isKeyStale,
  daysSinceRotation,
  draftCount,
  topDemandTool,
  onSelectAiUsage,
  onSelectCourses,
  onSelectWaitlist,
}) {
  const signals = [];
  if (isKeyStale) {
    signals.push({
      id: 'key-stale',
      text:
        daysSinceRotation === null
          ? 'Clé Gemini : aucune rotation connue'
          : `Clé Gemini à tourner (${daysSinceRotation} jours)`,
      cta: "Voir l'utilisation",
      onSelect: onSelectAiUsage,
    });
  }
  if (draftCount > 0) {
    signals.push({
      id: 'drafts',
      text: `${draftCount} brouillon${draftCount > 1 ? 's' : ''} non publié${draftCount > 1 ? 's' : ''}`,
      cta: 'Voir les cours',
      onSelect: onSelectCourses,
    });
  }
  if (topDemandTool && topDemandTool.signups > 0) {
    signals.push({
      id: 'demand',
      text: `${topDemandTool.name} : ${topDemandTool.signups} inscription${topDemandTool.signups > 1 ? 's' : ''}, toujours en préparation`,
      cta: 'Voir la demande',
      onSelect: onSelectWaitlist,
    });
  }
  return signals;
}

/* ── Epic 14 story 14.4 : derniers cours + à faire ───────────────────────── */
function RecentCoursesCard({ courses, onSelectCourses }) {
  const recent = [...courses]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);
  return (
    <AccueilCard
      title="Derniers cours"
      icon={BookOpen}
      onSelect={onSelectCourses}
      ctaLabel="Voir les cours"
    >
      {recent.length === 0 ? (
        <p className="text-on-surface-variant text-sm">Aucun cours pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2.5">
          {recent.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-on-surface truncate">{c.title}</span>
              <span
                className={`flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  c.published
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {c.published ? 'Publié' : 'Brouillon'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AccueilCard>
  );
}

function TodoCard({ signals }) {
  return (
    <AccueilCard title="À faire" icon={AlertTriangle}>
      {signals.length === 0 ? (
        <p className="text-on-surface-variant text-sm">Rien à signaler.</p>
      ) : (
        <ul className="space-y-2.5">
          {signals.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={s.onSelect}
                className={`flex items-center justify-between gap-2 w-full text-left text-[13px] font-semibold text-on-surface hover:text-primary transition-colors rounded ${FOCUS_RING}`}
              >
                <span className="truncate">{s.text}</span>
                <span className="flex-shrink-0 text-on-surface-variant">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AccueilCard>
  );
}

/* ── Epic 14 story 14.5 : leaderboard demande outils ─────────────────────── */
const LEADERBOARD_RANK_CLASS = [
  'bg-primary text-on-primary',
  'bg-secondary text-on-secondary',
  'bg-tertiary text-on-tertiary',
];

function DemandLeaderboardCard({ topTools, loading, error, onSelect }) {
  return (
    <AccueilCard
      title="Outils les plus demandés"
      icon={Wrench}
      onSelect={onSelect}
      ctaLabel="Voir la demande"
    >
      {loading ? (
        <p className="text-on-surface-variant text-sm">Chargement…</p>
      ) : error ? (
        <p className="text-on-surface-variant text-sm">Indisponible pour l&apos;instant.</p>
      ) : topTools.every((t) => t.signups === 0) ? (
        <p className="text-on-surface-variant text-sm">Aucune inscription pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2.5">
          {topTools.map((tool, i) => {
            const ToolIcon = tool.icon;
            return (
              <li key={tool.id} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    LEADERBOARD_RANK_CLASS[i] || 'bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  {i + 1}
                </span>
                <ToolIcon
                  className="w-4 h-4 text-on-surface-variant flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0 text-[13px] font-semibold text-on-surface truncate">
                  {tool.name}
                </span>
                <span className="text-[13px] text-on-surface-variant flex-shrink-0">
                  {tool.signups}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </AccueilCard>
  );
}

/* ── Epic 14 story 14.6 : bannière d'action suggérée ─────────────────────── */
function SuggestionBanner({ signals }) {
  if (signals.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-surface-variant rounded-[24px] px-6 py-4 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
        <p className="text-on-surface-variant text-[13px] font-semibold">
          Tout est à jour — rien ne réclame ton attention.
        </p>
      </div>
    );
  }
  const top = signals[0];
  return (
    <div className="bg-primary text-on-primary rounded-[24px] px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="font-label-caps text-label-caps uppercase text-on-primary text-opacity-80 mb-1">
          À faire en priorité
        </p>
        <p className="font-bold text-[15px]">{top.text}</p>
      </div>
      <button
        type="button"
        onClick={top.onSelect}
        className={`flex-shrink-0 bg-on-primary text-primary font-cta-pill text-[13px] font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity cursor-pointer ${FOCUS_RING}`}
      >
        {top.cta}
      </button>
    </div>
  );
}

function AdminAccueilView({
  email,
  courses,
  published,
  waitlistCounts,
  waitlistLoading,
  waitlistError,
  aiUsage,
  lastRotation,
  aiUsageLoading,
  aiUsageError,
  aiDaily,
  aiDailyLoading,
  aiDailyError,
  notifOverview,
  notifLoading,
  notifError,
  onSelectCourses,
  onSelectWaitlist,
  onSelectAiUsage,
  onAddCourse,
}) {
  const byToolId = new Map((waitlistCounts || []).map((c) => [c.tool_id, c.signups]));
  const topTools = TOOLS.filter((t) => t.status !== 'live')
    .map((t) => ({ ...t, signups: byToolId.get(t.id) ?? 0 }))
    .sort((a, b) => b.signups - a.signups)
    .slice(0, 3);

  const window7 = (aiUsage || []).filter((r) => r.window_days === 7);
  const totalTokens7 = window7.reduce((sum, r) => sum + r.total_tokens, 0);
  const daysSinceRotation = lastRotation
    ? Math.floor((Date.now() - new Date(lastRotation.rotated_at).getTime()) / 86_400_000)
    : null;
  const isKeyStale = daysSinceRotation === null || daysSinceRotation >= KEY_ROTATION_WARNING_DAYS;
  const draftCount = courses.length - published;

  const signals = computeAdminSignals({
    isKeyStale,
    daysSinceRotation,
    draftCount,
    topDemandTool: topTools[0],
    onSelectAiUsage,
    onSelectCourses,
    onSelectWaitlist,
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="font-headline-lg-mobile text-[22px] font-bold text-on-surface">Accueil</h1>
          <p className="text-on-surface-variant text-[13px] mt-1">
            Un coup d&apos;œil sur les cours, la demande d&apos;outils, l&apos;utilisation IA et les
            notifications.
          </p>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onAddCourse}
            className={`flex items-center gap-1.5 bg-primary text-on-primary font-cta-pill text-[13px] font-bold px-4 py-2 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer chunky-shadow ${FOCUS_RING}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Ajouter un cours
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-[13px] font-semibold text-on-surface-variant hover:text-primary transition-colors rounded px-2 py-2 ${FOCUS_RING}`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Voir le site
          </a>
        </div>
      </div>

      <AccueilHero email={email} topTools={topTools} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatRingCard
          label="Total cours"
          value={courses.length}
          ratio={1}
          onSelect={onSelectCourses}
        />
        <StatRingCard
          label="Publiés"
          value={published}
          ratio={courses.length > 0 ? published / courses.length : 0}
          onSelect={onSelectCourses}
        />
        <StatRingCard
          label="Brouillons"
          value={draftCount}
          ratio={courses.length > 0 ? draftCount / courses.length : 0}
          onSelect={onSelectCourses}
        />
        <StatRingCard
          // Pas de dénominateur naturel pour un total de tokens : 20k/7j sert de
          // repère informel pour l'anneau, jamais un vrai quota ou une limite.
          label="Tokens IA (7j)"
          value={totalTokens7.toLocaleString('fr-FR')}
          ratio={totalTokens7 / 20_000}
          onSelect={onSelectAiUsage}
          loading={aiUsageLoading}
          error={aiUsageError}
        />
      </div>

      <div className="mb-4">
        <AiUsageChartCard
          daily={aiDaily}
          loading={aiDailyLoading}
          error={aiDailyError}
          onSelect={onSelectAiUsage}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <RecentCoursesCard courses={courses} onSelectCourses={onSelectCourses} />
        <TodoCard signals={signals} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DemandLeaderboardCard
          topTools={topTools}
          loading={waitlistLoading}
          error={waitlistError}
          onSelect={onSelectWaitlist}
        />
        <AccueilCard title="Notifications" icon={Bell}>
          {notifLoading ? (
            <p className="text-on-surface-variant text-sm">Chargement…</p>
          ) : notifError ? (
            <p className="text-on-surface-variant text-sm">Indisponible pour l&apos;instant.</p>
          ) : !notifOverview ? (
            <p className="text-on-surface-variant text-sm">Aucune donnée pour l&apos;instant.</p>
          ) : (
            <>
              <div className="font-display-lg text-xl font-bold text-on-surface">
                {notifOverview.unread_notifications.toLocaleString('fr-FR')} non lues
              </div>
              <div className="text-on-surface-variant text-sm mb-2">
                {notifOverview.total_notifications.toLocaleString('fr-FR')} envoyées ·{' '}
                {notifOverview.total_users.toLocaleString('fr-FR')} compte
                {notifOverview.total_users > 1 ? 's' : ''}
              </div>
              <p className="text-on-surface-variant text-[12px]">
                {notifOverview.email_enabled_count} avec email activé
                {notifOverview.last_digest_sent_at
                  ? ` · dernier digest le ${new Date(notifOverview.last_digest_sent_at).toLocaleDateString('fr-FR')}`
                  : ' · aucun digest envoyé'}
              </p>
            </>
          )}
        </AccueilCard>
      </div>

      <SuggestionBanner signals={signals} />
    </div>
  );
}

/* ════════════════════════════════════════
   DEMANDE OUTILS — dashboard waitlist (Epic 6, story 6.2)
   Vue séparée du CRUD cours : décompte par outil via get_waitlist_counts()
   (RPC, agrégat only — jamais les emails bruts, AD-4).
════════════════════════════════════════ */
function WaitlistView({ counts, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-8 h-8 border-2 border-surface-variant border-t-primary rounded-full animate-spin"
          role="status"
          aria-label="Chargement de la demande"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low border border-surface-variant rounded-3xl py-16 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-on-surface-variant" aria-hidden="true" />
        </div>
        <p className="font-headline-lg-mobile text-[16px] font-bold text-on-surface mb-1">
          Impossible de charger la demande
        </p>
        <p className="text-on-surface-variant text-sm mb-5">{error}</p>
        <button
          onClick={onRetry}
          className={`flex items-center gap-2 bg-primary text-on-primary font-cta-pill text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer chunky-shadow ${FOCUS_RING}`}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const byToolId = new Map((counts || []).map((c) => [c.tool_id, c.signups]));
  const rows = TOOLS.filter((t) => t.status !== 'live')
    .map((t) => ({ ...t, signups: byToolId.get(t.id) ?? 0 }))
    .sort((a, b) => b.signups - a.signups);
  const maxSignups = Math.max(1, ...rows.map((r) => r.signups));

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-headline-lg-mobile text-[22px] font-bold text-on-surface">
          Demande outils
        </h1>
        <p className="text-on-surface-variant text-[13px] mt-1">
          Inscriptions à la liste d'attente par outil, pour décider quoi construire ensuite.
        </p>
      </div>

      <div className="space-y-2.5">
        {rows.map((tool) => {
          const Icon = tool.icon;
          const pct = Math.round((tool.signups / maxSignups) * 100);
          return (
            <div
              key={tool.id}
              className="bg-surface-container-lowest border border-surface-variant rounded-[24px] px-5 py-4 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-on-surface-variant" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-on-surface truncate mb-1.5">{tool.name}</p>
                <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-display-lg text-xl font-bold text-on-surface">
                  {tool.signups}
                </div>
                <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  inscrit{tool.signups > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   UTILISATION IA — dashboard coûts/tokens + suivi rotation de clé (Epic 11)
   getAiUsageSummary() : agrégats 7j/30j par endpoint (tokens réellement
   consommés par les appels de l'app, jamais le contenu prompts/réponses).
   Le coût affiché est une ESTIMATION (tarif public flash-lite) — jamais la
   facturation réelle Google, hors de portée d'une clé API serveur (AD-13).
   La rotation de clé n'est que de la metadata : la vraie clé ne transite
   jamais par cette vue (`supabase secrets set` reste la seule voie réelle).
════════════════════════════════════════ */
function AiUsageView({
  usage,
  lastRotation,
  loading,
  error,
  rotationSaving,
  onRetry,
  onLogRotation,
}) {
  const [note, setNote] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-8 h-8 border-2 border-surface-variant border-t-primary rounded-full animate-spin"
          role="status"
          aria-label="Chargement de l'utilisation IA"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low border border-surface-variant rounded-3xl py-16 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-on-surface-variant" aria-hidden="true" />
        </div>
        <p className="font-headline-lg-mobile text-[16px] font-bold text-on-surface mb-1">
          Impossible de charger l'utilisation IA
        </p>
        <p className="text-on-surface-variant text-sm mb-5">{error}</p>
        <button
          onClick={onRetry}
          className={`flex items-center gap-2 bg-primary text-on-primary font-cta-pill text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer chunky-shadow ${FOCUS_RING}`}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const rows = usage || [];
  const window30 = rows.filter((r) => r.window_days === 30);
  const totalTokens30 = window30.reduce((sum, r) => sum + r.total_tokens, 0);
  const totalCalls30 = window30.reduce((sum, r) => sum + r.calls, 0);
  const totalCost30 = window30.reduce((sum, r) => sum + estimateUsdCost(r), 0);
  const ENDPOINT_LABELS = {
    'gemini-proxy': 'Assistant IA (chat)',
    'course-draft': 'Brouillon vidéo',
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-headline-lg-mobile text-[22px] font-bold text-on-surface">
          Utilisation IA
        </h1>
        <p className="text-on-surface-variant text-[13px] mt-1">
          Tokens Gemini réellement consommés par l'app — coût estimé à titre indicatif, pas la
          facturation réelle Google.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface-container-low border border-surface-variant rounded-3xl py-16 flex flex-col items-center justify-center text-center mb-6">
          <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-on-surface-variant" aria-hidden="true" />
          </div>
          <p className="font-headline-lg-mobile text-[16px] font-bold text-on-surface mb-1">
            Aucune donnée d'utilisation pour l'instant
          </p>
          <p className="text-on-surface-variant text-sm max-w-sm">
            Les prochains appels à l'assistant IA ou au brouillon vidéo apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Tokens (30j)', value: totalTokens30.toLocaleString('fr-FR') },
              { label: 'Appels (30j)', value: totalCalls30.toLocaleString('fr-FR') },
              { label: 'Coût estimé (30j)', value: `$${totalCost30.toFixed(3)}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-surface-container-lowest border border-surface-variant rounded-[24px] p-5 shadow-sm"
              >
                <div className="font-display-lg text-2xl font-bold text-on-surface mb-0.5">
                  {value}
                </div>
                <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 mb-6">
            {window30.map((row) => (
              <div
                key={row.endpoint}
                className="bg-surface-container-lowest border border-surface-variant rounded-[24px] px-5 py-4 flex items-center gap-4 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-on-surface-variant" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-on-surface truncate mb-0.5">
                    {ENDPOINT_LABELS[row.endpoint] || row.endpoint}
                  </p>
                  <p className="text-on-surface-variant text-[12px]">
                    {row.calls} appel{row.calls > 1 ? 's' : ''} ·{' '}
                    {row.total_tokens.toLocaleString('fr-FR')} tokens
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-display-lg text-xl font-bold text-on-surface">
                    ${estimateUsdCost(row).toFixed(3)}
                  </div>
                  <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    estimé
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rotation de clé — metadata seulement, AD-13 : la vraie clé Gemini ne
          transite jamais par cette vue, seule `supabase secrets set` la change. */}
      {(() => {
        const daysSinceRotation = lastRotation
          ? Math.floor((Date.now() - new Date(lastRotation.rotated_at).getTime()) / 86_400_000)
          : null;
        // Jamais tournée = on ne sait rien de l'âge réel de la clé → traité
        // comme "à vérifier" au même titre qu'une rotation trop ancienne.
        const isStale =
          daysSinceRotation === null || daysSinceRotation >= KEY_ROTATION_WARNING_DAYS;

        return (
          <div className="bg-surface-container-lowest border border-surface-variant rounded-[24px] px-5 py-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isStale ? 'bg-error-container' : 'bg-surface-variant'}`}
              >
                <KeyRound
                  className={`w-5 h-5 ${isStale ? 'text-on-error-container' : 'text-on-surface-variant'}`}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-on-surface mb-0.5">Clé Gemini</p>
                <p className="text-on-surface-variant text-[13px] mb-1">
                  {lastRotation
                    ? `Dernière rotation : ${new Date(lastRotation.rotated_at).toLocaleDateString('fr-FR')} (il y a ${daysSinceRotation} jour${daysSinceRotation > 1 ? 's' : ''})${lastRotation.note ? ` · ${lastRotation.note}` : ''}`
                    : 'Aucune rotation enregistrée.'}
                </p>
                {isStale && (
                  <p className="text-on-error-container text-[12.5px] font-semibold mb-2">
                    {lastRotation
                      ? `⚠ Plus de ${KEY_ROTATION_WARNING_DAYS} jours depuis la dernière rotation — c'est le moment d'y penser.`
                      : '⚠ Aucune rotation connue — impossible de savoir depuis combien de temps cette clé est en service.'}
                  </p>
                )}
                <p className="text-on-surface-variant text-[12px] mb-3">
                  Cet écran ne fait que suivre la rotation, il ne la déclenche pas. Pour tourner la
                  vraie clé :{' '}
                  <code className="text-[11px]">supabase secrets set GEMINI_API_KEY=...</code> puis
                  redéployer les fonctions, comme aujourd'hui.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note optionnelle"
                    className={`flex-1 bg-surface border border-surface-variant rounded-full px-4 py-1.5 text-[13px] text-on-surface placeholder:text-on-surface-variant ${FOCUS_RING}`}
                  />
                  <button
                    type="button"
                    disabled={rotationSaving}
                    onClick={() => {
                      onLogRotation(note || undefined);
                      setNote('');
                    }}
                    className={`flex-shrink-0 flex items-center gap-1.5 bg-primary text-on-primary font-cta-pill text-[13px] font-bold px-4 py-1.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_RING}`}
                  >
                    {rotationSaving ? 'Enregistrement…' : "Marquer comme tournée aujourd'hui"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ════════════════════════════════════════
   ÉDITEUR COURS (ADD / EDIT) — page pleine, pas une modale
════════════════════════════════════════ */
function CourseEditor({ mode, course, onSave, onCancel }) {
  const [form, setForm] = useState({
    module_name: course?.module_name || 'MODULE 1',
    title: course?.title || '',
    description: course?.description || '',
    duration: course?.duration || '',
    image_url: course?.image_url || '',
    video_url: course?.video_url || '',
    content: course?.content || '',
    published: course?.published ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [contentPreview, setContentPreview] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState('');
  const [metaNotice, setMetaNotice] = useState('');
  const videoFileInputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const isYouTubeUrl = matchesHost(form.video_url, YOUTUBE_HOSTS);
  const isTikTokUrl = matchesHost(form.video_url, ['tiktok.com']);
  const isFacebookUrl = matchesHost(form.video_url, ['facebook.com', 'fb.watch']);
  // Bouton unique "Générer un brouillon IA depuis la vidéo" : YouTube passe
  // par son URL (Gemini l'ingère nativement) ; TikTok/Facebook n'ont pas cette
  // capacité côté Gemini, et cette fonction ne doit JAMAIS aller télécharger
  // la vidéo elle-même (CGU — Story 10.1) ⇒ on demande un fichier que l'admin
  // a déjà enregistré lui-même (Story 10.5).
  const showDraftButton = isYouTubeUrl || isTikTokUrl || isFacebookUrl;

  // Sans IA : titre/description depuis la légende TikTok (oEmbed public, sans
  // authentification — cf. epics-video-platforms.md Story 10.4). La miniature
  // renvoyée est un lien CDN signé qui EXPIRE après quelques jours (constaté :
  // ~2-3 jours) — on la propose quand même comme point de départ, avec un
  // avertissement, plutôt que de forcer une étape manuelle en plus.
  const handleFetchTikTokMetadata = async () => {
    setMetaError('');
    setMetaNotice('');
    setMetaLoading(true);
    try {
      const res = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(form.video_url)}`
      );
      if (!res.ok) throw new Error(`TikTok a répondu ${res.status}`);
      const data = await res.json();
      const caption = sanitizeText(data.title);
      setForm((f) => ({
        ...f,
        title: captionToTitle(caption) || f.title,
        description: caption || f.description,
        image_url: data.thumbnail_url || f.image_url,
      }));
      setMetaNotice(
        data.thumbnail_url
          ? 'Titre, description et miniature récupérés depuis TikTok — le lien de la miniature est temporaire (expire après quelques jours), remplace-le si tu veux la garder durablement.'
          : 'Titre et description récupérés depuis TikTok.'
      );
    } catch {
      setMetaError('Impossible de récupérer les informations depuis TikTok. Vérifie le lien.');
    } finally {
      setMetaLoading(false);
    }
  };

  // Sans IA, sans appel réseau : la miniature YouTube se déduit directement de
  // l'ID vidéo (URL CDN publique stable, jamais d'expiration).
  const handleUseYouTubeThumbnail = () => {
    const videoId = extractYouTubeVideoId(form.video_url);
    if (!videoId) return;
    setMetaError('');
    set('image_url', `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
    setMetaNotice('Miniature YouTube récupérée.');
  };

  const applyDraft = (draft) => {
    setForm((f) => ({
      ...f,
      title: draft.title || f.title,
      description: draft.description || f.description,
      duration: draft.duration || f.duration,
      content: draft.content || f.content,
    }));
    setContentPreview(false);
  };

  const handleGenerateDraft = async () => {
    setDraftError('');
    setDraftLoading(true);
    const result = await generateCourseDraftFromVideo(form.video_url);
    setDraftLoading(false);
    if (!result.success) {
      setDraftError(result.error);
      return;
    }
    applyDraft(result.draft);
  };

  // TikTok/Facebook : pas d'URL ingérable par Gemini, et cette fonction ne
  // doit jamais aller télécharger la vidéo elle-même (Story 10.1) — l'admin
  // fournit un fichier qu'il a déjà enregistré lui-même. Il part vers le
  // bucket privé `course-draft-uploads` (RLS admin-only), l'Edge Function le
  // lit puis le supprime aussitôt après génération, succès ou échec (Story
  // 10.5) — jamais conservé durablement.
  const handleGenerateDraftFromFile = async (file) => {
    if (!file) return;
    if (!/^video\/(mp4|quicktime|webm|x-m4v)$/.test(file.type)) {
      setDraftError('Formats supportés : .mp4, .mov, .webm, .m4v.');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setDraftError('Fichier trop volumineux (200 Mo maximum).');
      return;
    }

    setDraftError('');
    setDraftLoading(true);
    try {
      const storagePath = await uploadCourseDraftVideo(file);
      const result = await generateCourseDraftFromUploadedVideo(storagePath);
      if (!result.success) {
        setDraftError(result.error);
        return;
      }
      applyDraft(result.draft);
    } catch {
      // Message générique volontaire : l'erreur brute (Storage/Postgres) n'a
      // rien d'exploitable pour l'admin — seule la cause (upload) est utile.
      setDraftError("Échec de l'envoi du fichier vers le serveur. Réessaie.");
    } finally {
      setDraftLoading(false);
    }
  };

  const handleClickGenerateDraft = () => {
    if (isYouTubeUrl) {
      handleGenerateDraft();
      return;
    }
    // TikTok/Facebook : ouvre le sélecteur de fichier — la génération se
    // lance automatiquement une fois un fichier choisi (input onChange).
    videoFileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <button
        type="button"
        onClick={onCancel}
        className={`flex items-center text-[13px] font-semibold text-on-surface-variant hover:text-primary w-fit bg-surface-container-lowest px-4 py-2 rounded-lg border border-surface-variant shadow-sm transition-all hover:shadow-md cursor-pointer mb-6 ${FOCUS_RING}`}
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
        Retour aux cours
      </button>

      <h1 className="font-headline-lg-mobile text-[22px] font-bold text-on-surface mb-8">
        {mode === 'add' ? 'Ajouter un cours' : `Modifier « ${course.title} »`}
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Module */}
        <div>
          <label
            htmlFor="course_module"
            className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5"
          >
            Module
          </label>
          <select
            id="course_module"
            value={form.module_name}
            onChange={(e) => set('module_name', e.target.value)}
            className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-all text-on-surface cursor-pointer ${FOCUS_RING}`}
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Titre */}
        <div>
          <label
            htmlFor="course_title"
            className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5"
          >
            Titre *
          </label>
          <input
            id="course_title"
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ex : Introduction à l'IA pour l'UI"
            className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface ${FOCUS_RING}`}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="course_description"
            className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5"
          >
            Description
          </label>
          <textarea
            id="course_description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Décrivez le contenu de ce cours..."
            rows={3}
            className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface resize-none ${FOCUS_RING}`}
          />
        </div>

        {/* Durée + Image */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="course_duration"
              className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5"
            >
              Durée
            </label>
            <input
              id="course_duration"
              type="text"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              placeholder="Ex : 12:45"
              className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface ${FOCUS_RING}`}
            />
          </div>
          <div>
            <span className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5">
              Statut
            </span>
            <button
              type="button"
              onClick={() => set('published', !form.published)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer border ${FOCUS_RING} ${
                form.published
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-outline'
              }`}
            >
              {form.published ? (
                <Eye className="w-4 h-4" aria-hidden="true" />
              ) : (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              )}
              {form.published ? 'Publié' : 'Brouillon'}
            </button>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="course_image_url"
            className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5"
          >
            URL de l'image
          </label>
          <input
            id="course_image_url"
            type="url"
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://..."
            className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface ${FOCUS_RING}`}
          />
          {form.image_url && (
            <div className="mt-2 w-full h-28 rounded-xl overflow-hidden bg-surface-variant">
              <img
                src={form.image_url}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Video URL */}
        <div>
          <label
            htmlFor="course_video_url"
            className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1.5 flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
            URL de la vidéo (Teams / Stream / YouTube / TikTok / Facebook)
          </label>
          <input
            id="course_video_url"
            type="url"
            value={form.video_url}
            onChange={(e) => set('video_url', e.target.value)}
            placeholder="Collez ici le lien de partage de votre vidéo..."
            className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface ${FOCUS_RING}`}
          />
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            Formats supportés : SharePoint, Microsoft Stream, YouTube (dont Shorts), TikTok,
            Facebook (dont Reels et liens fb.watch), ou lien direct (.mp4)
          </p>
          {showDraftButton && (
            <div className="mt-3">
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = ''; // permet de re-choisir le même fichier plus tard
                  handleGenerateDraftFromFile(file);
                }}
              />
              <button
                type="button"
                onClick={handleClickGenerateDraft}
                disabled={draftLoading}
                className={`flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant text-[12px] font-semibold px-3.5 py-2 rounded-lg hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${FOCUS_RING}`}
              >
                {draftLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {draftLoading
                  ? 'Génération en cours…'
                  : form.content.trim() || form.title.trim()
                    ? 'Regénérer le brouillon IA'
                    : 'Générer un brouillon IA depuis la vidéo'}
              </button>
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                {isYouTubeUrl
                  ? "Gemini regarde la vidéo YouTube et préremplit titre, description et contenu écrit — à relire avant d'enregistrer, rien n'est publié automatiquement."
                  : "Choisis un fichier vidéo que tu as déjà enregistré toi-même (TikTok/Facebook ne peuvent pas être récupérés automatiquement) — Gemini l'analyse et préremplit le formulaire, puis le fichier est supprimé du serveur."}
              </p>
              {draftError && (
                <p role="alert" className="text-[12px] text-error font-medium mt-1.5">
                  {draftError}
                </p>
              )}
              {isYouTubeUrl && (
                <button
                  type="button"
                  onClick={handleUseYouTubeThumbnail}
                  className={`flex items-center gap-2 bg-surface-variant text-on-surface-variant hover:bg-outline-variant hover:text-on-surface text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer mt-2 ${FOCUS_RING}`}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Utiliser la miniature YouTube
                </button>
              )}
            </div>
          )}

          {isTikTokUrl && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleFetchTikTokMetadata}
                disabled={metaLoading}
                className={`flex items-center gap-2 bg-surface-variant text-on-surface-variant hover:bg-outline-variant hover:text-on-surface text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${FOCUS_RING}`}
              >
                {metaLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-on-surface-variant/30 border-t-on-surface-variant rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {metaLoading
                  ? 'Récupération…'
                  : 'Récupérer titre, description et miniature depuis TikTok'}
              </button>
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                Sans IA — lit uniquement la légende publique du post (API oEmbed officielle de
                TikTok, sans authentification).
              </p>
            </div>
          )}

          {metaNotice && (
            <p className="text-[12px] text-tertiary font-medium mt-1.5">{metaNotice}</p>
          )}
          {metaError && (
            <p role="alert" className="text-[12px] text-error font-medium mt-1.5">
              {metaError}
            </p>
          )}
        </div>

        {/* Contenu écrit (Mode Lecture) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-outline" aria-hidden="true" />
              Contenu écrit (Mode Lecture)
            </span>
            <div className="flex bg-surface-variant p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setContentPreview(false)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${FOCUS_RING} ${
                  !contentPreview
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant'
                }`}
              >
                Écrire
              </button>
              <button
                type="button"
                onClick={() => setContentPreview(true)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${FOCUS_RING} ${
                  contentPreview
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant'
                }`}
              >
                Aperçu
              </button>
            </div>
          </div>
          {contentPreview ? (
            <div className="w-full min-h-[400px] bg-surface border border-outline-variant rounded-xl px-5 py-4">
              {form.content.trim() ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-[13px] text-on-surface-variant">
                  Rien à prévisualiser pour l'instant.
                </p>
              )}
            </div>
          ) : (
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder={
                'Le texte que lira le designer en "Mode Lecture" (Markdown supporté : titres avec #, listes, **gras**…).\n\nLaissez vide si ce cours reste uniquement vidéo.'
              }
              rows={18}
              aria-label="Contenu écrit du cours"
              className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-5 py-4 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface resize-y font-mono leading-relaxed ${FOCUS_RING}`}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-surface-variant">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-full border border-outline-variant text-[13px] font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer ${FOCUS_RING}`}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-on-primary text-[13px] font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer chunky-shadow ${FOCUS_RING}`}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" aria-hidden="true" />
            )}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════
   MODAL SUPPRESSION
════════════════════════════════════════ */
function DeleteModal({ course, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete_modal_title"
        className="bg-surface-container-lowest rounded-bento shadow-2xl w-full max-w-sm p-7"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-on-error-container" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete_modal_title" className="text-[15px] font-bold text-on-surface">
              Supprimer ce cours ?
            </h3>
            <p className="text-[12px] text-on-surface-variant">Cette action est irréversible.</p>
          </div>
        </div>
        <div className="bg-surface-variant rounded-xl px-4 py-3 mb-6">
          <p className="text-[13px] font-semibold text-on-surface truncate">{course.title}</p>
          <p className="text-[11px] text-on-surface-variant">{course.module_name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-full border border-outline-variant text-[13px] font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer ${FOCUS_RING}`}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-full bg-error text-on-error text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer ${FOCUS_RING}`}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   EMPTY STATE
════════════════════════════════════════ */
function EmptyState({ onAdd }) {
  return (
    <div className="bg-surface-container-low border border-surface-variant rounded-3xl py-24 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
        <BookOpen className="w-7 h-7 text-on-surface-variant" aria-hidden="true" />
      </div>
      <p className="font-headline-lg-mobile text-[16px] font-bold text-on-surface mb-1">
        Aucun cours pour l'instant
      </p>
      <p className="text-on-surface-variant text-sm mb-5">
        Commencez par ajouter votre premier cours.
      </p>
      <button
        onClick={onAdd}
        className={`flex items-center gap-2 bg-primary text-on-primary font-cta-pill text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer chunky-shadow ${FOCUS_RING}`}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        Ajouter un cours
      </button>
    </div>
  );
}
