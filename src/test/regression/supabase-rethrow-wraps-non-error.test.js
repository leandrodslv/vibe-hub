import { describe, it, expect, vi } from 'vitest';
import { setSupabaseScenario } from '../mocks';

/**
 * Régression — trouvée par la simulation V4 (seed 7).
 *
 * Symptôme : sous une panne PostgREST, `getCourses()` rejetait avec l'objet
 *   d'erreur nu de supabase-js (`{ message, code }`), pas une `Error`. Un
 *   `catch` qui logge `err.stack` ou une remontée Sentry recevait `undefined`.
 * Cause    : `rethrow()` faisait `throw error;` sans envelopper les objets nus.
 *
 * Invariant : tout échec d'un service Supabase est une instance de `Error`.
 */
vi.mock('../../config/env.js', () => ({
  env: {
    supabaseUrl: 'https://reg.supabase.co',
    supabaseAnonKey: 'anon',
    mode: 'test',
    isProd: false,
  },
  isSupabaseConfigured: () => true,
  isAiConfigured: () => false,
}));

const { getCourses } = await import('../../services/supabase.js');

describe('régression simulation-seed-7', () => {
  it('getCourses rejette avec une Error (jamais un objet nu) sous panne PostgREST', async () => {
    setSupabaseScenario({ courses: 'error' });
    await expect(getCourses()).rejects.toBeInstanceOf(Error);
  });
});
