// @ts-check
/**
 * Logging structuré, minimal, sans dépendance.
 *
 * Objectif : que chaque log soit une ligne JSON exploitable (grep, ingestion
 * Vercel/Datadog plus tard) au lieu d'un `console.log('bug ?', truc)` perdu.
 *
 * En prod, seuls `warn` et `error` sortent (les `debug`/`info` sont muets) et
 * `error` est routé vers `reportError` — le point de branchement pour Sentry &
 * consorts, sans imposer la dépendance aujourd'hui.
 *
 * @see docs/ai/deployment-rules.md § Observabilité
 */

import { env } from '../config/env.js';

/** @typedef {'debug' | 'info' | 'warn' | 'error'} Level */

/** @type {Record<Level, number>} */
const WEIGHT = { debug: 10, info: 20, warn: 30, error: 40 };

const MIN_LEVEL = env.isProd ? WEIGHT.warn : WEIGHT.debug;

/** @type {((entry: Record<string, unknown>) => void) | null} */
let sink = null;

/**
 * Branche un collecteur externe (Sentry, Logtail, un POST maison…).
 * @param {(entry: Record<string, unknown>) => void} fn
 */
export function setLogSink(fn) {
  sink = fn;
}

/**
 * Contexte joint à CHAQUE entrée (corrélation V10) : `release`, `sessionId`…
 * Défini une fois au boot par `initObservability()`.
 * @type {Record<string, unknown>}
 */
let baseContext = {};

/** @param {Record<string, unknown>} ctx */
export function setLogContext(ctx) {
  baseContext = { ...baseContext, ...ctx };
}

/**
 * @param {Level} level
 * @param {string} message
 * @param {Record<string, unknown>} [context]
 */
function emit(level, message, context = {}) {
  if (WEIGHT[level] < MIN_LEVEL) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    env: env.mode,
    ...baseContext,
    ...scrub(context),
  };

  // eslint-disable-next-line no-console
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(JSON.stringify(entry));

  if (sink) {
    try {
      sink(entry);
    } catch {
      /* un sink cassé ne doit jamais casser l'app */
    }
  }
}

/**
 * Retire les clés qui ressemblent à des secrets/PII avant de logger.
 * @param {Record<string, unknown>} context
 * @returns {Record<string, unknown>}
 */
function scrub(context) {
  const SENSITIVE = /(key|token|secret|password|authorization|email|apikey)/i;
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, v] of Object.entries(context)) {
    out[k] = SENSITIVE.test(k) ? '[redacted]' : v;
  }
  return out;
}

/**
 * Normalise une erreur inconnue en objet loggable.
 * @param {unknown} error
 * @returns {Record<string, unknown>}
 */
export function serializeError(error) {
  if (error instanceof Error) {
    return { name: error.name, msg: error.message, stack: error.stack };
  }
  return { msg: String(error) };
}

export const logger = {
  /** @param {string} m @param {Record<string, unknown>} [c] */
  debug: (m, c) => emit('debug', m, c),
  /** @param {string} m @param {Record<string, unknown>} [c] */
  info: (m, c) => emit('info', m, c),
  /** @param {string} m @param {Record<string, unknown>} [c] */
  warn: (m, c) => emit('warn', m, c),
  /** @param {string} m @param {Record<string, unknown>} [c] */
  error: (m, c) => emit('error', m, c),
};
