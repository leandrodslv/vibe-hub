import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { server, resetScenarios } from './mocks/server.js';

// ─── MSW : mocks réseau déterministes (V3) ────────────────────────────────────
// `onUnhandledRequest: 'bypass'` — les tests qui mockent au niveau module
// (vi.mock) ne touchent pas le réseau ; MSW ne s'occupe que des tests qui
// appellent réellement fetch (services via HTTP, futurs tests de composants).
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

// Silence les logs applicatifs (logger.js) pendant les tests : les chemins d'erreur
// testés déverseraient sinon des lignes JSON dans la sortie CI. Les tests qui
// veulent ASSERTER sur la console re-créent leurs propres spies (cf. logger.test.js) ;
// `restoreMocks: true` (vite.config) remet tout à plat entre les tests.
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Démonte l'arbre React et purge le DOM entre chaque test — évite les fuites d'état
// d'un test à l'autre (portails de modales, listeners globaux).
afterEach(() => {
  server.resetHandlers();
  resetScenarios();
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom n'implémente pas ces API utilisées par l'app. On les stubbe une fois pour
// toutes plutôt que dans chaque fichier de test.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
}
