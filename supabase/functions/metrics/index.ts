// ════════════════════════════════════════════════════════════════════════════
// Edge Function `metrics` — collecte web-vitals + erreurs (Observabilité V10)
//
// `src/lib/observability.js` POST ici (navigator.sendBeacon) quand
// `VITE_METRICS_URL` pointe dessus. Insère via service_role dans `public.metrics`
// (migration 0002). Défense en profondeur : on borne les tailles et on retire
// tout ce qui ressemble à un secret / e-mail, même si le client nettoie déjà.
//
// Déploiement :
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   # déjà présent en général
//   supabase functions deploy metrics --no-verify-jwt
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

function cors(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  };
}

const SECRET_RE = /(AIza[0-9A-Za-z_-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ|[\w.+-]+@[\w-]+\.[\w.-]+)/g;
const clean = (v: unknown, max = 500): string =>
  String(v ?? '')
    .replace(SECRET_RE, '[redacted]')
    .slice(0, max);

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405, headers });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return new Response('JSON invalide', { status: 400, headers });
  }

  const kind = b.kind === 'error' ? 'error' : b.kind === 'web-vital' ? 'web-vital' : null;
  if (!kind) return new Response('kind invalide', { status: 400, headers });

  const row = {
    kind,
    release: clean(b.release, 64),
    session_id: clean(b.sessionId, 64),
    metric: b.metric ? clean(b.metric, 16) : null,
    value: typeof b.value === 'number' && Number.isFinite(b.value) ? b.value : null,
    rating: b.rating ? clean(b.rating, 24) : null,
    at: b.at ? clean(b.at, 64) : null,
    payload: JSON.parse(clean(JSON.stringify(b), 4000)),
  };

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { error } = await supabase.from('metrics').insert(row);
  if (error) {
    console.error(JSON.stringify({ level: 'error', at: 'metrics-fn', code: error.code }));
    return new Response('insert échoué', { status: 502, headers });
  }
  return new Response(null, { status: 204, headers });
});
