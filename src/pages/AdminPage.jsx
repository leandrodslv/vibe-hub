import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  BookOpen,
  X,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  GripVertical,
  Mail,
  Lock,
  Video,
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
} from '../services/supabase';

const MODULES = ['MODULE 1', 'MODULE 2', 'MODULE 3'];

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
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#EAEAEA] border-t-black rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl shadow-sm w-full max-w-sm p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-[16px] font-bold text-black mb-1.5">Accès refusé</h1>
        <p className="text-[13px] text-[#666] mb-6">
          {email ? (
            <>
              Le compte <span className="font-semibold text-black">{email}</span> n&apos;a pas les
              droits admin.
            </>
          ) : (
            "Ce compte n'a pas les droits admin."
          )}
        </p>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#333] transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
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
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl shadow-sm w-full max-w-sm p-8">
        <div className="mb-7 text-center">
          <span className="text-xl font-extrabold tracking-tight text-black">vibe hub</span>
          <p className="text-[#999] text-[12px] mt-1 font-medium uppercase tracking-widest">
            Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[12px] font-semibold text-black mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="admin@vibehub.com"
                className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-[13px] outline-none transition-all placeholder:text-[#CCCCCC] text-black ${
                  error ? 'border-red-400' : 'border-[#EAEAEA] focus:border-black'
                }`}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-[12px] font-semibold text-black mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••••"
                className={`w-full bg-white border rounded-xl pl-10 pr-10 py-2.5 text-[13px] outline-none transition-all placeholder:text-[#CCCCCC] text-black ${
                  error ? 'border-red-400' : 'border-[#EAEAEA] focus:border-black'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-black transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-black/10"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
   DASHBOARD
════════════════════════════════════════ */
function Dashboard({ onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', course? }
  const [deleteTarget, setDeleteTarget] = useState(null); // course object

  const load = async () => {
    setLoading(true);
    const data = await getAllCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (formData) => {
    if (modal.mode === 'add') {
      const maxOrder = courses.reduce((m, c) => Math.max(m, c.order_index), 0);
      const newCourse = await createCourse({ ...formData, order_index: maxOrder + 1 });
      setCourses((prev) => [...prev, newCourse]);
    } else {
      const updated = await updateCourse(modal.course.id, formData);
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
    setModal(null);
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

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* ── Header ── */}
      <div className="h-14 bg-white border-b border-[#EAEAEA] flex items-center justify-between px-8 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xl font-extrabold tracking-tight text-black hover:opacity-70 transition-opacity"
          >
            vibe hub
          </a>
          <div className="w-px h-4 bg-[#EAEAEA]" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-[#999]">Admin</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[#666] hover:text-black transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total cours', value: courses.length },
            { label: 'Publiés', value: published },
            { label: 'Brouillons', value: courses.length - published },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-bold text-black mb-0.5">{value}</div>
              <div className="text-[12px] font-semibold text-[#999] uppercase tracking-wide">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Header liste */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[22px] font-bold text-black">Cours</h1>
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 bg-black text-white text-[13px] font-bold px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors cursor-pointer shadow-lg shadow-black/10"
          >
            <Plus className="w-4 h-4" />
            Ajouter un cours
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#EAEAEA] border-t-black rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState onAdd={() => setModal({ mode: 'add' })} />
        ) : (
          <div className="space-y-2.5">
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                onEdit={() => setModal({ mode: 'edit', course })}
                onDelete={() => setDeleteTarget(course)}
                onToggle={() => togglePublished(course)}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <CourseModal
          mode={modal.mode}
          course={modal.course}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

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
    <div className="bg-white border border-[#EAEAEA] rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#CCCCCC] transition-colors shadow-sm">
      <GripVertical className="w-4 h-4 text-[#CCCCCC] flex-shrink-0" />

      {/* Image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#F4F4F4]">
        {course.image_url ? (
          <img src={course.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#CCCCCC]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] bg-[#F4F4F4] px-2 py-0.5 rounded">
            {course.module_name}
          </span>
          <span className="text-[10px] font-medium text-[#999]">{course.duration}</span>
          {course.video_url && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
              <Video className="w-3 h-3" /> Vidéo
            </span>
          )}
        </div>
        <p className="text-[14px] font-bold text-black truncate">{course.title}</p>
        <p className="text-[12px] text-[#666] truncate">{course.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggle}
          title={course.published ? 'Masquer' : 'Publier'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            course.published ? 'bg-black text-white' : 'bg-[#F4F4F4] text-[#999] hover:bg-[#EAEAEA]'
          }`}
        >
          {course.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg bg-[#F4F4F4] text-[#666] hover:bg-[#EAEAEA] hover:text-black flex items-center justify-center transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg bg-[#F4F4F4] text-[#666] hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MODAL COURS (ADD / EDIT)
════════════════════════════════════════ */
function CourseModal({ mode, course, onSave, onClose }) {
  const [form, setForm] = useState({
    module_name: course?.module_name || 'MODULE 1',
    title: course?.title || '',
    description: course?.description || '',
    duration: course?.duration || '',
    image_url: course?.image_url || '',
    video_url: course?.video_url || '',
    published: course?.published ?? true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-[15px] font-bold text-black">
            {mode === 'add' ? 'Ajouter un cours' : 'Modifier le cours'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-[#999] hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Module */}
          <div>
            <label className="block text-[12px] font-semibold text-black mb-1.5">Module</label>
            <select
              value={form.module_name}
              onChange={(e) => set('module_name', e.target.value)}
              className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-black transition-all text-black cursor-pointer"
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
            <label className="block text-[12px] font-semibold text-black mb-1.5">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex : Introduction à l'IA pour l'UI"
              className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-black transition-all placeholder:text-[#CCCCCC] text-black"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-black mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Décrivez le contenu de ce cours..."
              rows={3}
              className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-black transition-all placeholder:text-[#CCCCCC] text-black resize-none"
            />
          </div>

          {/* Durée + Image */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-black mb-1.5">Durée</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                placeholder="Ex : 12:45"
                className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-black transition-all placeholder:text-[#CCCCCC] text-black"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-black mb-1.5">Statut</label>
              <button
                type="button"
                onClick={() => set('published', !form.published)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer border ${
                  form.published
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[#666] border-[#EAEAEA] hover:border-[#CCCCCC]'
                }`}
              >
                {form.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {form.published ? 'Publié' : 'Brouillon'}
              </button>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-[12px] font-semibold text-black mb-1.5">
              URL de l'image
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => set('image_url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-black transition-all placeholder:text-[#CCCCCC] text-black"
            />
            {form.image_url && (
              <div className="mt-2 w-full h-28 rounded-xl overflow-hidden bg-[#F4F4F4]">
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
            <label className="block text-[12px] font-semibold text-black mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-blue-500" />
              URL de la vidéo (Teams / Stream / YouTube)
            </label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => set('video_url', e.target.value)}
              placeholder="Collez ici le lien de partage de votre vidéo Teams..."
              className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-black transition-all placeholder:text-[#CCCCCC] text-black"
            />
            <p className="text-[11px] text-[#999] mt-1.5">
              Formats supportés : lien SharePoint, Microsoft Stream, YouTube, ou lien direct (.mp4)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#EAEAEA] text-[13px] font-semibold text-[#666] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black text-white text-[13px] font-bold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-black/10"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-black">Supprimer ce cours ?</h3>
            <p className="text-[12px] text-[#666]">Cette action est irréversible.</p>
          </div>
        </div>
        <div className="bg-[#F4F4F4] rounded-xl px-4 py-3 mb-6">
          <p className="text-[13px] font-semibold text-black truncate">{course.title}</p>
          <p className="text-[11px] text-[#999]">{course.module_name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#EAEAEA] text-[13px] font-semibold text-[#666] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-colors cursor-pointer"
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
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-[#F4F4F4] rounded-2xl flex items-center justify-center mb-4">
        <BookOpen className="w-7 h-7 text-[#999]" />
      </div>
      <p className="text-black font-semibold mb-1">Aucun cours pour l'instant</p>
      <p className="text-[#666] text-sm mb-5">Commencez par ajouter votre premier cours.</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#333] transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Ajouter un cours
      </button>
    </div>
  );
}
