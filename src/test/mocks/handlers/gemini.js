// @ts-check
/**
 * Handlers MSW pour l'Edge Function `gemini-proxy`.
 *
 * Interception au niveau réseau (fetch) plutôt que `vi.mock` du service :
 *  - on teste le VRAI code de `src/services/ai.js` (parse de la réponse du proxy,
 *    mapping 429 / 502+status / complétion vide) ;
 *  - le handler matche toute URL contenant `gemini-proxy`, quel que soit l'hôte
 *    (`*.functions.supabase.co/gemini-proxy` ou `*.supabase.co/functions/v1/...`).
 *
 * Le scénario actif se règle avec `setGeminiScenario('quotaExceeded')` — défaut
 * `nominal`, remis à zéro entre chaque test par `server.resetHandlers()` +
 * `resetScenarios()` (cf. src/test/mocks/server.js).
 */

import { http, HttpResponse, delay } from 'msw';
import { geminiScenarios } from '../scenarios/gemini.js';

/** URL utilisée par les mocks d'env dans la suite de tests. */
export const GEMINI_PROXY_TEST_URL = 'https://proxy.test/gemini-proxy';

/** Toute requête POST vers un endpoint `gemini-proxy`. */
const PROXY_URL = /\/gemini-proxy(\?|$)/;

/** @type {import('../scenarios/gemini.js').GeminiScenarioName} */
let active = 'nominal';
let latencyMs = 0;

/** @param {import('../scenarios/gemini.js').GeminiScenarioName} name */
export function setGeminiScenario(name) {
  if (!(name in geminiScenarios)) throw new Error(`Scénario Gemini inconnu : ${name}`);
  active = name;
}

/**
 * Injecte une latence artificielle avant la réponse (simulation de réseau lent).
 * @param {number} ms
 */
export function setGeminiLatency(ms) {
  latencyMs = Math.max(0, ms | 0);
}

export function resetGeminiScenario() {
  active = 'nominal';
  latencyMs = 0;
}

/**
 * Derniers corps de requête envoyés au proxy (pour asserter sur `history` /
 * `systemInstruction`).
 * @type {Array<{ history: Array<{ role: string, text: string, image?: string }>, systemInstruction?: string | null }>}
 */
export const geminiRequests = [];

export const geminiHandlers = [
  http.post(PROXY_URL, async ({ request }) => {
    geminiRequests.push(
      /** @type {(typeof geminiRequests)[number]} */ (await request.clone().json())
    );

    if (latencyMs > 0) await delay(latencyMs);

    const scenario = geminiScenarios[active];

    // JSON volontairement cassé : une string non-JSON avec un content-type JSON
    // pour simuler un proxy qui répond en vrac.
    if (typeof scenario.body === 'string') {
      return new HttpResponse(scenario.body, {
        status: scenario.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    return HttpResponse.json(scenario.body, { status: scenario.status });
  }),
];
