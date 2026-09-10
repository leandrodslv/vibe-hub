// Smoke test — 1 utilisateur, ~30 s. Vérifie que le scénario tient debout avant
// de lancer les gros scénarios. À passer en CI sur chaque déploiement.
//   k6 run -e BASE_URL=https://preview.vibehub.fr scripts/perf/smoke.js
import { thresholds } from './lib/options.js';
import { visitorJourney } from './lib/scenario.js';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds,
};

export default visitorJourney;
