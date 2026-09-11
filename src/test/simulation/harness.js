// @ts-check
/**
 * Harnais de simulation — V4 de docs/ai/roadmap-automatisation.md.
 *
 * Idée (le « simulateur » de FoundationDB dans la vidéo) : à chaque commit, on
 * secoue le système avec des pannes tirées au hasard — mais de façon
 * **reproductible via une graine (seed)**. Sous n'importe quelle combinaison de
 * pannes, des invariants doivent tenir (jamais de page blanche, jamais de fuite
 * de clé, dégradation gracieuse).
 *
 * En cas de violation, `writeReport()` écrit `reports/simulation-seed-<seed>.md`
 * — un rapport structuré, lisible par un agent, avec la commande de repro. C'est
 * l'entrée de la V5 (rapport → issue → agent qui corrige).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  setGeminiScenario,
  setGeminiLatency,
  setSupabaseScenario,
  setSupabaseLatency,
} from '../mocks/index.js';

/**
 * PRNG déterministe (mulberry32) : même seed ⇒ même suite de tirages.
 * @param {number} seed
 * @returns {() => number} tirage dans [0, 1)
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GEMINI_FAULTS = [
  'nominal',
  'quotaExceeded',
  'overloaded',
  'serverError',
  'malformedJson',
  'empty',
  'blocked',
  'promptInjectionInReply',
];

const SUPABASE_COURSES_FAULTS = ['nominal', 'empty', 'malformedRow', 'error'];
const SUPABASE_WAITLIST_FAULTS = ['ok', 'duplicate', 'error'];
const LATENCIES = [0, 0, 50, 200, 800];

/**
 * @template T
 * @param {() => number} rng
 * @param {readonly T[]} arr
 * @returns {T}
 */
const pick = (rng, arr) => /** @type {T} */ (arr[Math.floor(rng() * arr.length)]);

/**
 * Tire une combinaison de pannes à partir du RNG.
 * @param {() => number} rng
 */
export function pickFaults(rng) {
  return {
    gemini: pick(rng, GEMINI_FAULTS),
    geminiLatencyMs: pick(rng, LATENCIES),
    courses: pick(rng, SUPABASE_COURSES_FAULTS),
    waitlist: pick(rng, SUPABASE_WAITLIST_FAULTS),
    supabaseLatencyMs: pick(rng, LATENCIES),
  };
}

/** @param {ReturnType<typeof pickFaults>} faults */
export function applyFaults(faults) {
  setGeminiScenario(/** @type {any} */ (faults.gemini));
  setGeminiLatency(faults.geminiLatencyMs);
  setSupabaseScenario(/** @type {any} */ ({ courses: faults.courses, waitlist: faults.waitlist }));
  setSupabaseLatency(faults.supabaseLatencyMs);
}

const REPORTS_DIR = join(process.cwd(), 'reports');

/**
 * Écrit un rapport de bug exploitable par un agent (V5).
 * @param {{ seed: number, faults: object, phase: string, invariant: string, error: unknown }} d
 * @returns {string} chemin du fichier écrit
 */
export function writeReport({ seed, faults, phase, invariant, error }) {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const file = join(REPORTS_DIR, `simulation-seed-${seed}.md`);
  const stack = error instanceof Error ? (error.stack ?? error.message) : String(error);

  writeFileSync(
    file,
    `# Échec de simulation — seed ${seed}

- **Date** : ${new Date().toISOString()}
- **Reproduire** : \`SIM_SEEDS=${seed} npm run test:simulation\`
- **Phase** : \`${phase}\`
- **Invariant violé** : ${invariant}

## Pannes injectées

\`\`\`json
${JSON.stringify(faults, null, 2)}
\`\`\`

## Erreur / valeur inattendue

\`\`\`
${stack}
\`\`\`

## Étapes suivantes (pour l'agent)

1. \`SIM_SEEDS=${seed} npm run test:simulation\` pour reproduire.
2. Localiser le point où l'invariant casse (\`${phase}\`).
3. Corriger pour que la dégradation reste gracieuse sous cette combinaison de pannes.
4. Ajouter un test de régression : \`npm run test:regression:new -- "simulation-seed-${seed}"\`.
`,
    'utf8'
  );
  return file;
}
