// ════════════════════════════════════════════════════════════════════════════
// Edge Function `gemini-proxy` — Architecture Spine AD-1
//
// Raison d'être : la clé Gemini ne DOIT PAS vivre dans le navigateur. Ce proxy
// la détient côté serveur (variable d'env `GEMINI_API_KEY`, jamais `VITE_`) et
// expose un unique endpoint que `src/services/ai.js` appellera par `fetch()`.
//
// Déploiement :
//   supabase secrets set GEMINI_API_KEY=...            # la VRAIE clé, serveur
//   supabase functions deploy gemini-proxy --no-verify-jwt
//
// Runtime : Deno (version épinglée par Supabase — ne pas suivre le Deno mainline).
// SDK : `@google/genai` (l'ancien `@google/generative-ai` est déprécié par Google).
//
// TODO (Deferred dans le Spine) :
//   - rate limiting / plafond de coût (le point d'application est ICI) ;
//   - quota par IP / par session.
// ════════════════════════════════════════════════════════════════════════════

import { GoogleGenAI } from 'npm:@google/genai@^2.15.0';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = 'gemini-2.5-flash-lite';

// Origines autorisées à appeler le proxy (CORS). À adapter au domaine de prod.
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    Vary: 'Origin',
  };
}

const MAX_HISTORY = 40;
const MAX_CHARS = 20_000;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') {
    return json({ error: 'Méthode non autorisée' }, 405, cors);
  }
  if (!GEMINI_API_KEY) {
    return json({ error: 'Proxy non configuré (GEMINI_API_KEY absente).' }, 503, cors);
  }

  let body: {
    history?: Array<{ role: string; text: string; image?: string }>;
    systemInstruction?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400, cors);
  }

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
  if (history.length === 0) return json({ error: 'history requis.' }, 400, cors);

  const contents = history
    .map((m) => {
      const parts: Array<Record<string, unknown>> = [
        { text: String(m.text ?? '').slice(0, MAX_CHARS) },
      ];
      // Image jointe : data URL `data:<mime>;base64,<data>` → `inlineData`.
      if (typeof m.image === 'string' && m.image.startsWith('data:')) {
        const comma = m.image.indexOf(',');
        const mimeType = m.image.slice(5, m.image.indexOf(';'));
        const data = comma > -1 ? m.image.slice(comma + 1) : '';
        if (mimeType && data) parts.push({ inlineData: { mimeType, data } });
      }
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    })
    // Gemini exige que le premier message vienne de l'utilisateur.
    .filter((_, i, arr) => !(i === 0 && arr[0].role === 'model'));

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const res = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: body.systemInstruction
        ? { systemInstruction: String(body.systemInstruction).slice(0, MAX_CHARS) }
        : undefined,
    });
    return json({ text: res.text ?? '' }, 200, cors);
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 500;
    console.error(JSON.stringify({ level: 'error', at: 'gemini-proxy', status }));
    return json({ error: 'Échec de génération.', status }, status === 429 ? 429 : 502, cors);
  }
});

function json(payload: unknown, status: number, cors: HeadersInit) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}
