// @ts-check
/**
 * Point de passage unique pour valider une donnée qui vient d'une frontière
 * (réseau, env, réponse d'un modèle, localStorage).
 *
 * Règle d'or du projet : « détecter une erreur générée par une IA le plus tôt
 * possible ». Un schéma Zod transforme un `undefined` silencieux trois écrans
 * plus loin en une erreur *ici*, avec le contexte et le chemin du champ fautif.
 *
 * Deux fonctions, deux usages :
 *  - `parseOrThrow` : la donnée est indispensable (réponse d'un modèle, ligne
 *    qu'on va réafficher). Un format cassé DOIT stopper le flux — c'est le bug.
 *  - `parseOrWarn`  : la donnée est utile mais l'absence est survivable (env
 *    partielle, agrégat optionnel). On loggue, on renvoie un repli.
 *
 * @see docs/ai/roadmap-automatisation.md  (V1)
 * @see docs/ai/testing-rules.md
 */

import { z } from 'zod';
import { logger } from '../logger.js';

/**
 * Erreur de validation de frontière — distincte d'une erreur applicative ou
 * réseau. Porte le contexte (`op`) et les problèmes Zod aplatis.
 */
export class SchemaError extends Error {
  /**
   * @param {string} op        étiquette de l'appel (`getCourses`, `gemini-proxy`…)
   * @param {import('zod').ZodError} zodError
   */
  constructor(op, zodError) {
    const issues = zodError.issues
      .map((i) => `${i.path.join('.') || '(racine)'}: ${i.message}`)
      .join(' · ');
    super(`Réponse inattendue [${op}] — ${issues}`);
    this.name = 'SchemaError';
    /** @type {string} */
    this.op = op;
    /** @type {import('zod').ZodIssue[]} */
    this.issues = zodError.issues;
  }
}

/**
 * Valide `value` contre `schema`. Loggue puis lève `SchemaError` si le format
 * ne correspond pas.
 *
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} value
 * @param {string} op
 * @returns {T}
 */
export function parseOrThrow(schema, value, op) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  logger.error('schema:violation', {
    op,
    issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
  throw new SchemaError(op, result.error);
}

/**
 * Valide `value` contre `schema`. En cas d'échec, loggue un avertissement et
 * renvoie `fallback` — pour les données dont l'absence est tolérable.
 *
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} value
 * @param {string} op
 * @param {T} fallback
 * @returns {T}
 */
export function parseOrWarn(schema, value, op, fallback) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  logger.warn('schema:violation', {
    op,
    issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
  return fallback;
}

export { z };
