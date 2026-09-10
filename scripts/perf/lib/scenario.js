import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, TEST_API } from './options.js';

// Un « parcours visiteur » réaliste : charge le HTML de l'app, puis (optionnel)
// interroge l'API publique des cours comme le ferait l'onglet Modules.
export function visitorJourney() {
  group('chargement de l’app (HTML + assets CDN)', () => {
    const res = http.get(`${BASE_URL}/`, { tags: { name: 'GET /' } });
    check(res, {
      'statut 200': (r) => r.status === 200,
      'contient #root': (r) => typeof r.body === 'string' && r.body.includes('id="root"'),
      'en-tête CSP présent': (r) => r.headers['Content-Security-Policy'] !== undefined,
    });

    // Route SPA profonde : doit aussi renvoyer index.html (rewrite Vercel), pas un 404.
    const deep = http.get(`${BASE_URL}/app?tab=outils`, { tags: { name: 'GET /app' } });
    check(deep, { '/app renvoie 200': (r) => r.status === 200 });
  });

  if (TEST_API) {
    group('API cours (Supabase REST, SELECT public via RLS)', () => {
      const res = http.get(
        `${SUPABASE_URL}/rest/v1/courses?select=*&published=eq.true&order=order_index.asc`,
        {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          tags: { name: 'GET /rest/v1/courses' },
        }
      );
      check(res, {
        'API 200': (r) => r.status === 200,
        'réponse JSON tableau': (r) => {
          try {
            return Array.isArray(r.json());
          } catch {
            return false;
          }
        },
      });
    });
  }

  // Pense-bête : un vrai utilisateur ne recharge pas 50×/s.
  sleep(Math.random() * 3 + 1);
}
