// @ts-check
/**
 * Handler MSW pour l'Edge Function `course-draft`.
 *
 * Même approche que `handlers/gemini.js` : interception réseau plutôt que
 * `vi.mock` du service, pour tester le VRAI code de mapping d'erreur de
 * `generateCourseDraftFromVideo` (src/services/ai.js).
 */

import { http, HttpResponse } from 'msw';
import { courseDraftScenarios } from '../scenarios/course-draft.js';

/** URL utilisée par les mocks d'env dans la suite de tests. */
export const COURSE_DRAFT_TEST_URL = 'https://proxy.test/course-draft';

const PROXY_URL = /\/course-draft(\?|$)/;

/** @type {import('../scenarios/course-draft.js').CourseDraftScenarioName} */
let active = 'nominal';

/** @param {import('../scenarios/course-draft.js').CourseDraftScenarioName} name */
export function setCourseDraftScenario(name) {
  if (!(name in courseDraftScenarios)) throw new Error(`Scénario course-draft inconnu : ${name}`);
  active = name;
}

export function resetCourseDraftScenario() {
  active = 'nominal';
}

/**
 * Derniers corps de requête envoyés au proxy, et l'en-tête Authorization reçu
 * (pour vérifier que le JWT de session est bien transmis).
 * @type {Array<{ videoUrl: string, authorization: string | null }>}
 */
export const courseDraftRequests = [];

export const courseDraftHandlers = [
  http.post(PROXY_URL, async ({ request }) => {
    const body = /** @type {{ videoUrl: string }} */ (await request.clone().json());
    courseDraftRequests.push({
      videoUrl: body.videoUrl,
      authorization: request.headers.get('authorization'),
    });

    const scenario = courseDraftScenarios[active];
    return HttpResponse.json(scenario.body, { status: scenario.status });
  }),
];
