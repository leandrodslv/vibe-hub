// @ts-check
/**
 * Point d'accès unique et validé aux variables d'environnement.
 *
 * Pourquoi centraliser :
 *  - une erreur de nom de variable (`VITE_SUPABASE_KEY` au lieu de `..._ANON_KEY`)
 *    échoue ici, au démarrage, avec un message clair — pas 3 écrans plus loin dans
 *    un `createClient(undefined, undefined)` illisible ;
 *  - un seul endroit rappelle la règle AD-1 (rien de secret derrière `VITE_`).
 *
 * @see docs/ai/security-rules.md
 * @see docs/ai/roadmap-automatisation.md (V1 — contrats de frontière)
 * @see _bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md (AD-1)
 */

import { supabaseUrlSchema } from '../lib/schemas/env.js';

/** @typedef {'development' | 'production' | 'test'} Mode */

/**
 * Allowlist explicite des variables `VITE_*` lues par l'app.
 *
 * ⚠️ AD-1 — accès **statique** volontaire : `import.meta.env.NOM` littéral (jamais
 * `import.meta.env[nom]` dynamique). Vite ne remplace que les accès qu'il peut
 * analyser statiquement ; un accès dynamique l'oblige à inliner TOUT l'objet
 * `import.meta.env` — donc n'importe quelle variable `VITE_*` traînant dans un
 * `.env` local (ex. une ancienne `VITE_GEMINI_API_KEY`) finirait dans le bundle.
 * Ajouter une variable ici est le seul moyen de la rendre lisible par l'app.
 */
const RAW = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_GEMINI_PROXY_URL: import.meta.env.VITE_GEMINI_PROXY_URL,
  VITE_METRICS_URL: import.meta.env.VITE_METRICS_URL,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
};

/**
 * @param {keyof typeof RAW} name
 * @param {{ required?: boolean, fallback?: string }} [opts]
 * @returns {string}
 */
function read(name, opts = {}) {
  const { required = true, fallback = '' } = opts;
  const raw = RAW[name];
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (!value || value.startsWith('<') || value === 'your_api_key_here') {
    if (required && import.meta.env.MODE !== 'test') {
      // Console plutôt qu'un throw : on ne veut pas empêcher la landing (qui ne
      // dépend d'aucune de ces variables) de se charger si seul l'IA n'est pas
      // configurée. Les adaptateurs concernés dégradent proprement (cf. isAiConfigured).
      console.error(
        `[env] Variable "${name}" absente ou non renseignée. ` +
          `Copiez .env.example vers .env. Les fonctionnalités qui en dépendent seront désactivées.`
      );
    }
    return fallback;
  }
  return value;
}

/**
 * Vérifie qu'une URL renseignée est bien http(s). Une valeur vide (variable
 * absente) passe : la dégradation gracieuse est gérée par `isSupabaseConfigured`.
 * @param {string} value
 * @returns {string}
 */
function validateUrl(value) {
  const result = supabaseUrlSchema.safeParse(value);
  if (!result.success && import.meta.env.MODE !== 'test') {
    console.error(
      `[env] VITE_SUPABASE_URL invalide : ${result.error.issues[0]?.message}. ` +
        `Attendu une URL https://<ref>.supabase.co`
    );
    return '';
  }
  return value;
}

export const env = Object.freeze({
  /** @type {Mode} */
  mode: /** @type {Mode} */ (import.meta.env.MODE || 'development'),
  isProd: import.meta.env.PROD === true,
  isDev: import.meta.env.DEV === true,

  supabaseUrl: validateUrl(read('VITE_SUPABASE_URL')),
  supabaseAnonKey: read('VITE_SUPABASE_ANON_KEY'),

  /**
   * URL de l'Edge Function `gemini-proxy` (AD-1 : la clé Gemini réelle vit côté
   * serveur, jamais dans le bundle). Vide → l'assistant IA se dégrade proprement
   * (cf. `isAiConfigured`). Cette URL est publique par conception.
   */
  geminiProxyUrl: read('VITE_GEMINI_PROXY_URL', { required: false }),

  /** Endpoint de collecte des métriques / erreurs (V10). Vide → log seul. */
  metricsUrl: read('VITE_METRICS_URL', { required: false }),

  /** DSN Sentry (V10). Vide → pas de Sentry, `setLogSink` reste dispo. */
  sentryDsn: read('VITE_SENTRY_DSN', { required: false }),
});

/** @returns {boolean} true si Supabase peut être contacté. */
export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** @returns {boolean} true si l'assistant IA peut répondre (proxy configuré). */
export function isAiConfigured() {
  return Boolean(env.geminiProxyUrl);
}
