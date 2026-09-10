import { describe, it, expect, vi } from 'vitest';
import { makeRng, pickFaults, applyFaults, writeReport } from './harness.js';

// Env mocké : clé factice reconnaissable (on vérifie qu'elle ne FUIT jamais dans
// une réponse rendue à l'utilisateur), Supabase/IA « configurés ».
const FAKE_KEY = 'AQ.sim-key-DO-NOT-LEAK';

vi.mock('../../config/env.js', () => ({
  env: {
    geminiApiKey: FAKE_KEY,
    supabaseUrl: 'https://sim.supabase.co',
    supabaseAnonKey: 'sim-anon',
    mode: 'test',
    isProd: false,
  },
  isAiConfigured: () => true,
  isSupabaseConfigured: () => true,
}));

const { generateAIResponse } = await import('../../services/ai.js');
const { getCourses, addToWaitlist } = await import('../../services/supabase.js');

// Graines : par défaut 1..12, surchargeable (matrice CI / run nocturne étendu).
const SEEDS = (process.env.SIM_SEEDS || Array.from({ length: 12 }, (_, i) => i + 1).join(','))
  .split(',')
  .map((s) => Number(s.trim()))
  .filter(Number.isFinite);

describe('simulation de résilience (seedée)', () => {
  it.each(SEEDS)(
    'seed %i : le front reste utilisable sous n’importe quelle combinaison de pannes',
    async (seed) => {
      const rng = makeRng(seed);
      const faults = pickFaults(rng);
      applyFaults(faults);

      /** @param {string} phase @param {string} invariant @param {unknown} error */
      const fail = (phase, invariant, error) => {
        const file = writeReport({ seed, faults, phase, invariant, error });
        throw new Error(
          `Invariant violé [${phase}] seed=${seed} : ${invariant}\nRapport : ${file}\n` +
            (error instanceof Error ? error.stack : String(error))
        );
      };

      // ── Invariant 1 : generateAIResponse renvoie TOUJOURS une string ────────
      let reply;
      try {
        reply = await generateAIResponse([{ role: 'user', text: 'Fais-moi un bouton' }]);
      } catch (err) {
        return fail('generateAIResponse', 'ne doit jamais rejeter (dégrader en message)', err);
      }
      if (typeof reply !== 'string' || reply.length === 0) {
        return fail('generateAIResponse', 'doit renvoyer une string non vide', reply);
      }

      // ── Invariant 2 : la clé API ne fuit jamais dans la réponse ─────────────
      if (reply.includes(FAKE_KEY) || reply.includes('sim-anon')) {
        return fail('generateAIResponse', 'la réponse ne doit jamais contenir un secret', reply);
      }

      // ── Invariant 3 : getCourses résout en tableau OU lève une Error ────────
      try {
        const courses = await getCourses();
        if (!Array.isArray(courses)) {
          return fail('getCourses', 'doit résoudre en tableau', courses);
        }
      } catch (err) {
        if (!(err instanceof Error)) {
          return fail('getCourses', 'un échec doit être une Error (jamais un rejet nu)', err);
        }
      }

      // ── Invariant 4 : addToWaitlist résout toujours en {success|duplicate|error} ─
      let outcome;
      try {
        outcome = await addToWaitlist('ui-builder', 'a@b.co');
      } catch (err) {
        return fail('addToWaitlist', 'ne doit jamais rejeter', err);
      }
      const keys = Object.keys(outcome);
      const known = ['success', 'duplicate', 'error'];
      if (keys.length !== 1 || !known.includes(keys[0])) {
        return fail('addToWaitlist', 'doit renvoyer exactement {success|duplicate|error}', outcome);
      }

      expect(true).toBe(true);
    }
  );
});
