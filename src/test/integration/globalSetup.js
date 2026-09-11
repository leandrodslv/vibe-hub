// @ts-check
/**
 * globalSetup de la suite d'intégration : démarre UN conteneur Postgres partagé
 * par tous les fichiers de test, expose son URI via `provide()`, l'arrête à la
 * fin.
 *
 * Si Docker n'est pas joignable, on n'échoue pas : on expose `uri = null` et
 * chaque suite se met en `describe.skip` (cf. helpers/skip.js). `npm test` reste
 * vert sur un poste sans Docker ; la CI, elle, a Docker et exécute tout.
 */

import { startContainer } from './helpers/db.js';

/** @param {{ provide: (key: string, value: unknown) => void }} ctx */
export async function setup({ provide }) {
  let container = null;
  try {
    container = await startContainer();
    provide('integrationDbUri', container.uri);
  } catch (err) {
    provide('integrationDbUri', null);
    console.warn(
      `[integration] Docker indisponible — suites d'intégration ignorées.\n` +
        `  ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return async () => {
    await container?.stop();
  };
}
