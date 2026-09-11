import { useState } from 'react';
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
} from 'lucide-react';

// Données de démonstration — pas de backend de notifications en v1 (cf. Dev Notes Sidebar.jsx).
const NOTIFICATIONS = [
  {
    id: 'n1',
    category: 'Nouveau Cours',
    icon: BookOpen,
    accentBg: 'bg-secondary',
    accentText: 'text-on-secondary',
    badgeBg: 'bg-secondary-fixed',
    badgeText: 'text-secondary',
    glowBg: 'bg-secondary-fixed',
    time: 'Il y a 2h',
    title: 'Nouvelle leçon disponible : Prompt Engineering pour Designers',
    action: 'Voir la leçon',
    actionIcon: ArrowRight,
    read: false,
  },
  {
    id: 'n2',
    category: 'Succès',
    icon: Award,
    accentBg: 'bg-tertiary',
    accentText: 'text-on-tertiary',
    badgeBg: 'bg-tertiary-fixed',
    badgeText: 'text-tertiary',
    glowBg: 'bg-tertiary-fixed',
    time: 'Il y a 1h',
    title: "Tu as complété Module 2 : Fondamentaux de l'IA ! 🎉",
    action: 'Voir ton progrès',
    actionIcon: TrendingUp,
    read: false,
  },
  {
    id: 'n4',
    category: 'Outil Bêta',
    icon: Construction,
    accentBg: 'bg-tertiary-container',
    accentText: 'text-on-tertiary-container',
    badgeBg: 'bg-tertiary-fixed-dim',
    badgeText: 'text-on-tertiary-container',
    glowBg: null,
    time: 'Il y a 3h',
    title: 'Nouveau tool en accès bêta : Code Auditor',
    action: 'Consulter',
    actionIcon: ExternalLink,
    read: true,
  },
];

const CATEGORY_PREFS = [
  {
    id: 't_lessons',
    label: 'Nouvelles Leçons',
    icon: GraduationCap,
    hoverBg: 'group-hover:bg-primary-fixed',
    hoverText: 'group-hover:text-primary',
    defaultOn: true,
  },
  {
    id: 't_tools',
    label: 'Mises à jour Outils',
    icon: Construction,
    hoverBg: 'group-hover:bg-tertiary-fixed',
    hoverText: 'group-hover:text-tertiary',
    defaultOn: false,
  },
  {
    id: 't_milestones',
    label: 'Jalons & Progrès',
    icon: Trophy,
    hoverBg: 'group-hover:bg-primary-fixed',
    hoverText: 'group-hover:text-primary',
    defaultOn: true,
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

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [prefs, setPrefs] = useState({
    appNotifications: true,
    emailNotifications: false,
    ...Object.fromEntries(CATEGORY_PREFS.map((p) => [p.id, p.defaultOn])),
  });
  const [quietFrom, setQuietFrom] = useState('22:00');
  const [quietTo, setQuietTo] = useState('08:00');
  const [reminderFrequency, setReminderFrequency] = useState('weekly');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-12 pb-12">
        {/* Colonne gauche : centre de notifications */}
        <section className="w-full lg:w-[60%] flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-display-lg text-[32px] font-extrabold text-on-surface">
                Centre de notifications
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                {unreadCount > 0
                  ? `Vous avez ${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} alerte${unreadCount > 1 ? 's' : ''} à consulter.`
                  : 'Vous êtes à jour.'}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="bg-surface-variant text-on-surface-variant hover:bg-outline-variant hover:text-on-surface font-cta-pill text-cta-pill px-6 py-3 rounded-full transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <CheckCheck className="w-[18px] h-[18px]" aria-hidden="true" />
              Marquer tout comme lu
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {notifications.map((n) => {
              const Icon = n.icon;
              const ActionIcon = n.actionIcon;
              return (
                <div
                  key={n.id}
                  className={`bg-surface-container-lowest p-6 rounded-[24px] border border-surface-variant shadow-sm hover:chunky-shadow transition-all duration-300 relative overflow-hidden group ${n.read ? 'opacity-80' : ''}`}
                >
                  {n.glowBg && (
                    <div
                      className={`absolute -right-10 -top-10 w-32 h-32 ${n.glowBg} rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`}
                      aria-hidden="true"
                    ></div>
                  )}
                  <div className="flex items-start gap-5 relative z-10">
                    <div
                      className={`w-14 h-14 rounded-2xl ${n.accentBg} ${n.accentText} flex items-center justify-center flex-shrink-0 shadow-md`}
                    >
                      <Icon className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1 gap-3">
                        <span
                          className={`font-label-caps text-label-caps ${n.badgeText} font-bold uppercase tracking-widest ${n.badgeBg} px-3 py-1 rounded-full`}
                        >
                          {n.category}
                        </span>
                        <span className="font-body-md text-[14px] text-on-surface-variant whitespace-nowrap">
                          {n.time}
                        </span>
                      </div>
                      <h3 className="font-headline-lg text-[20px] font-bold text-on-surface mt-2 mb-2 leading-tight">
                        {n.title}
                      </h3>
                      <button
                        type="button"
                        className="font-cta-pill text-cta-pill text-primary hover:text-primary-container flex items-center gap-1 mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                      >
                        {n.action}
                        <ActionIcon className="w-[18px] h-[18px]" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  checked={prefs.appNotifications}
                  onChange={() => togglePref('appNotifications')}
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
                  checked={prefs.emailNotifications}
                  onChange={() => togglePref('emailNotifications')}
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
                  key={cat.id}
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
                    id={cat.id}
                    checked={prefs[cat.id]}
                    onChange={() => togglePref(cat.id)}
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
                  value={quietFrom}
                  onChange={(e) => setQuietFrom(e.target.value)}
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
                  value={quietTo}
                  onChange={(e) => setQuietTo(e.target.value)}
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
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(e.target.value)}
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
    </div>
  );
}
