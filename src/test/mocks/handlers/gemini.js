// @ts-check
/**
 * Handlers MSW pour l'API Gemini (`:generateContent`).
 *
 * Interception au niveau réseau (fetch) plutôt que `vi.mock('@google/generative-ai')` :
 *  - survit à la migration AD-1 (quand `ai.js` passera par `fetch()` vers le proxy) ;
 *  - teste le VRAI code de gestion d'erreur (mapping 429 / 503, parse, retries).
 *
 * Le scénario actif se règle avec `setGeminiScenario('quotaExceeded')` — défaut
 * `nominal`, remis à zéro entre chaque test par `server.resetHandlers()` +
 * `resetScenarios()` (cf. src/test/mocks/server.js).
 */

import { http, HttpResponse, delay } from 'msw';
import { geminiScenarios } from '../scenarios/gemini.js';

/** URL de l'API : `.../v1beta/models/<model>:generateContent`. */
const GEMINI_URL = /generativelanguage\.googleapis\.com\/.+:generateContent/;

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
 * Dernières requêtes reçues (pour asserter sur le corps envoyé au modèle).
 * @type {Array<{ contents: Array<{ role: string, parts: Array<{ text: string }> }> }>}
 */
export const geminiRequests = [];

export const geminiHandlers = [
  http.post(GEMINI_URL, async ({ request }) => {
    geminiRequests.push(
      /** @type {(typeof geminiRequests)[number]} */ (await request.clone().json())
    );

    if (latencyMs > 0) await delay(latencyMs);

    const scenario = geminiScenarios[active];

    // JSON volontairement cassé : on renvoie une string non-JSON avec un
    // content-type JSON pour simuler un proxy en vrac.
    if (typeof scenario.body === 'string') {
      return new HttpResponse(scenario.body, {
        status: scenario.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    return HttpResponse.json(scenario.body, { status: scenario.status });
  }),
];
