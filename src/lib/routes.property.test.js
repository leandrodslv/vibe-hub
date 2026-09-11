import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  appHref,
  currentRoute,
  tabFromSearch,
  WORKSPACE_TABS,
  DEFAULT_TAB,
  ROUTES,
} from './routes.js';

// Property-based : au lieu de choisir 5 exemples à la main, fast-check secoue la
// fonction avec des centaines d'entrées aléatoires (dont des cas tordus qu'on
// n'aurait pas écrits) et rétrécit le contre-exemple minimal en cas d'échec.
// C'est le « il secoue, il fait avec de l'aléatoire plein de cas » de la vidéo,
// appliqué à la logique pure.

describe('routes — propriétés', () => {
  it('currentRoute renvoie toujours une des 4 valeurs, pour n’importe quelle string', () => {
    fc.assert(
      fc.property(fc.string(), (path) => {
        expect(['landing', 'app', 'admin', 'notFound']).toContain(currentRoute(path));
      })
    );
  });

  it('currentRoute ignore les barres finales', () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.values(ROUTES)), fc.nat({ max: 5 }), (route, n) => {
        expect(currentRoute(route + '/'.repeat(n))).toBe(currentRoute(route));
      })
    );
  });

  it('tabFromSearch renvoie toujours un onglet connu', () => {
    fc.assert(
      fc.property(fc.string(), (search) => {
        expect(WORKSPACE_TABS).toContain(tabFromSearch('?tab=' + search));
      })
    );
  });

  it('appHref → currentRoute fait un aller-retour vers "app"', () => {
    fc.assert(
      fc.property(fc.option(fc.string(), { nil: undefined }), (tab) => {
        const href = appHref(tab);
        const [path] = href.split('?');
        expect(currentRoute(path)).toBe('app');
      })
    );
  });

  it('appHref n’ajoute ?tab= que pour un onglet connu non-défaut', () => {
    fc.assert(
      fc.property(fc.string(), (tab) => {
        const href = appHref(tab);
        if (href.includes('?tab=')) {
          const value = new URLSearchParams(href.split('?')[1]).get('tab');
          expect(WORKSPACE_TABS).toContain(value);
          expect(value).not.toBe(DEFAULT_TAB);
        }
      })
    );
  });
});
