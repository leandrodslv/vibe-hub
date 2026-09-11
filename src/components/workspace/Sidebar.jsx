import { Bot, Wrench, Bell, Settings } from 'lucide-react';
import { ROUTES } from '../../lib/routes';
import { useNotifications } from '../../hooks/useNotifications.js';

/** Pastille du nombre de non-lus sur la cloche (FR-13, UX-DR22). Rien si 0. */
function BellBadge({ count }) {
  if (!count) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[11px] font-bold leading-[18px] text-center"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

// "view_quilt" reprend l'icône du nav Modules/Cours telle que produite par Stitch
// (mockups/modules.html), d'où le glyphe Material Symbols plutôt qu'un icône Lucide
// comme les deux autres onglets.
const TABS = [
  { id: 'modules', label: 'Cours', symbol: 'view_quilt' },
  { id: 'ia', label: 'IA', icon: Bot },
  { id: 'outils', label: 'Outils', icon: Wrench },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

function TabIcon({ tab, active }) {
  if (tab.symbol) {
    return (
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[20px] leading-none"
        style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
      >
        {tab.symbol}
      </span>
    );
  }
  const Icon = tab.icon;
  return <Icon className="w-5 h-5" aria-hidden="true" />;
}

// Le logo est un lien vers la landing et non un bouton : le logiciel vit à sa propre URL,
// « revenir à l'accueil » est donc une navigation, pas un changement d'état local.
export default function Sidebar({ activeTab, onTabChange }) {
  const { badgeCount, unreadCount } = useNotifications();
  return (
    <>
      {/* Sidebar desktop */}
      <header className="hidden md:flex flex-col w-64 bg-surface h-screen fixed left-0 top-0 border-r-2 border-surface-variant p-6 z-40">
        <a
          href={ROUTES.landing}
          aria-label="Retour à l'accueil Vibe Hub"
          className={`mb-12 w-fit text-left rounded-lg ${FOCUS_RING}`}
        >
          <span className="font-display-lg text-display-lg text-on-surface font-extrabold tracking-tight">
            vibe hub
          </span>
        </a>

        <nav aria-label="Navigation workspace" className="flex flex-col gap-2 flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`flex items-center gap-3 p-3 rounded-lg font-cta-pill text-cta-pill transition-all duration-300 ${FOCUS_RING} ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-primary hover:scale-105'
              }`}
            >
              <TabIcon tab={tab} active={activeTab === tab.id} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onTabChange('notifications')}
            aria-current={activeTab === 'notifications' ? 'page' : undefined}
            className={`flex items-center gap-3 p-3 rounded-lg font-cta-pill text-cta-pill transition-all duration-300 ${FOCUS_RING} ${
              activeTab === 'notifications'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-primary hover:scale-105'
            }`}
          >
            <span className="relative">
              <Bell className="w-5 h-5" aria-hidden="true" />
              <BellBadge count={badgeCount} />
            </span>
            Notifications
            {unreadCount > 0 && (
              <span className="sr-only" aria-live="polite">
                {unreadCount} non lues
              </span>
            )}
          </button>
          {/* Décoratif : pas d'écran de profil en v1 (pas d'auth), même traitement que les
              icônes non fonctionnelles du Navbar landing. */}
          <span
            className="flex items-center gap-3 p-3 rounded-lg text-on-surface-variant"
            aria-hidden="true"
          >
            <Settings className="w-5 h-5" />
            <span className="font-cta-pill text-cta-pill">Profil</span>
          </span>
        </div>
      </header>

      {/* Top bar mobile */}
      <header className="md:hidden flex justify-between items-center px-container-margin py-4 w-full bg-surface sticky top-0 z-40 border-b-2 border-surface-variant">
        <a
          href={ROUTES.landing}
          aria-label="Retour à l'accueil Vibe Hub"
          className={`rounded-lg ${FOCUS_RING}`}
        >
          <span className="font-display-lg text-headline-lg-mobile text-on-surface font-extrabold tracking-tight">
            vibe hub
          </span>
        </a>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onTabChange('notifications')}
            aria-label={badgeCount ? `Notifications, ${unreadCount} non lues` : 'Notifications'}
            aria-current={activeTab === 'notifications' ? 'page' : undefined}
            className={`relative rounded-lg ${FOCUS_RING} ${activeTab === 'notifications' ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <BellBadge count={badgeCount} />
          </button>
          {/* Décoratif : pas d'écran de profil en v1 (pas d'auth). */}
          <Settings className="w-5 h-5 text-on-surface-variant" aria-hidden="true" />
        </div>
      </header>

      {/* Bottom nav mobile */}
      <nav
        aria-label="Navigation workspace"
        className="md:hidden fixed bottom-0 left-0 right-0 w-full z-50 flex justify-around items-center px-8 pb-4 pt-4 bg-on-surface rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)]"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`flex flex-col items-center justify-center rounded-full p-3 w-16 h-16 transition-all duration-300 active:scale-95 ${FOCUS_RING} ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary'
                : 'text-surface-variant hover:bg-primary-container/20'
            }`}
          >
            <TabIcon tab={tab} active={activeTab === tab.id} />
            <span className="font-label-caps text-[10px] mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
