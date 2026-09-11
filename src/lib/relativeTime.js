// @ts-check
/**
 * Formatage d'un timestamp ISO en durée relative française ("il y a 2 h", "hier").
 * Utilisé par le flux de notifications (story 8.6) — remplace les chaînes figées.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

/**
 * @param {string} iso  timestamp ISO 8601
 * @param {number} [nowMs]  instant de référence (ms epoch) — injectable pour les tests
 * @returns {string}
 */
export function relativeTime(iso, nowMs = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  const diff = then - nowMs; // négatif = passé
  const abs = Math.abs(diff);

  if (abs < MIN) return "à l'instant";
  if (abs < HOUR) return rtf.format(Math.round(diff / MIN), 'minute');
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), 'hour');
  if (abs < MONTH) return rtf.format(Math.round(diff / DAY), 'day');
  return rtf.format(Math.round(diff / MONTH), 'month');
}
