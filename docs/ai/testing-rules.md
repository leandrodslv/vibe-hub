# Règles de test — Vibe Hub

## Pyramide

| Niveau               | Outil                              | Emplacement                      | Rôle                                                         |
| -------------------- | ---------------------------------- | -------------------------------- | ------------------------------------------------------------ |
| Unitaire             | Vitest + Testing Library           | `src/**/*.test.{js,jsx}`         | logique pure, adaptateurs (mockés), hooks, composants isolés |
| Contrat de service   | Vitest (SDK mockés)                | `src/services/*.test.js`         | un adaptateur + son contrat d'erreur + ses schémas Zod       |
| Intégration (réelle) | Vitest + Testcontainers (Postgres) | `src/test/integration/*.test.js` | migrations + RLS + RPC contre un **vrai** Postgres jetable   |
| E2E                  | Playwright                         | `e2e/*.spec.js`                  | parcours utilisateur critiques sur le bundle de prod         |
| Charge / stress      | k6                                 | `scripts/perf/*.js`              | tenue en montée de trafic, point de rupture                  |

## Couverture

- Seuil **80 %** (lignes / branches / fonctions / statements), **bloquant en CI**
  (`npm run test:cov`).
- Périmètre mesuré aujourd'hui (`vite.config.js` → `test.coverage.include`) :
  `src/lib/**`, `src/services/**`, `src/hooks/**`, `src/config/**`.
- **Stratégie ratchet** : on élargit `include` (composants, pages) au fil de l'écriture des
  tests ; **le seuil ne descend jamais**. Quand un dossier est couvert, on l'ajoute.
- Rapports : `text` + `html` (`coverage/index.html`) + `lcov` (CI) + `json-summary`
  (résumé dans le job GitHub).

## Écrire un test unitaire

- `describe` / `it` en français, un comportement par `it`.
- Mocker les dépendances externes avec `vi.mock` + `vi.hoisted` (voir
  `src/services/supabase.test.js` pour le patron du query-builder chaînable mocké).
- Pas d'accès réseau réel, pas de vraie clé, pas de vrai Supabase.
- Hooks : `renderHook` + `vi.useFakeTimers()` (voir `useTypewriter.test.js`).
- `src/test/setup.js` stubbe `matchMedia`, `scrollIntoView`, `navigator.clipboard` et nettoie
  le DOM + `localStorage` après chaque test.

## Tests de régression (obligatoire)

> **Chaque bug corrigé produit un test qui échoue avant le fix et passe après.**

1. Reproduire le bug dans un `it('régression #123 : …')`.
2. Vérifier qu'il échoue sur le code buggé.
3. Corriger. Le test passe.
4. Commit `fix:` incluant le test.

## Tests d'intégration réels (Testcontainers)

> `npm run test:integration` — config `vitest.integration.config.js`, **hors** `npm test`.

- **But** : ne pas se contenter de mocker Supabase. On démarre `postgres:16-alpine`
  dans un conteneur, on applique `supabase/migrations/*.sql`, on rejoue les rôles
  Supabase (`anon`, `authenticated`, `service_role`) et on vérifie ce que Postgres —
  pas le React — garantit : les **policies RLS** et la **RPC `get_waitlist_counts`**.
- **Harnais** : `src/test/integration/helpers/db.js`
  - `startContainer()` (dans `globalSetup.js`, un seul conteneur partagé) ;
  - `connect(uri)` → `sql()` (admin, pour semer), `reset()` (truncate entre tests),
    `asRole('anon' | 'authenticated', fn)` (= ce que fait PostgREST derrière un JWT).
- **Sans Docker** : `globalSetup` expose `uri = null` → `describe.skipIf(!uri)` → la
  suite est ignorée, `npm run test:integration` reste vert. La CI, elle, a Docker.
- **Couvert aujourd'hui** : `anon` ne lit que les cours publiés / ne peut pas écrire ;
  `authenticated` a le CRUD complet ; `waitlist` n'expose aucun email (AD-3), même à
  `authenticated` ; `get_waitlist_counts` renvoie des agrégats, refuse `anon`, et
  fonctionne en `security definer` malgré RLS (AD-4).
- **Étend** : quand une migration ajoute une table/policy/fonction, ajouter le test
  d'intégration correspondant dans le même commit.

## E2E (Playwright)

- Cible : le **bundle de production** (`playwright.config.js` build + `vite preview`), ou une
  preview Vercel via `E2E_BASE_URL`.
- Projets : `chromium` (desktop) + `mobile` (Pixel 7).
- Parcours couverts : chargement landing + lien d'évitement + CTA sécurisé, 404, routage
  d'onglets + URL, dégradation gracieuse de l'IA sans clé, écran de login admin.
- Sélecteurs par **rôle / label** (`getByRole`, `getByLabel`), jamais par classe CSS.
- `npm run e2e` · rapport : `npm run e2e:report`.

## Tests de charge & stress (k6) — voir `docs/perf/load-testing.md`

| Script                   | `npm run`     | Profil                                                                                                                    |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `scripts/perf/smoke.js`  | `perf:smoke`  | 1 VU / 30 s — sanity, **à passer en CI post-déploiement**                                                                 |
| `scripts/perf/load.js`   | `perf:load`   | montée 50→500 VUs soutenus — trafic normal / pic marketing                                                                |
| `scripts/perf/spike.js`  | `perf:spike`  | 10→5000 VUs en 20 s — effet viral, test de récupération                                                                   |
| `scripts/perf/stress.js` | `perf:stress` | **paliers 1 → 5 → 10 → 20 → 30 → 50 → 100 → 250 → 500 → 1000 → 2500 → 5000 → 10 000 VUs** — recherche du point de rupture |

**Règles impératives** :

- Toujours viser une **préproduction dédiée** (`-e BASE_URL=…`). **Jamais la prod, jamais le
  Supabase de prod** — un stress à 10 000 VUs est un déni de service volontaire et de la bande
  passante facturée.
- Le chemin API (`courses`) n'est testé que si `-e SUPABASE_URL=… -e SUPABASE_ANON_KEY=…`
  (staging) sont passés.
- Au-delà de ~1000 VUs soutenus, un seul runner GitHub sature : utiliser k6 Cloud
  (`K6_CLOUD_TOKEN`) ou plusieurs runners (`--execution-segment`).
- Seuils de réussite : `http_req_failed < 1 %`, `p95 < 800 ms`, `p99 < 2 s`, `checks > 99 %`
  (plus tolérants pour `stress`/`spike`, qui cherchent la limite).
- Lancement CI : workflow **`Load / Stress test`** (`workflow_dispatch` manuel, avec garde-fou
  anti-URL-de-prod).

## Ce que la CI exécute (dans l'ordre)

format → lint → typecheck → semgrep → **tests unitaires + intégration** → **e2e** →
audit sécurité → **couverture (seuil)** → Lighthouse (informatif) → build → budget bundle.
Un échec sur une étape critique casse le job `CI` (seul required check).
