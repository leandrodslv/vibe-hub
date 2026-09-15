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
  'tiktok.com',
  'facebook.com',
  'fb.watch',
];

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAllowedVideoUrl(value) {
  if (!isSafeHttpUrl(value)) return false;
  return matchesHost(value, ALLOWED_VIDEO_HOSTS);
}

/**
 * `true` si le hostname de `value` est l'un des `hosts` (ou un sous-domaine).
 * Comparaison sur le hostname parsé — jamais un `.includes()` sur l'URL entière
 * (`youtube.com` peut apparaître n'importe où : `youtube.com.evil.tld`, chemin, query).
 * @param {unknown} value
 * @param {readonly string[]} hosts
 * @returns {boolean}
 */
export function matchesHost(value, hosts) {
  try {
    const { hostname } = new URL(/** @type {string} */ (value));
    const h = hostname.toLowerCase();
    return hosts.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
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
 * Extrait l'ID vidéo YouTube d'une URL, quelle que soit sa forme (`?v=`,
 * `youtu.be/`, `/shorts/`) — même logique que CourseDetail.jsx (lecteur) et
 * AdminPage.jsx (miniature auto), une seule source pour ne pas diverger.
 * @param {unknown} value
 * @returns {string | null}
 */
export function extractYouTubeVideoId(value) {
  if (typeof value !== 'string') return null;
  try {
    if (value.includes('youtu.be/')) return value.split('youtu.be/')[1]?.split(/[?&]/)[0] || null;
    if (value.includes('/shorts/')) return value.split('/shorts/')[1]?.split(/[?&]/)[0] || null;
    return new URL(value).searchParams.get('v');
  } catch {
    return null;
  }
}

/**
 * Dérive un titre court à partir d'une légende TikTok (oEmbed) — coupe avant le
 * premier hashtag (le "sujet" de la légende, pas les tags) puis tronque. Pure
 * heuristique de chaîne, aucune IA : sert de point de départ éditable dans le
 * formulaire admin, jamais enregistré tel quel sans relecture humaine.
 * @param {unknown} caption
 * @param {number} [maxLength]
 * @returns {string}
 */
export function captionToTitle(caption, maxLength = 80) {
  if (typeof caption !== 'string') return '';
  const trimmed = sanitizeText(caption).trim();
  const beforeHashtag = trimmed.split(/\s#/)[0]?.trim() ?? '';
  const base = beforeHashtag || trimmed;
  return base.length > maxLength ? `${base.slice(0, maxLength - 1).trimEnd()}…` : base;
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
