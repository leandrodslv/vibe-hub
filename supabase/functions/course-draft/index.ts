// ════════════════════════════════════════════════════════════════════════════
// Edge Function `course-draft` — brouillon de cours généré depuis une vidéo
// (espace de création admin, cf. AdminPage.jsx → CourseEditor).
//
// Raison d'être : même logique que `gemini-proxy` (AD-1, la clé Gemini ne DOIT
// PAS vivre dans le navigateur) mais un contrat différent — sortie JSON
// structurée (title/description/duration/content), pas du texte de chat — donc
// une fonction dédiée plutôt que de surcharger le contrat de `gemini-proxy`.
//
// Deux entrées, un seul contrat de sortie :
//
//   1. `{ videoUrl }` — URL YouTube publique (`fileData.fileUri`, supporté
//      nativement par l'API Gemini). Aucune vidéo n'est téléchargée ni
//      stockée par cette fonction dans ce chemin.
//
//   2. `{ storagePath }` — chemin d'un fichier dans le bucket privé
//      `course-draft-uploads` (0013_course_draft_video_uploads.sql), pour les
//      vidéos hors YouTube (TikTok, Facebook...) : Gemini ne sait PAS ingérer
//      ces URLs directement, et cette fonction ne doit JAMAIS aller les
//      télécharger elle-même (CGU TikTok/Facebook — cf.
//      epics-video-platforms.md Story 10.1). Le fichier doit avoir été
//      enregistré par l'admin lui-même puis uploadé dans ce bucket depuis le
//      navigateur (RLS : seul is_admin() peut y écrire). Cette fonction lit
//      via service_role (notre propre stockage, jamais un tiers), envoie les
//      bytes à Gemini, PUIS SUPPRIME le fichier — jamais conservé au-delà de
//      la génération.
//
// `verify_jwt: true` au déploiement (contrairement à `gemini-proxy`) : cette
// fonction n'est appelée que depuis l'admin gated par Supabase Auth, jamais
// par un visiteur anonyme. Le chemin `storagePath` vérifie EN PLUS is_admin()
// explicitement (défense en profondeur, même schéma que get_waitlist_counts) :
// un compte authentifié non-admin ne doit jamais pouvoir déclencher une
// génération, même en devinant un storagePath valide.
//
// Déploiement :
//   supabase functions deploy course-draft   (verify_jwt: true, PAS de --no-verify-jwt)
// Secrets requis : `GEMINI_API_KEY` (déjà posé pour gemini-proxy, réutilisé ici).
// `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` sont
// auto-injectés par Supabase dans l'environnement de toute Edge Function —
// jamais posés manuellement.
// ════════════════════════════════════════════════════════════════════════════

import { GoogleGenAI, Type } from 'npm:@google/genai@^2.15.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { logAiUsage } from '../_shared/ai-usage-log.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MODEL = 'gemini-2.5-flash-lite';
const UPLOAD_BUCKET = 'course-draft-uploads';

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

// Chemin attendu côté client : `<uuid>/<nom-fichier>` — jamais de `..`, jamais
// de chemin absolu (le fichier reste dans le sous-dossier de l'uploadeur).
function isSafeStoragePath(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length < 300 &&
    !value.includes('..') &&
    !value.startsWith('/')
  );
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

async function waitUntilActive(ai: GoogleGenAI, file: { name?: string; state?: string }) {
  let current = file;
  while (current.state === 'PROCESSING') {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    current = await ai.files.get({ name: current.name! });
  }
  if (current.state !== 'ACTIVE') {
    throw new Error(`Traitement Gemini du fichier échoué (état final : ${current.state}).`);
  }
  return current;
}

async function generateFromYouTube(ai: GoogleGenAI, videoUrl: string) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { role: 'user', parts: [{ fileData: { fileUri: videoUrl } }, { text: PROMPT }] },
    ],
    config: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
  });
  return { raw: res.text ?? '', usageMetadata: res.usageMetadata };
}

async function generateFromStorageFile(ai: GoogleGenAI, storagePath: string) {
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: blob, error: downloadError } = await serviceClient.storage
      .from(UPLOAD_BUCKET)
      .download(storagePath);
    if (downloadError || !blob) {
      throw new Error(`Téléchargement du fichier échoué : ${downloadError?.message}`);
    }

    const mimeType = blob.type || 'video/mp4';
    const uploaded = await ai.files.upload({ file: blob, config: { mimeType } });
    const file = await waitUntilActive(ai, uploaded);

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ fileData: { fileUri: file.uri!, mimeType } }, { text: PROMPT }],
        },
      ],
      config: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
    });
    return { raw: res.text ?? '', usageMetadata: res.usageMetadata };
  } finally {
    // Jamais conservé au-delà de la génération, succès ou échec.
    await serviceClient.storage.from(UPLOAD_BUCKET).remove([storagePath]);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405, cors);
  if (!GEMINI_API_KEY) {
    return json({ error: 'Proxy non configuré (GEMINI_API_KEY absente).' }, 503, cors);
  }

  let body: { videoUrl?: unknown; storagePath?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400, cors);
  }

  const hasVideoUrl = body.videoUrl !== undefined;
  const hasStoragePath = body.storagePath !== undefined;
  if (hasVideoUrl === hasStoragePath) {
    return json({ error: 'Fournir exactement un des deux : videoUrl OU storagePath.' }, 400, cors);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    let raw: string;
    let usageMetadata: Awaited<ReturnType<typeof generateFromYouTube>>['usageMetadata'];

    if (hasVideoUrl) {
      if (!isAllowedYouTubeUrl(body.videoUrl)) {
        return json({ error: 'videoUrl doit être une URL YouTube publique (https).' }, 400, cors);
      }
      ({ raw, usageMetadata } = await generateFromYouTube(ai, body.videoUrl));
    } else {
      if (!isSafeStoragePath(body.storagePath)) {
        return json({ error: 'storagePath invalide.' }, 400, cors);
      }
      // Défense en profondeur : l'upload lui-même est déjà gated par
      // is_admin() côté RLS storage, mais on revérifie explicitement ici
      // plutôt que de faire confiance à "authenticated == admin" (même leçon
      // que 0011_admin_access_control.sql).
      const authHeader = req.headers.get('authorization') ?? '';
      const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: isAdmin, error: adminCheckError } = await callerClient.rpc('is_admin');
      if (adminCheckError || !isAdmin) {
        return json({ error: 'Accès refusé.' }, 403, cors);
      }
      ({ raw, usageMetadata } = await generateFromStorageFile(ai, body.storagePath));
    }

    logAiUsage('course-draft', MODEL, usageMetadata);

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
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ level: 'error', at: 'course-draft', status, message }));
    return json({ error: 'Échec de génération.', status }, status === 429 ? 429 : 502, cors);
  }
});

function json(payload: unknown, status: number, cors: HeadersInit) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}
