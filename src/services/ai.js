// @ts-check
import { env, isAiConfigured, isCourseDraftConfigured } from '../config/env.js';
import { logger, serializeError } from '../lib/logger.js';
import { parseOrThrow } from '../lib/schemas/parse.js';
import {
  geminiTextSchema,
  geminiProxySuccessSchema,
  geminiProxyErrorSchema,
  courseDraftSuccessSchema,
} from '../lib/schemas/index.js';
// AD-2 : import d'un autre service, pas du SDK Supabase directement — seul
// services/supabase.js importe `@supabase/supabase-js`.
import { getSession } from './supabase.js';

// ────────────────────────────────────────────────────────────────────────────
// Architecture Spine AD-1 — RÉSOLU (branche fix/ad-1-gemini-proxy).
//
// Cet adaptateur n'appelle plus Gemini DEPUIS LE NAVIGATEUR. Il fait un unique
// `fetch()` HTTPS vers l'Edge Function Supabase `gemini-proxy`, qui détient la
// clé côté serveur (`GEMINI_API_KEY`, jamais `VITE_`) et fait tout le mapping
// spécifique à Gemini (rôles, images `inlineData`, retrait du message d'accueil
// en tête d'historique).
//
// Contrat côté client → proxy : `POST { history, systemInstruction }`.
// Contrat proxy → client : `{ text }` (200) ou `{ error, status? }` (4xx/5xx).
//
// Cf. supabase/functions/gemini-proxy/index.ts, docs/ai/security-rules.md § « Clé Gemini ».
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_INSTRUCTION =
  "Tu es un assistant IA expert en design UI/UX. Ton rôle est d'aider l'utilisateur à concevoir des interfaces ou rédiger de bons prompts pour générer des UI. Quand ta réponse contient un prompt final destiné à être envoyé au Générateur UI, place ce prompt et uniquement ce prompt dans un unique bloc de code Markdown (```), sans language tag ; toute explication ou conseil complémentaire doit rester en dehors de ce bloc.";

const GENERIC_ERROR =
  "Désolé, une erreur s'est produite lors de la communication avec l'IA. Veuillez réessayer dans quelques instants.";
const QUOTA_ERROR =
  "⚠️ La limite d'utilisation de l'IA est atteinte (quota dépassé). Réessayez plus tard.";
const OVERLOADED_ERROR =
  "⚠️ Les serveurs de l'IA sont actuellement surchargés. Veuillez réessayer dans quelques instants.";

/**
 * Envoie une conversation au proxy IA et renvoie la réponse du modèle.
 *
 * Ne rejette jamais : toute panne (réseau, proxy, modèle) est dégradée en un
 * message affichable. Une complétion vide est traitée comme une défaillance
 * (pas de `""` silencieux — cf. `geminiTextSchema`).
 *
 * @param {Array<{ role: string, text: string, image?: string }>} history - historique complet
 * @param {string|null} [customInstruction] - instruction système du projet (optionnel)
 * @returns {Promise<string>}
 */
export const generateAIResponse = async (history, customInstruction = null) => {
  if (!isAiConfigured()) {
    logger.warn('ai:not-configured');
    return "⚠️ Erreur : le proxy IA n'est pas configuré. Renseignez `VITE_GEMINI_PROXY_URL` dans `.env` (URL de l'Edge Function `gemini-proxy`).";
  }

  try {
    const res = await fetch(env.geminiProxyUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        history,
        systemInstruction: customInstruction || DEFAULT_INSTRUCTION,
      }),
    });

    /** @type {unknown} */
    let payload;
    try {
      payload = await res.json();
    } catch (parseErr) {
      logger.error('ai:proxy-bad-json', { status: res.status, ...serializeError(parseErr) });
      return GENERIC_ERROR;
    }

    if (!res.ok) {
      const err = geminiProxyErrorSchema.safeParse(payload);
      const upstream = err.success ? err.data.status : undefined;
      logger.error('ai:proxy-call-failed', {
        httpStatus: res.status,
        upstream,
        proxyError: err.success ? err.data.error : undefined,
      });
      if (res.status === 429 || upstream === 429) return QUOTA_ERROR;
      if (upstream === 503) return OVERLOADED_ERROR;
      return GENERIC_ERROR;
    }

    const data = parseOrThrow(geminiProxySuccessSchema, payload, 'gemini-proxy:response');
    // Une complétion vide / non-textuelle est une défaillance du modèle : on la
    // traite comme telle plutôt que de renvoyer '' .
    return parseOrThrow(geminiTextSchema, data.text, 'gemini-proxy:text');
  } catch (error) {
    logger.error('ai:proxy-call-failed', { ...serializeError(error) });
    return GENERIC_ERROR;
  }
};

