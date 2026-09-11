// @ts-check
/**
 * Contrat des réponses du modèle Gemini.
 *
 * Une réponse malformée d'un LLM est exactement le type d'« erreur générée par
 * une IA » que la règle d'or veut attraper tôt. Ici on est donc STRICT : un
 * format inattendu lève (`parseOrThrow`), il ne dégrade pas en silence.
 *
 * Deux surfaces :
 *  - `geminiTextSchema`      : le texte brut renvoyé par le SDK (`response.text()`),
 *    usage transitoire de `src/services/ai.js` (dette AD-1).
 *  - `geminiProxyResponseSchema` : le JSON de l'Edge Function `gemini-proxy`,
 *    cible de la migration serveur.
 */

import { z } from 'zod';

/** Texte d'une complétion : chaîne non vide (une chaîne vide = échec silencieux). */
export const geminiTextSchema = z.string().min(1, 'réponse vide du modèle');

/** Succès du proxy : { text }. */
export const geminiProxySuccessSchema = z.object({ text: z.string() }).strict();

/** Échec du proxy : { error, status? }. */
export const geminiProxyErrorSchema = z
  .object({ error: z.string(), status: z.number().optional() })
  .strict();

/** Réponse du proxy, succès OU échec structuré. */
export const geminiProxyResponseSchema = z.union([
  geminiProxySuccessSchema,
  geminiProxyErrorSchema,
]);

/** @typedef {z.infer<typeof geminiProxyResponseSchema>} GeminiProxyResponse */
