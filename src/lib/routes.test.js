import { describe, it, expect } from 'vitest';
import {
  ROUTES,
  WORKSPACE_TABS,
  DEFAULT_TAB,
  appHref,
  currentRoute,
  tabFromSearch,
  NOUVEL_ONGLET,
  MENTION_NOUVEL_ONGLET,
} from './routes.js';

describe('currentRoute', () => {
  it.each([
    ['/', 'landing'],
    ['/app', 'app'],
    ['/app/', 'app'],
    ['/admin', 'admin'],
    ['/admin//', 'admin'],
    ['/nimporte-quoi', 'notFound'],
    ['/app/sub', 'notFound'],
  ])('résout %s → %s', (path, expected) => {
    expect(currentRoute(path)).toBe(expected);
  });
});

describe('appHref', () => {
  it('renvoie /app pour l’onglet par défaut (URL propre)', () => {
    expect(appHref(DEFAULT_TAB)).toBe(ROUTES.app);
    expect(appHref(undefined)).toBe(ROUTES.app);
  });

  it('ajoute ?tab= pour un onglet non-défaut connu', () => {
    expect(appHref('modules')).toBe('/app?tab=modules');
    expect(appHref('outils')).toBe('/app?tab=outils');
  });

  it('ignore un onglet inconnu', () => {
    expect(appHref('pirate')).toBe(ROUTES.app);
  });
});

describe('tabFromSearch', () => {
  it('lit un onglet valide', () => {
    expect(tabFromSearch('?tab=modules')).toBe('modules');
  });

  it('retombe sur le défaut si absent ou invalide', () => {
    expect(tabFromSearch('')).toBe(DEFAULT_TAB);
    expect(tabFromSearch('?tab=zzz')).toBe(DEFAULT_TAB);
  });
});

describe('constantes de lien nouvel onglet', () => {
  it('coupe l’accès à window.opener', () => {
    expect(NOUVEL_ONGLET.rel).toContain('noopener');
    expect(NOUVEL_ONGLET.rel).toContain('noreferrer');
    expect(NOUVEL_ONGLET.target).toBe('_blank');
  });

  it('expose la mention lecteur d’écran et la liste des onglets', () => {
    expect(MENTION_NOUVEL_ONGLET).toMatch(/nouvel onglet/i);
    expect(WORKSPACE_TABS).toContain(DEFAULT_TAB);
  });
});
