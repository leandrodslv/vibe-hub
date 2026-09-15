// @ts-check
/**
 * Jeux de réponses déterministes de l'Edge Function `course-draft` (brouillon
 * de cours généré depuis une vidéo YouTube, admin uniquement).
 *
 * Même logique que `scenarios/gemini.js` : chaque scénario décrit une réponse
 * HTTP figée du proxy, y compris les cas de panne — on ne teste jamais contre
 * le vrai modèle.
 *
 * Utilisé par `src/test/mocks/handlers/course-draft.js`.
 */

export const courseDraftScenarios = {
  /** Cas nominal : un brouillon complet. */
  nominal: {
    status: 200,
    body: {
      title: 'Prompts efficaces pour le design UI',
      description: 'Comprendre comment formuler un prompt qui produit un résultat exploitable.',
      duration: '08:30',
      content: '# Introduction\n\nCeci est le contenu généré depuis la vidéo.',
    },
  },

  /** URL rejetée côté proxy (hôte non YouTube — ne devrait normalement jamais arriver, le client filtre déjà). */
  badRequest: {
    status: 400,
    body: { error: 'videoUrl doit être une URL YouTube publique (https).' },
  },

  /** Quota Gemini dépassé. */
  quotaExceeded: { status: 429, body: { error: 'Échec de génération.', status: 429 } },

  /** Proxy déployé mais `GEMINI_API_KEY` absente côté serveur. */
  proxyNotConfigured: {
    status: 503,
    body: { error: 'Proxy non configuré (GEMINI_API_KEY absente).' },
  },

  /** JSON illisible renvoyé par le modèle (n'a pas respecté le schéma structuré). */
  malformedJson: { status: 502, body: { error: 'Réponse du modèle illisible (JSON invalide).' } },

  /** Erreur serveur générique en amont. */
  serverError: { status: 502, body: { error: 'Échec de génération.', status: 500 } },

  /** Sans JWT (Authorization manquant ou invalide) — la fonction est déployée `verify_jwt: true`. */
  unauthorized: { status: 401, body: { error: 'Unauthorized' } },
};

/** @typedef {keyof typeof courseDraftScenarios} CourseDraftScenarioName */
