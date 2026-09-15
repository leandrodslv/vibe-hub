import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
} from '../services/supabase';
import { generateCourseDraftFromVideo } from '../services/ai';
import { matchesHost } from '../lib/validation';
import { TOOLS } from '../data/tools';

const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be'];

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
  return <Dashboard onLogout={handleLogout} />;
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
   HEADER (marque + déconnexion, commun à la liste et à l'éditeur)
════════════════════════════════════════ */
function AdminHeader({ onLogout }) {
  return (
    <div className="h-14 bg-surface-container-lowest border-b-2 border-surface-variant flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <a
          href="/"
          className={`font-display-lg text-xl font-extrabold tracking-tight text-on-surface hover:text-primary transition-colors rounded ${FOCUS_RING}`}
        >
          vibe hub
        </a>
        <div className="w-px h-4 bg-surface-variant" aria-hidden="true" />
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          Admin
        </span>
      </div>
      <button
        onClick={onLogout}
        className={`flex items-center gap-1.5 text-[13px] font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded ${FOCUS_RING}`}
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Déconnexion
      </button>
    </div>
  );
}

/* ════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════ */
function Dashboard({ onLogout }) {
  const [view, setView] = useState('courses'); // 'courses' | 'waitlist'
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

  const load = async () => {
    setLoading(true);
    const data = await getAllCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
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
        <AdminHeader onLogout={onLogout} />
        <CourseEditor
          mode={editing.mode}
          course={editing.course}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <AdminHeader onLogout={onLogout} />

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Onglets Cours / Demande outils */}
        <div className="flex items-center bg-surface-variant p-1 rounded-full gap-1 w-fit mb-8">
          <button
            type="button"
            onClick={() => setView('courses')}
            aria-pressed={view === 'courses'}
            className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 cursor-pointer ${FOCUS_RING} ${
              view === 'courses'
                ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Cours
          </button>
          <button
            type="button"
            onClick={openWaitlistView}
            aria-pressed={view === 'waitlist'}
            className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 cursor-pointer ${FOCUS_RING} ${
              view === 'waitlist'
                ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Demande outils
          </button>
        </div>

        {view === 'waitlist' ? (
          <WaitlistView
            counts={waitlistCounts}
            loading={waitlistLoading}
            error={waitlistError}
            onRetry={loadWaitlist}
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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const isYouTubeUrl = matchesHost(form.video_url, YOUTUBE_HOSTS);

  const handleGenerateDraft = async () => {
    setDraftError('');
    setDraftLoading(true);
    const result = await generateCourseDraftFromVideo(form.video_url);
    setDraftLoading(false);
    if (!result.success) {
      setDraftError(result.error);
      return;
    }
    setForm((f) => ({
      ...f,
      title: result.draft.title || f.title,
      description: result.draft.description || f.description,
      duration: result.draft.duration || f.duration,
      content: result.draft.content || f.content,
    }));
    setContentPreview(false);
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
            URL de la vidéo (Teams / Stream / YouTube)
          </label>
          <input
            id="course_video_url"
            type="url"
            value={form.video_url}
            onChange={(e) => set('video_url', e.target.value)}
            placeholder="Collez ici le lien de partage de votre vidéo Teams..."
            className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 text-on-surface ${FOCUS_RING}`}
          />
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            Formats supportés : lien SharePoint, Microsoft Stream, YouTube, ou lien direct (.mp4)
          </p>
          {isYouTubeUrl && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleGenerateDraft}
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
                Gemini regarde la vidéo YouTube et préremplit titre, description et contenu écrit —
                à relire avant d'enregistrer, rien n'est publié automatiquement.
              </p>
              {draftError && (
                <p role="alert" className="text-[12px] text-error font-medium mt-1.5">
                  {draftError}
                </p>
              )}
            </div>
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