/**
 * Cœur partagé des deux entrées du brouillon IA (URL YouTube ou fichier
 * uploadé) — même Edge Function `course-draft`, même gestion d'erreur, seul
 * le corps de la requête diffère. Jamais appelée directement en dehors de ce
 * module (cf. les deux exports ci-dessous).
 *
 * Admin uniquement (AdminPage.jsx → CourseEditor) : la fonction exige un JWT
 * valide (`verify_jwt: true` côté Edge Function), donc un appel sans session
 * active échoue proprement plutôt que de partir en requête vouée à l'échec.
 * Jamais de publication automatique : le résultat ne fait que préremplir le
 * formulaire, l'admin relit et enregistre (ou pas) lui-même.
 *
 * @param {{ videoUrl: string } | { storagePath: string }} body
 * @returns {Promise<
 *   | { success: true, draft: { title: string, description: string, duration: string, content: string } }
 *   | { success: false, error: string }
 * >}
 */
const requestCourseDraft = async (body) => {
  if (!isCourseDraftConfigured()) {
    return {
      success: false,
      error: "Le brouillon IA n'est pas configuré (VITE_COURSE_DRAFT_URL absente).",
    };
  }

  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Session expirée — reconnectez-vous puis réessayez.' };
    }

    const res = await fetch(env.courseDraftUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    /** @type {unknown} */
    let payload;
    try {
      payload = await res.json();
    } catch (parseErr) {
      logger.error('ai:course-draft-bad-json', { status: res.status, ...serializeError(parseErr) });
      return { success: false, error: 'Réponse illisible du serveur.' };
    }

    if (!res.ok) {
      const err = geminiProxyErrorSchema.safeParse(payload);
      logger.error('ai:course-draft-failed', {
        httpStatus: res.status,
        proxyError: err.success ? err.data.error : undefined,
      });
      if (res.status === 429) {
        return { success: false, error: "Limite d'utilisation IA atteinte, réessayez plus tard." };
      }
      return {
        success: false,
        error: err.success ? err.data.error : 'Échec de génération du brouillon.',
      };
    }

    const draft = parseOrThrow(courseDraftSuccessSchema, payload, 'course-draft:response');
    return { success: true, draft };
  } catch (error) {
    logger.error('ai:course-draft-failed', { ...serializeError(error) });
    return { success: false, error: 'Échec de génération du brouillon.' };
  }
};

/**
 * Brouillon de cours à partir d'une URL YouTube publique — Gemini l'ingère
 * nativement, aucun fichier n'est jamais téléchargé côté serveur.
 * @param {string} videoUrl
 * @returns {ReturnType<typeof requestCourseDraft>}
 */
export const generateCourseDraftFromVideo = (videoUrl) => requestCourseDraft({ videoUrl });

/**
 * Brouillon de cours à partir d'un fichier vidéo déjà uploadé (via
 * `uploadCourseDraftVideo`, services/supabase.js) dans le bucket
 * `course-draft-uploads` — pour TikTok/Facebook, que Gemini ne sait pas
 * ingérer par URL (Story 10.1/10.5). Le fichier est supprimé côté serveur
 * une fois la génération terminée, succès ou échec.
 * @param {string} storagePath
 * @returns {ReturnType<typeof requestCourseDraft>}
 */
export const generateCourseDraftFromUploadedVideo = (storagePath) =>
  requestCourseDraft({ storagePath });
