// @ts-check
import { env, isAiConfigured } from '../config/env.js';
import { logger, serializeError } from '../lib/logger.js';
import { parseOrThrow } from '../lib/schemas/parse.js';
import {
  geminiTextSchema,
  geminiProxySuccessSchema,
  geminiProxyErrorSchema,
} from '../lib/schemas/index.js';

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
