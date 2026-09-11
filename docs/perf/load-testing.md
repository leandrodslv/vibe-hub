# Tests de charge, de stress et de performance — Vibe Hub

## Vue d'ensemble

| Type                     | Outil                   | But                                              | Bloquant ?                  |
| ------------------------ | ----------------------- | ------------------------------------------------ | --------------------------- |
| Budget bundle            | `size-limit`            | empêcher le JS/CSS de grossir sans qu'on le voie | **oui** (CI, job `build`)   |
| Web Vitals (synthétique) | Lighthouse CI           | LCP / CLS / TBT + a11y + SEO sur le build        | non (informatif)            |
| Web Vitals (réel)        | `web-vitals` → `logger` | mesure chez les vrais utilisateurs               | —                           |
| Smoke charge             | k6                      | le scénario tient debout                         | recommandé post-déploiement |
| Load                     | k6                      | tenue en trafic normal / pic marketing           | manuel                      |
| Spike                    | k6                      | récupération après pic brutal                    | manuel                      |
| Stress                   | k6                      | **point de rupture** (jusqu'à 10 000 VUs)        | manuel                      |

## Prérequis k6

k6 est un binaire (pas un paquet npm). Installation :

```bash
# macOS
brew install k6
# Windows
winget install k6 --source winget    # ou: choco install k6
# Linux (Debian/Ubuntu)
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
# ou sans rien installer :
docker run --rm -i -v "$PWD/scripts:/scripts" grafana/k6 run /scripts/perf/smoke.js -e BASE_URL=...
```

## Lancer un scénario

```bash
# Sanity (local, après `npm run build && npm run preview`)
npm run perf:smoke -- -e BASE_URL=http://localhost:4173

# Charge soutenue contre une preview
npm run perf:load -- -e BASE_URL=https://vibe-hub-git-xxx.vercel.app

# Pic brutal
npm run perf:spike -- -e BASE_URL=https://staging.vibehub.fr

# Stress : paliers 1 → 5 → 10 → 20 → 30 → 50 → 100 → 250 → 500 → 1000 → 2500 → 5000 → 10 000
npm run perf:stress -- -e BASE_URL=https://staging.vibehub.fr

# Inclure le chemin API (lecture publique des cours via RLS) — STAGING uniquement
npm run perf:stress -- -e BASE_URL=https://staging.vibehub.fr \
  -e SUPABASE_URL=https://<ref>.supabase.co -e SUPABASE_ANON_KEY=<anon>
```

## ⚠️ Règles impératives

1. **Jamais la prod.** Ni le domaine de prod, ni le projet Supabase de prod. Un stress à
   10 000 VUs = déni de service volontaire + bande passante facturée (Vercel) + requêtes
   facturées / rate-limit (Supabase). Le workflow CI `Load / Stress test` refuse les URLs qui
   ressemblent à la prod.
2. **Préproduction dédiée** : idéalement un projet Supabase séparé (données de test) et un
   déploiement Vercel distinct.
3. **Capacité du générateur de charge** : un runner `ubuntu-latest` sature bien avant
   10 000 VUs (CPU + descripteurs de fichiers). Pour ces volumes :
   - **k6 Cloud** (`k6 cloud scripts/perf/stress.js`, `K6_CLOUD_TOKEN`), ou
   - plusieurs machines avec `k6 run --execution-segment "0:1/4"` … `"3/4:1"`.
4. **Prévenir Supabase / Vercel** si le test dépasse quelques centaines de VUs soutenus.

## Profils (définis dans `scripts/perf/lib/options.js`)

- `RAMP_STAGES` : les 13 paliers demandés (1 → 10 000), tenus puis redescente.
- Seuils communs : `http_req_failed < 1 %`, `p95 < 800 ms`, `p99 < 2 s`, `checks > 99 %`.
- `stress.js` relâche les seuils (on **cherche** la limite) et **abort** si le taux d'échec
  dépasse 10 % pendant 30 s (service effondré).

## Interpréter les résultats

| Signal                                        | Lecture                                             |
| --------------------------------------------- | --------------------------------------------------- |
| `http_req_failed` monte à partir de N VUs     | capacité max ≈ N (CDN ou origin)                    |
| `http_req_duration p95` explose mais 0 erreur | file d'attente / cold start — regarder le TTFB      |
| erreurs `429` sur `/rest/v1/courses`          | rate-limit Supabase atteint → cache/edge nécessaire |
| p95 revient à la normale après la redescente  | **bonne** récupération                              |
| p95 reste dégradée 5 min après                | fuite (connexions, mémoire) — investiguer           |

Chaque run de `stress.js` écrit `perf-results/stress-summary.json` (historisable pour suivre
la tendance release après release).

## Cible de performance (produit)

- Landing : **LCP < 2,5 s** sur 4G / mobile milieu de gamme.
  → **Action prioritaire** : `src/assets/landing/hero-collage.png` fait **2 Mo** et
  `illustration-404.png` **1,3 Mo**. Convertir en WebP/AVIF (< 200 Ko), servir des tailles
  responsives, `loading="lazy"` hors hero, `width`/`height` explicites (anti-CLS).
- Bundle JS initial : budget `size-limit` (voir `package.json`).
- CLS < 0,1, INP < 200 ms.
