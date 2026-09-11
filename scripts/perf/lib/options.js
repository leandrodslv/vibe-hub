// Helpers partagés par tous les scénarios k6.
// k6 exécute du JS dans son propre runtime (goja) — pas Node : pas de `require`,
// que des imports ESM depuis des modules k6 ou des fichiers locaux.

/** URL cible. TOUJOURS une préproduction / un déploiement dédié — jamais la prod
 *  ni le projet Supabase de prod (un stress à 10 000 VUs = déni de service + coût). */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:4173';

/** Endpoint REST Supabase optionnel, pour tester le chemin de données (lecture
 *  publique de `courses`, protégée par RLS). Activé seulement si les 2 sont fournis. */
export const SUPABASE_URL = __ENV.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
export const TEST_API = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

/** Seuils de réussite communs — un scénario échoue (exit code ≠ 0) s'ils sont dépassés. */
export const thresholds = {
  http_req_failed: ['rate<0.01'], // < 1 % d'erreurs HTTP
  http_req_duration: ['p(95)<800', 'p(99)<2000'], // 95 % < 800 ms, 99 % < 2 s
  checks: ['rate>0.99'],
};

/** Paliers de montée en charge demandés : 1 → 5 → 10 → 20 → 30 → 50 → 100 →
 *  250 → 500 → 1000 → 2500 → 5000 → 10000, chaque palier tenu puis redescente. */
export const RAMP_STAGES = [
  { duration: '30s', target: 1 },
  { duration: '30s', target: 5 },
  { duration: '30s', target: 10 },
  { duration: '30s', target: 20 },
  { duration: '30s', target: 30 },
  { duration: '45s', target: 50 },
  { duration: '45s', target: 100 },
  { duration: '1m', target: 250 },
  { duration: '1m', target: 500 },
  { duration: '1m', target: 1000 },
  { duration: '1m', target: 2500 },
  { duration: '2m', target: 5000 },
  { duration: '2m', target: 10000 },
  { duration: '2m', target: 10000 }, // palier haut tenu
  { duration: '1m', target: 0 }, // redescente
];
