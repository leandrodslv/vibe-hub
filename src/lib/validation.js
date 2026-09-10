// @ts-check
/**
 * Validation et assainissement des entrées utilisateur.
 *
 * Toute donnée qui vient d'un `<input>`, d'une URL, du localStorage ou d'une
 * réponse réseau est *non fiable*. Ces helpers sont le point de passage obligé
 * avant de la stocker, l'afficher dans un attribut, ou la donner à un service.
 *
 * @see docs/ai/security-rules.md
 */

/** RFC 5322 « suffisamment strict » — rejette l'évident, pas la théorie exotique. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Caractères de contrôle U+0000–U+001F et U+007F. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = new RegExp('[\u0000-\u001F\u007F]', 'g');

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value.trim());
}

/**
 * URL sûre à mettre dans un `href` / `src` : uniquement http(s), jamais
 * `javascript:`, `data:` ou `vbscript:` (vecteurs XSS classiques).
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSafeHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(value, base);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Domaines vidéo explicitement autorisés pour l'embed (CourseDetail).
 * Une URL hors de cette liste ne doit pas être rendue dans un `<iframe src>`.
 */
const ALLOWED_VIDEO_HOSTS = [
  'youtube.com',
  'youtu.be',
  'sharepoint.com',
  'microsoftstream.com',
  'stream.office.com',
];

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAllowedVideoUrl(value) {
  if (!isSafeHttpUrl(value)) return false;
  try {
    const { hostname } = new URL(/** @type {string} */ (value));
    return ALLOWED_VIDEO_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Borne + nettoie une chaîne libre avant stockage/affichage.
 * @param {unknown} value
 * @param {number} [maxLength]
 * @returns {string}
 */
export function sanitizeText(value, maxLength = 5000) {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS_RE, '').slice(0, maxLength);
}

/**
 * `JSON.parse` qui ne lève jamais — pour le localStorage édité à la main ou corrompu.
 * @template T
 * @param {string | null | undefined} raw
 * @param {T} fallback
 * @returns {T}
 */
export function safeJsonParse(raw, fallback) {
  if (typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
