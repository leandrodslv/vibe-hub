import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Bell, Wrench } from 'lucide-react';
import { getCourses } from '../../../services/supabase';
import { getPersistedCourseProgress } from '../../../lib/progress.js';
import { useNotifications } from '../../../hooks/useNotifications.js';
import { relativeTime } from '../../../lib/relativeTime.js';
import { TOOLS } from '../../../data/tools.js';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

function Spinner({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center py-6">
      <div
        className="w-6 h-6 border-2 border-surface-variant border-t-primary rounded-full animate-spin"
        role="status"
        aria-label={label}
      />
    </div>
  );
}

function CardShell({ title, icon: Icon, children }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-on-surface-variant" aria-hidden="true" />
        <h2 className="font-headline-lg-mobile text-[16px] font-bold text-on-surface">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function CardCta({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-auto flex items-center justify-between gap-2 bg-primary text-on-primary font-cta-pill text-sm font-bold px-4 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer ${FOCUS_RING}`}
    >
      <span className="truncate">{children}</span>
      <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
    </button>
  );
}

/**
 * Épic 12 — aperçu du Workspace, nouvel onglet par défaut de `/app` (routes.js).
 * Pure composition en lecture : aucune nouvelle donnée, aucun nouveau fetch — les
 * trois cartes réutilisent getCourses()/localStorage["progress_courses"]/useNotifications()/
 * TOOLS exactement comme ModulesTab, NotificationsTab et OutilsTab le font déjà.
 */
export default function AccueilTab({ active, onNavigate }) {
  // ── Progression cours ──
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  // Les quatre onglets restent montés en permanence (WorkspacePage.jsx) : sans ce
  // re-lu à chaque activation, terminer un cours dans l'onglet Cours puis revenir
  // ici afficherait encore l'ancien décompte (la lecture initiale ne capte pas les
  // écritures localStorage faites pendant qu'Accueil était simplement masqué).
  const [progress, setProgress] = useState(getPersistedCourseProgress);

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch((err) => {
        console.error('getCourses() a échoué (Accueil) :', err);
        setCoursesError('Impossible de charger les cours.');
      })
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    if (active) setProgress(getPersistedCourseProgress());
  }, [active]);

  const nextCourse = useMemo(
    () => courses.find((c) => (progress[c.id] ?? 0) < 100),
    [courses, progress]
  );
  const completedCount = useMemo(
    () => courses.filter((c) => (progress[c.id] ?? 0) === 100).length,
    [courses, progress]
  );

  // ── Notifications ──
  const { authResolved, authenticated, notifications, unreadCount } = useNotifications();
  const recentNotifications = notifications.slice(0, 3);

  // ── Outils ──
  const liveTools = TOOLS.filter((t) => t.status === 'live');

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide pr-2 pb-4 bg-surface animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-display-lg text-display-lg md:text-display-xl text-on-surface leading-[1.05] mb-3">
          Bon retour <span className="text-primary">parmi nous</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Un aperçu de ton activité — reprends où tu en étais, ou file directement vers ce qui
          t&apos;intéresse.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-grid-gutter">
        {/* Progression cours */}
        <CardShell title="Cours" icon={BookOpen}>
          {coursesLoading ? (
            <Spinner label="Chargement des cours" />
          ) : coursesError ? (
            <p className="text-on-surface-variant text-sm flex-1">{coursesError}</p>
          ) : courses.length === 0 ? (
            <p className="text-on-surface-variant text-sm flex-1">
              Aucun cours disponible pour l&apos;instant.
            </p>
          ) : (
            <>
              <p className="text-on-surface-variant text-sm mb-4">
                <span className="font-display-lg text-2xl font-bold text-on-surface">
                  {completedCount}
                </span>{' '}
                / {courses.length} cours terminés
              </p>
              <CardCta onClick={() => onNavigate('modules')}>
                {nextCourse ? `Reprendre « ${nextCourse.title} »` : 'Revoir mes cours'}
              </CardCta>
            </>
          )}
        </CardShell>

        {/* Notifications */}
        <CardShell title="Notifications" icon={Bell}>
          {!authResolved ? (
            <Spinner label="Chargement des notifications" />
          ) : !authenticated ? (
            <>
              <p className="text-on-surface-variant text-sm mb-4">
                Connecte-toi pour recevoir tes notifications (nouveaux cours, rappels, succès).
              </p>
              <CardCta onClick={() => onNavigate('notifications')}>Se connecter</CardCta>
            </>
          ) : (
            <>
              {recentNotifications.length === 0 ? (
                <p className="text-on-surface-variant text-sm mb-4 flex-1">
                  Rien de nouveau pour l&apos;instant.
                </p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {recentNotifications.map((n) => (
                    <li key={n.id} className="text-sm">
                      <span
                        className={`font-semibold block truncate ${n.read ? 'text-on-surface-variant' : 'text-on-surface'}`}
                      >
                        {n.title}
                      </span>
                      <span className="text-on-surface-variant text-xs">
                        {relativeTime(n.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <CardCta onClick={() => onNavigate('notifications')}>
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Voir tout'}
              </CardCta>
            </>
          )}
        </CardShell>

        {/* Outils disponibles */}
        <CardShell title="Outils" icon={Wrench}>
          {liveTools.length === 0 ? (
            <p className="text-on-surface-variant text-sm mb-4 flex-1">
              Bientôt disponible — reviens vite.
            </p>
          ) : (
            <ul className="space-y-2 mb-4">
              {liveTools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <li
                    key={tool.id}
                    className="flex items-center gap-2 text-sm text-on-surface font-semibold"
                  >
                    <ToolIcon className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{tool.name}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <CardCta onClick={() => onNavigate('outils')}>Voir les outils</CardCta>
        </CardShell>
      </div>
    </div>
  );
}
