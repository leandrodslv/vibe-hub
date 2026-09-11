import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCheck,
  BookOpen,
  ArrowRight,
  Award,
  TrendingUp,
  Construction,
  ExternalLink,
  GraduationCap,
  Trophy,
  MoonStar,
  AlarmClock,
  X,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications.js';
import { relativeTime } from '../../../lib/relativeTime.js';
import { WORKSPACE_TABS } from '../../../lib/routes.js';
import { signIn } from '../../../services/supabase.js';

// Métadonnées d'affichage par catégorie (enum DB → visuel Franc).
const CATEGORY_META = {
  new_course: {
    chip: 'Nouveau Cours',
    icon: BookOpen,
    accentBg: 'bg-secondary',
    accentText: 'text-on-secondary',
    badgeBg: 'bg-secondary-fixed',
    badgeText: 'text-secondary',
    glowBg: 'bg-secondary-fixed',
    action: 'Voir la leçon',
    actionIcon: ArrowRight,
  },
  milestone: {
    chip: 'Succès',
    icon: Award,
    accentBg: 'bg-tertiary',
    accentText: 'text-on-tertiary',
    badgeBg: 'bg-tertiary-fixed',
    badgeText: 'text-tertiary',
    glowBg: 'bg-tertiary-fixed',
    action: 'Voir ton progrès',
    actionIcon: TrendingUp,
  },
  tool_beta: {
    chip: 'Outil Bêta',
    icon: Construction,
    accentBg: 'bg-tertiary-container',
    accentText: 'text-on-tertiary-container',
    badgeBg: 'bg-tertiary-fixed-dim',
    badgeText: 'text-on-tertiary-container',
    glowBg: null,
    action: 'Consulter',
    actionIcon: ExternalLink,
  },
  reminder: {
    chip: 'Rappel',
    icon: AlarmClock,
    accentBg: 'bg-primary-container',
    accentText: 'text-on-primary-container',
    badgeBg: 'bg-primary-fixed',
    badgeText: 'text-primary',
    glowBg: 'bg-primary-fixed',
    action: 'Reprendre',
    actionIcon: ArrowRight,
  },
};

const CATEGORY_PREFS = [
  {
    key: 'cat_new_course',
    label: 'Nouvelles Leçons',
    icon: GraduationCap,
    hoverBg: 'group-hover:bg-primary-fixed',
    hoverText: 'group-hover:text-primary',
  },
  {
    key: 'cat_tool_beta',
    label: 'Mises à jour Outils',
    icon: Construction,
    hoverBg: 'group-hover:bg-tertiary-fixed',
    hoverText: 'group-hover:text-tertiary',
  },
  {
    key: 'cat_milestone',
    label: 'Jalons & Progrès',
    icon: Trophy,
    hoverBg: 'group-hover:bg-primary-fixed',
    hoverText: 'group-hover:text-primary',
  },
];

function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="toggle-checkbox absolute w-0 h-0 opacity-0"
      />
      <span className="toggle-label" aria-hidden="true"></span>
      <span className="sr-only">{label}</span>
    </label>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-[24px] border border-surface-variant animate-pulse">
      <div className="flex items-start gap-5">
        <div className="w-14 h-14 rounded-2xl bg-surface-variant shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-surface-variant rounded-full"></div>
          <div className="h-5 w-3/4 bg-surface-variant rounded"></div>
          <div className="h-4 w-32 bg-surface-variant rounded"></div>
        </div>
      </div>
    </div>
  );
}

