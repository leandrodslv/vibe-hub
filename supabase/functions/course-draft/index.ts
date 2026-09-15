// ════════════════════════════════════════════════════════════════════════════
// Edge Function `course-draft` — brouillon de cours généré depuis une vidéo
// YouTube (espace de création admin, cf. AdminPage.jsx → CourseEditor).
//
// Raison d'être : même logique que `gemini-proxy` (AD-1, la clé Gemini ne DOIT
// PAS vivre dans le navigateur) mais un contrat différent — sortie JSON
// structurée (title/description/duration/content), pas du texte de chat — donc
// une fonction dédiée plutôt que de surcharger le contrat de `gemini-proxy`.
//
// Portée volontairement étroite : SEULEMENT des URLs YouTube publiques
// (`fileData.fileUri`, supporté nativement par l'API Gemini — aucune vidéo
// n'est téléchargée ni stockée par cette fonction). Jamais de fichier vidéo
// uploadé ici — le pipeline « vidéos propriétaires » (upload Vimeo) est un
// script LOCAL séparé (`scripts/course-from-video.mjs`), pas une Edge Function.
//
// `verify_jwt: true` au déploiement (contrairement à `gemini-proxy`) : cette
// fonction n'est appelée que depuis l'admin gated par Supabase Auth, jamais
// par un visiteur anonyme — coût par appel nettement plus élevé qu'un message
// de chat (traitement vidéo), donc pas de raison de l'exposer sans JWT valide.
//
// Déploiement :
//   supabase functions deploy course-draft   (verify_jwt: true, PAS de --no-verify-jwt)
// Secret requis : `GEMINI_API_KEY` (déjà posé pour gemini-proxy, réutilisé ici).
// ════════════════════════════════════════════════════════════════════════════

import { GoogleGenAI, Type } from 'npm:@google/genai@^2.15.0';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = 'gemini-2.5-flash-lite';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

const ALLOWED_VIDEO_HOSTS = ['youtube.com', 'youtu.be'];

function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    Vary: 'Origin',
  };
}

// Même logique que `matchesHost` côté client (src/lib/validation.js) : hostname
// parsé, jamais un `.includes()` sur l'URL entière (évite `youtube.com.evil.tld`).
function isAllowedYouTubeUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const { hostname, protocol } = new URL(value);
    if (protocol !== 'https:') return false;
    const h = hostname.toLowerCase();
    return ALLOWED_VIDEO_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

const PROMPT = `Regarde cette vidéo et rédige, à partir de son contenu réel, un cours pour un designer UI/UX francophone. Réponds STRICTEMENT au format JSON demandé, sans texte hors du JSON.

- title : titre court et concret (pas d'emoji, pas de ponctuation finale).
- description : 1 à 2 phrases factuelles résumant ce que le cours apprend (pas de superlatifs, pas de tournure publicitaire).
- duration : durée approximative de la vidéo au format mm:ss si tu peux l'estimer, sinon une chaîne vide.
- content : le support de cours complet en Markdown (titres avec #, listes, exemples concrets tirés de la vidéo) — un vrai contenu pédagogique que quelqu'un peut lire et comprendre SANS avoir vu la vidéo, pas un simple résumé de 3 lignes.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    duration: { type: Type.STRING },
    content: { type: Type.STRING },
  },
  required: ['title', 'description', 'duration', 'content'],
};

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405, cors);
  if (!GEMINI_API_KEY) {
    return json({ error: 'Proxy non configuré (GEMINI_API_KEY absente).' }, 503, cors);
  }

  let body: { videoUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400, cors);
  }

  if (!isAllowedYouTubeUrl(body.videoUrl)) {
    return json({ error: 'videoUrl doit être une URL YouTube publique (https).' }, 400, cors);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ fileData: { fileUri: body.videoUrl } }, { text: PROMPT }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const raw = res.text ?? '';
    let draft: unknown;
    try {
      draft = JSON.parse(raw);
    } catch {
      console.error(JSON.stringify({ level: 'error', at: 'course-draft', reason: 'json-parse' }));
      return json({ error: 'Réponse du modèle illisible (JSON invalide).' }, 502, cors);
    }

    return json(draft, 200, cors);
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 500;
    console.error(JSON.stringify({ level: 'error', at: 'course-draft', status }));
    return json({ error: 'Échec de génération.', status }, status === 429 ? 429 : 502, cors);
  }
});

function json(payload: unknown, status: number, cors: HeadersInit) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}
