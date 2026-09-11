// Stress test — montée en paliers 1 → 5 → 10 → 20 → 30 → 50 → 100 → 250 → 500
// → 1000 → 2500 → 5000 → 10 000 utilisateurs simultanés.
//
// But : trouver le POINT DE RUPTURE (à partir de combien de VUs la p95 explose /
// les erreurs montent) et vérifier que le service se rétablit après la redescente.
//
// ⚠️  10 000 VUs, c'est un déni de service volontaire. À NE lancer QUE contre :
//     - un déploiement de préproduction dédié (jamais la prod),
//     - avec l'accord de l'hébergeur (Vercel/Supabase ont des limites de débit
//       et facturent la bande passante / les requêtes),
//     - depuis une machine ou un runner capable de générer cette charge
//       (k6 Cloud, ou plusieurs runners avec `k6 run --execution-segment`).
//
//   k6 run -e BASE_URL=https://staging.vibehub.fr scripts/perf/stress.js
//   # data-path inclus :
//   k6 run -e BASE_URL=... -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... scripts/perf/stress.js
import { RAMP_STAGES } from './lib/options.js';
import { visitorJourney } from './lib/scenario.js';

export const options = {
  scenarios: {
    paliers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: RAMP_STAGES,
      gracefulRampDown: '1m',
    },
  },
  // Seuils volontairement plus tolérants qu'en load : on CHERCHE la limite, on ne
  // veut pas juste échouer. `abortOnFail` coupe si le service s'effondre vraiment.
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '30s' }],
    http_req_duration: ['p(95)<5000'],
  },
};

export default visitorJourney;

// Résumé lisible en fin de run (+ JSON machine pour l'historique / les graphes).
export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    'perf-results/stress-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const g = (name, key = 'value') => (m[name] && m[name].values ? m[name].values[key] : 'n/a');
  return [
    '',
    '──────── STRESS TEST — RÉSUMÉ ────────',
    `Requêtes totales      : ${g('http_reqs', 'count')}`,
    `Taux d'échec HTTP     : ${(Number(g('http_req_failed', 'rate')) * 100).toFixed(2)} %`,
    `Durée req p95 / p99   : ${Number(g('http_req_duration', 'p(95)')).toFixed(0)} ms / ${Number(
      g('http_req_duration', 'p(99)')
    ).toFixed(0)} ms`,
    `VUs max               : ${g('vus_max', 'value')}`,
    `Checks OK             : ${(Number(g('checks', 'rate')) * 100).toFixed(2)} %`,
    '─────────────────────────────────────',
    '',
  ].join('\n');
}