function SignInPrompt() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) setError('Identifiants incorrects.');
    // Succès : `onAuthChange` dans le hook rebranche le flux automatiquement.
  };

  return (
    <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center">
        <Bell className="w-8 h-8" aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-display-lg text-[28px] font-extrabold text-on-surface">
          Connecte-toi pour tes notifications
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Le reste du Workspace (Cours, IA, Outils) reste accessible sans compte.
        </p>
      </div>
      <form onSubmit={submit} className="w-full flex flex-col gap-3 text-left">
        <label
          htmlFor="signin_email"
          className="font-label-caps text-label-caps text-on-surface-variant uppercase"
        >
          Email
        </label>
        <input
          id="signin_email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 font-body-md text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <label
          htmlFor="signin_password"
          className="font-label-caps text-label-caps text-on-surface-variant uppercase"
        >
          Mot de passe
        </label>
        <input
          id="signin_password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 font-body-md text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {error && (
          <p role="alert" className="font-body-md text-[14px] text-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 bg-primary text-on-primary font-cta-pill text-cta-pill px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

export default function NotificationsTab({ onNavigate }) {
  const {
    authResolved,
    authenticated,
    loading,
    error,
    notifications,
    unreadCount,
    preferences,
    refetch,
    markRead,
    markAllRead,
    dismiss,
    updatePreferences,
  } = useNotifications();

  // Rafraîchit l'affichage des temps relatifs sans refetch (story 8.6).
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const feedRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const activate = useCallback(
    (n) => {
      if (!n.read) markRead(n.id);
      const link = n.link;
      if (!link) return;
      const m = link.match(/^\/app\?tab=([a-z]+)$/);
      if (m && WORKSPACE_TABS.includes(m[1]) && onNavigate) {
        onNavigate(m[1]);
      } else if (link.startsWith('/')) {
        window.location.assign(link);
      } else {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    },
    [markRead, onNavigate]
  );

  const handleDismiss = useCallback(
    (id) => {
      dismiss(id);
      // Le focus repart en tête du flux (NFR8) — la carte suivante prend le relais visuellement.
      requestAnimationFrame(() => feedRef.current?.focus());
    },
    [dismiss]
  );

  // Débounce des contrôles libres (heures silencieuses, fréquence) — story 9.1 / UX-DR21.
  const debounceRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const debouncedPref = useCallback(
    (patch) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updatePreferences(patch).catch(() => {});
      }, 500);
    },
    [updatePreferences]
  );

  return (
    <div className="w-full h-full overflow-y-auto">
      {!authResolved ? (
        <div className="flex flex-col gap-4 max-w-2xl">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !authenticated ? (
        <SignInPrompt />
      ) : (
        <div className="flex flex-col lg:flex-row gap-12 pb-12">
          {/* Colonne gauche : centre de notifications */}
          <section className="w-full lg:w-[60%] flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-display-lg text-[32px] font-extrabold text-on-surface">
                  Centre de notifications
                </h1>
                <p
                  className="font-body-md text-body-md text-on-surface-variant mt-2"
                  aria-live="polite"
                >
                  {loading
                    ? 'Chargement…'
                    : unreadCount > 0
                      ? `Vous avez ${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} alerte${unreadCount > 1 ? 's' : ''} à consulter.`
                      : 'Vous êtes à jour.'}
                </p>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="bg-surface-variant text-on-surface-variant hover:bg-outline-variant hover:text-on-surface font-cta-pill text-cta-pill px-6 py-3 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <CheckCheck className="w-[18px] h-[18px]" aria-hidden="true" />
                Marquer tout comme lu
              </button>
            </div>

            <div ref={feedRef} tabIndex={-1} className="flex flex-col gap-4 outline-none">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : error ? (
                <div className="bg-surface-container-lowest p-6 rounded-[24px] border border-outline-variant flex flex-col items-start gap-3">
                  <p className="font-body-md text-body-md text-on-surface">
                    Impossible de charger les notifications.
                  </p>
                  <button
                    type="button"
                    onClick={refetch}
                    className="font-cta-pill text-cta-pill text-primary hover:text-primary-container flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Réessayer
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-[24px] border border-surface-variant text-center">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Vous êtes à jour.
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const meta = CATEGORY_META[n.category] ?? CATEGORY_META.milestone;
                  const Icon = meta.icon;
                  const ActionIcon = meta.actionIcon;
                  return (
                    <div
                      key={n.id}
                      className={`bg-surface-container-lowest p-6 rounded-[24px] border border-surface-variant shadow-sm hover:chunky-shadow transition-all duration-300 relative overflow-hidden group ${n.read ? 'opacity-80' : ''}`}
                    >
                      {meta.glowBg && (
                        <div
                          className={`absolute -right-10 -top-10 w-32 h-32 ${meta.glowBg} rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`}
                          aria-hidden="true"
                        ></div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDismiss(n.id)}
                        aria-label={`Archiver : ${meta.chip}`}
                        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <div className="flex items-start gap-5 relative z-10">
                        <div
                          className={`w-14 h-14 rounded-2xl ${meta.accentBg} ${meta.accentText} flex items-center justify-center flex-shrink-0 shadow-md`}
                        >
                          <Icon className="w-7 h-7" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1 gap-3 pr-8">
                            <span
                              className={`font-label-caps text-label-caps ${meta.badgeText} font-bold uppercase tracking-widest ${meta.badgeBg} px-3 py-1 rounded-full`}
                            >
                              {meta.chip}
                            </span>
                            <span className="font-body-md text-[14px] text-on-surface-variant whitespace-nowrap">
                              {relativeTime(n.created_at)}
                            </span>
                          </div>
                          <h3 className="font-headline-lg text-[20px] font-bold text-on-surface mt-2 mb-2 leading-tight">
                            {n.title}
                          </h3>
                          {n.body && (
                            <p className="font-body-md text-[14px] text-on-surface-variant">
                              {n.body}
                            </p>
                          )}
                          {n.link && (
                            <button
                              type="button"
                              onClick={() => activate(n)}
                              className="font-cta-pill text-cta-pill text-primary hover:text-primary-container flex items-center gap-1 mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                            >
                              {meta.action}
                              <ActionIcon className="w-[18px] h-[18px]" aria-hidden="true" />
                              <span className="sr-only"> — {meta.chip}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Colonne droite : préférences */}
          <aside className="w-full lg:w-[40%] flex flex-col gap-6">
            <div className="bg-on-surface text-on-primary p-8 rounded-bento relative overflow-hidden shadow-2xl">
              <div
                className="absolute -right-16 -top-16 w-48 h-48 bg-primary rounded-full blur-[80px] opacity-40"
                aria-hidden="true"
              ></div>
              <h2 className="font-display-lg text-[28px] font-extrabold relative z-10 mb-2">
                Préférences
              </h2>
              <p className="font-body-md text-[16px] text-surface-container-high relative z-10 mb-6">
                Personnalisez votre flux d&apos;informations pour rester concentré.
              </p>
              <div className="space-y-6 relative z-10 bg-surface/10 p-6 rounded-2xl border border-surface-variant/20">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-cta-pill text-cta-pill">Notifications dans l&apos;app</p>
                  <Toggle
                    id="toggle_app"
                    checked={preferences.app_enabled}
                    onChange={() =>
                      updatePreferences({ app_enabled: !preferences.app_enabled }).catch(() => {})
                    }
                    label="Activer les notifications dans l'app"
                  />
                </div>
                <div className="w-full h-px bg-outline-variant/30"></div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-cta-pill text-cta-pill">Notifications par email</p>
                    <p className="font-body-md text-[12px] text-surface-container-highest mt-1">
                      Un résumé quotidien
                    </p>
                  </div>
                  <Toggle
                    id="toggle_email"
                    checked={preferences.email_enabled}
                    onChange={() =>
                      updatePreferences({ email_enabled: !preferences.email_enabled }).catch(
                        () => {}
                      )
                    }
                    label="Activer les notifications par email"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-bento border border-surface-variant shadow-sm p-2 flex flex-col gap-2">
              {CATEGORY_PREFS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    className="p-4 rounded-[20px] hover:bg-surface-container-low transition-colors flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant ${cat.hoverBg} ${cat.hoverText} transition-colors shrink-0`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <p className="font-cta-pill text-cta-pill text-on-surface truncate">
                        {cat.label}
                      </p>
                    </div>
                    <Toggle
                      id={cat.key}
                      checked={preferences[cat.key]}
                      onChange={() =>
                        updatePreferences({ [cat.key]: !preferences[cat.key] }).catch(() => {})
                      }
                      label={cat.label}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-surface-container-lowest border border-surface-variant p-6 rounded-[24px] shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <MoonStar className="w-5 h-5 text-outline" aria-hidden="true" />
                  <h3 className="font-headline-lg text-[20px] font-bold text-on-surface">
                    Heures silencieuses
                  </h3>
                </div>
                <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant focus-within:border-primary transition-colors">
                  <label
                    htmlFor="quiet_from"
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                  >
                    De
                  </label>
                  <input
                    id="quiet_from"
                    type="time"
                    defaultValue={preferences.quiet_from ?? '22:00'}
                    onChange={(e) => debouncedPref({ quiet_from: e.target.value })}
                    className="bg-transparent border-none p-0 m-0 font-body-md text-body-md font-bold text-on-surface focus:ring-0 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant focus-within:border-primary transition-colors">
                  <label
                    htmlFor="quiet_to"
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                  >
                    À
                  </label>
                  <input
                    id="quiet_to"
                    type="time"
                    defaultValue={preferences.quiet_to ?? '08:00'}
                    onChange={(e) => debouncedPref({ quiet_to: e.target.value })}
                    className="bg-transparent border-none p-0 m-0 font-body-md text-body-md font-bold text-on-surface focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-primary-container text-on-primary-container p-6 rounded-[24px] shadow-sm flex flex-col gap-4 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                  aria-hidden="true"
                ></div>
                <div className="flex items-center gap-3 relative z-10">
                  <AlarmClock className="w-5 h-5" aria-hidden="true" />
                  <h3 className="font-headline-lg text-[20px] font-bold">
                    Rappels d&apos;apprentissage
                  </h3>
                </div>
                <p className="font-body-md text-[14px] opacity-90 relative z-10">
                  Définissez une fréquence pour vous rappeler de continuer vos modules.
                </p>
                <label htmlFor="reminder_frequency" className="sr-only">
                  Fréquence des rappels d&apos;apprentissage
                </label>
                <select
                  id="reminder_frequency"
                  value={preferences.reminder_frequency}
                  onChange={(e) =>
                    updatePreferences({ reminder_frequency: e.target.value }).catch(() => {})
                  }
                  className="w-full bg-on-primary text-primary font-body-md text-body-md font-bold p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-white relative z-10 cursor-pointer appearance-none"
                >
                  <option value="daily">Quotidien (18:00)</option>
                  <option value="weekly">Hebdomadaire (Vendredi)</option>
                  <option value="never">Jamais</option>
                </select>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
