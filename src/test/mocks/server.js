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
import {
  courseDraftHandlers,
  resetCourseDraftScenario,
  courseDraftRequests,
} from './handlers/course-draft.js';

export const server = setupServer(...geminiHandlers, ...supabaseHandlers, ...courseDraftHandlers);

/** Remet tous les scénarios et les journaux de requêtes à l'état initial. */
export function resetScenarios() {
  resetGeminiScenario();
  resetSupabaseScenario();
  resetCourseDraftScenario();
  geminiRequests.length = 0;
  courseDraftRequests.length = 0;
}
