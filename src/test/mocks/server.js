// @ts-check
/**
 * Serveur MSW partagé par la suite unitaire.
 *
 * Câblé dans `src/test/setup.js` :
 *   listen({ onUnhandledRequest: 'bypass' })  — les tests qui mockent au niveau
 *     module (vi.mock) ne font aucune requête → MSW les ignore, aucune régression.
 *   afterEach : resetHandlers() + resetScenarios()  — isolation entre tests.
 *   afterAll  : close().
 *
 * Un test qui veut une réponse externe déterministe fait :
 *   import { setGeminiScenario } from '../test/mocks';
 *   setGeminiScenario('quotaExceeded');
 */

import { setupServer } from 'msw/node';
import { geminiHandlers, resetGeminiScenario, geminiRequests } from './handlers/gemini.js';
import { supabaseHandlers, resetSupabaseScenario } from './handlers/supabase.js';

export const server = setupServer(...geminiHandlers, ...supabaseHandlers);

/** Remet tous les scénarios et les journaux de requêtes à l'état initial. */
export function resetScenarios() {
  resetGeminiScenario();
  resetSupabaseScenario();
  geminiRequests.length = 0;
}
