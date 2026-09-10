// @ts-check
/**
 * Handlers MSW pour l'API REST Supabase (PostgREST).
 *
 * Permet de tester `src/services/supabase.js` de bout en bout — y compris les
 * gardes Zod de V1 — contre de vraies réponses HTTP, plutôt que contre le
 * query-builder chaînable mocké à la main de `supabase.test.js`.
 *
 * Les tests d'intégration (V2) valident les policies contre un vrai Postgres ;
 * ici on valide le CODE CLIENT (parsing, mapping d'erreur) contre des payloads
 * PostgREST figés, dont des payloads volontairement cassés.
 */

import { http, HttpResponse } from 'msw';
import { courseScenarios } from '../scenarios/courses.js';

const REST = /\/rest\/v1\//;

const state = {
  /** @type {'nominal' | 'empty' | 'malformedRow' | 'error'} */
  courses: 'nominal',
  /** @type {'ok' | 'duplicate' | 'error'} */
  waitlist: 'ok',
};

/** @param {Partial<typeof state>} next */
export function setSupabaseScenario(next) {
  Object.assign(state, next);
}

export function resetSupabaseScenario() {
  state.courses = 'nominal';
  state.waitlist = 'ok';
}

/**
 * @param {string} code    code d'erreur PostgREST (`23505` = violation d'unicité)
 * @param {string} message
 */
const pgError = (code, message) =>
  HttpResponse.json(
    { code, message, details: null, hint: null },
    { status: code === '23505' ? 409 : 500 }
  );

export const supabaseHandlers = [
  // ─── GET /rest/v1/courses ───────────────────────────────────────────────
  http.get(new RegExp(REST.source + 'courses'), ({ request }) => {
    if (state.courses === 'error') return pgError('500', 'internal');

    const url = new URL(request.url);
    let rows = courseScenarios[state.courses] ?? courseScenarios.nominal;

    // reproduit `.eq('published', true)` de getCourses()
    if (url.searchParams.get('published') === 'eq.true') {
      rows = rows.filter((r) => r.published === true);
    }
    return HttpResponse.json(rows);
  }),

  // ─── POST /rest/v1/courses (createCourse) ───────────────────────────────
  http.post(new RegExp(REST.source + 'courses'), async ({ request }) => {
    const body = /** @type {Record<string, unknown>} */ (await request.json());
    const row = { id: 42, created_at: '2026-01-01T00:00:00Z', ...body };
    return HttpResponse.json(row, { status: 201 });
  }),

  // ─── POST /rest/v1/waitlist (addToWaitlist) ─────────────────────────────
  http.post(new RegExp(REST.source + 'waitlist'), () => {
    if (state.waitlist === 'duplicate') return pgError('23505', 'duplicate key value');
    if (state.waitlist === 'error') return pgError('500', 'boom');
    return new HttpResponse(null, { status: 201 });
  }),

  // ─── POST /rest/v1/rpc/get_waitlist_counts ──────────────────────────────
  http.post(new RegExp(REST.source + 'rpc/get_waitlist_counts'), () =>
    HttpResponse.json([
      { tool_id: 'ui-builder', signups: 3 },
      { tool_id: 'design-lint', signups: 1 },
    ])
  ),
];
