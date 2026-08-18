// Routage par URL réelle — le « débranchement » landing / logiciel.
//
// La landing (`/`) et le logiciel (`/app`) sont deux documents indépendants : on passe de
// l'un à l'autre par une vraie navigation (donc par un vrai `<a href>`, ouvrable dans un
// nouvel onglet, partageable, indexable), et non plus par un état React partagé qui
// obligeait les deux à cohabiter dans le même arbre.

export const ROUTES = {
  landing: '/',
  app: '/app',
  admin: '/admin',
};

export const WORKSPACE_TABS = ['modules', 'ia', 'outils'];
export const DEFAULT_TAB = 'ia';

// URL du logiciel, éventuellement ciblée sur un onglet. L'onglet par défaut n'est pas
// écrit dans l'URL pour garder `/app` propre.
export function appHref(tab) {
  return tab && tab !== DEFAULT_TAB && WORKSPACE_TABS.includes(tab)
    ? `${ROUTES.app}?tab=${tab}`
    : ROUTES.app;
}

// À étaler sur les liens qui ouvrent le logiciel depuis la landing.
// `noopener` coupe l'accès de la nouvelle page à `window.opener` ; `noreferrer` reste par
// sécurité pour les navigateurs anciens qui ignorent `noopener`.
export const NOUVEL_ONGLET = { target: '_blank', rel: 'noopener noreferrer' };

// Mention vocalisée par les lecteurs d'écran sur ces liens : l'ouverture d'un nouvel onglet
// doit être annoncée avant l'activation (RGAA — information sur l'ouverture d'une fenêtre).
export const MENTION_NOUVEL_ONGLET = ' (nouvel onglet)';

export function currentRoute(pathname = window.location.pathname) {
  // Tolère la barre finale (`/app/`) que certains hébergeurs ajoutent.
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === ROUTES.admin) return 'admin';
  if (path === ROUTES.app) return 'app';
  return 'landing';
}

export function tabFromSearch(search = window.location.search) {
  const tab = new URLSearchParams(search).get('tab');
  return WORKSPACE_TABS.includes(tab) ? tab : DEFAULT_TAB;
}
