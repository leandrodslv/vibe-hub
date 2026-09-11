// @ts-check
/**
 * Observabilité côté navigateur (V10 de docs/ai/roadmap-automatisation.md) :
 * Core Web Vitals + capture des erreurs non gérées, corrélées à une **release**
 * et un **sessionId**.
 *
 * « Les failles qu'on a trouvées, c'est pas dans les logs, donc a priori c'est
 * bon. » — sans logs corrélés, pas d'oracle. Ici chaque entrée porte :
 *  - `release`   : version + court SHA (défini à la compilation) ;
 *  - `sessionId` : identifiant d'onglet (aucune PII) ;
 *  et est POST-ée vers `VITE_METRICS_URL` si configurée (sinon : log seul).
 *
 * @see docs/ai/deployment-rules.md § Observabilité
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import { logger, serializeError, setLogContext } from './logger.js';
import { env } from '../config/env.js';

const RELEASE = typeof __APP_RELEASE__ === 'string' ? __APP_RELEASE__ : 'dev';

/**
 * Identifiant aléatoire — corrélation d'onglet, aucune valeur de sécurité, mais
 * on reste sur le CSPRNG (`crypto`) plutôt que `Math.random()` : rien qui touche
 * à une graine faible dans le bundle.
 * @returns {string}
 */
function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `s-${Date.now().toString(36)}`;
}

/** Identifiant d'onglet — pas un identifiant utilisateur. */
function sessionId() {
  try {
    const KEY = 'obs_session_id';
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = randomId().slice(0, 36);
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'no-session';
  }
}

/**
 * POST best-effort vers l'endpoint de collecte, si configuré.
 * @param {Record<string, unknown>} payload
 */
function beacon(payload) {
  if (!env.metricsUrl) return;
  try {
    const body = JSON.stringify({ ...payload, release: RELEASE, sessionId: sessionId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(env.metricsUrl, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(env.metricsUrl, { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* la collecte ne doit jamais casser l'app */
  }
}

/** @param {import('web-vitals').Metric} metric */
function handleMetric(metric) {
  const value = Math.round(metric.value * 1000) / 1000;
  logger.info('web-vital', {
    metric: metric.name,
    value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  });
  beacon({ kind: 'web-vital', metric: metric.name, value, rating: metric.rating });
}

let started = false;

export function initObservability() {
  if (started || typeof window === 'undefined') return;
  started = true;

  setLogContext({ release: RELEASE, sessionId: sessionId() });

  onCLS(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onFCP(handleMetric);
  onTTFB(handleMetric);

  window.addEventListener('error', (e) => {
    const err = {
      ...serializeError(e.error ?? e.message),
      source: e.filename,
      line: e.lineno,
      col: e.colno,
    };
    logger.error('window.onerror', err);
    beacon({ kind: 'error', at: 'window.onerror', ...err });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const err = serializeError(e.reason);
    logger.error('unhandledrejection', err);
    beacon({ kind: 'error', at: 'unhandledrejection', ...err });
  });

  logger.debug('observability:init', { mode: env.mode, release: RELEASE });
}

/**
 * Exposé pour l'ErrorBoundary (erreurs React) et les tests.
 * @param {string} at
 * @param {unknown} error
 * @param {Record<string, unknown>} [extra]
 */
export function reportError(at, error, extra = {}) {
  const err = { ...serializeError(error), ...extra };
  logger.error(at, err);
  beacon({ kind: 'error', at, ...err });
}
