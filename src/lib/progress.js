// @ts-check
import { safeJsonParse } from './validation.js';

// Story 2.3 / AD-6 : progression session-locale (pas de sync cross-device/compte),
// donc localStorage préfixé plutôt que Supabase — jamais un 3ᵉ mécanisme (sessionStorage).
// Partagé entre ModulesTab.jsx (lecture + écriture) et AccueilTab.jsx (lecture seule,
// Epic 12) pour ne pas laisser la clé/le parsing diverger entre les deux.
export const PROGRESS_LS_KEY = 'progress_courses';

/**
 * Progression persistée localement, `{ [courseId]: number }`. JSON invalide ou absent
 * retombe sur `{}` plutôt que de lancer — la progression est un confort, pas une
 * donnée dont l'absence doit casser l'affichage.
 * @returns {Record<string, number>}
 */
export function getPersistedCourseProgress() {
  return safeJsonParse(localStorage.getItem(PROGRESS_LS_KEY), {});
}
