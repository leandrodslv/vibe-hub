// Load test — charge SOUTENUE réaliste (jusqu'à ~500 utilisateurs simultanés).
// Répond à : « le site tient-il une journée de trafic normal / un pic marketing ? »
//   k6 run -e BASE_URL=https://preview.vibehub.fr scripts/perf/load.js
import { thresholds } from './lib/options.js';
import { visitorJourney } from './lib/scenario.js';

export const options = {
  scenarios: {
    charge_soutenue: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 250 },
        { duration: '3m', target: 500 },
        { duration: '3m', target: 500 }, // plateau
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds,
};

export default visitorJourney;
