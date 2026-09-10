// @ts-check
/**
 * Observabilité côté navigateur : Core Web Vitals + capture des erreurs non gérées.
 *
 * Appelé une fois depuis `main.jsx`. Sans back-end de collecte pour l'instant :
 * les métriques sont loggées (structuré, cf. logger.js) et prêtes à être POST-ées
 * vers un endpoint dès qu'il existe (Vercel Analytics, Edge Function `/metrics`…).
 *
 * @see docs/ai/deployment-rules.md
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import { logger, serializeError } from './logger.js';
import { env } from '../config/env.js';

/** @param {import('web-vitals').Metric} metric */
function handleMetric(metric) {
  logger.info('web-vital', {
    metric: metric.name,
    value: Math.round(metric.value * 1000) / 1000,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  });
  // TODO(observabilité) : `navigator.sendBeacon('/metrics', JSON.stringify(...))`
  // quand l'endpoint de collecte est en place.
}

let started = false;

export function initObservability() {
  if (started || typeof window === 'undefined') return;
  started = true;

  onCLS(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onFCP(handleMetric);
  onTTFB(handleMetric);

  window.addEventListener('error', (e) => {
    logger.error('window.onerror', {
      ...serializeError(e.error ?? e.message),
      source: e.filename,
      line: e.lineno,
      col: e.colno,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    logger.error('unhandledrejection', serializeError(e.reason));
  });

  logger.debug('observability:init', { mode: env.mode });
}
