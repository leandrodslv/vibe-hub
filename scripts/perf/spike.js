// Spike test — pic brutal (0 → 5000 VUs en 20 s), tenu 2 min, chute brutale.
// Simule un effet « post viral / newsletter » : le trafic normal est faible puis
// décuple d'un coup. Vérifie l'auto-scaling du CDN et la récupération.
//   k6 run -e BASE_URL=https://staging.vibehub.fr scripts/perf/spike.js
import { thresholds } from './lib/options.js';
import { visitorJourney } from './lib/scenario.js';

export const options = {
  scenarios: {
    pic: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 10 }, // trafic de base
        { duration: '20s', target: 5000 }, // 🚀 pic
        { duration: '2m', target: 5000 }, // tenu
        { duration: '20s', target: 10 }, // retour au calme
        { duration: '2m', target: 10 }, // récupération observée
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    ...thresholds,
    http_req_duration: ['p(95)<3000'], // plus tolérant pendant le pic
  },
};

export default visitorJourney;
