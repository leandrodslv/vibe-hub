# Rapport d'industrialisation AI-First — Vibe Hub

> Réponse à `AUDIT_AI_FIRST.md` (11 phases). Ce document = livrables Phase 1 (audit) +
> Phase 11 (synthèse). Le détail opérationnel vit dans `docs/ai/` et `docs/perf/`.
> La roadmap d'automatisation avancée (vagues V1→V10) : `docs/ai/roadmap-automatisation.md`.

---

## PHASE 1 — AUDIT

### État actuel (avant)

| Dimension               | Constat                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Langage                 | JavaScript (JSX), 0 TypeScript                                                                                                                                        |
| Framework               | React 18.3 + Vite 5.4 + Tailwind 3.4                                                                                                                                  |
| Architecture            | SPA 3 couches (Presentation → Service Adapters → Supabase/Gemini). Routage maison (`src/lib/routes.js`). Doc canonique : **Architecture Spine** (AD-1..AD-6).         |
| Gestion des dépendances | npm + `package-lock.json` commité                                                                                                                                     |
| CI/CD                   | GitHub Actions : `ci.yml` (lint + build + gate), `pr-title.yml` (conventional), `release-please.yml`. **Job test commenté**, pas de sécurité, pas d'e2e, pas de perf. |
| Tests                   | **Aucun.** Aucun runner, 0 test, 0 couverture.                                                                                                                        |
| Sécurité outillée       | **Aucune dans le repo.** Semgrep installé sur la machine mais pas configuré ni en CI. Pas de scan secrets, pas de Dependabot, pas d'en-têtes HTTP.                    |
| Qualité outillée        | ESLint 8 (`eslint:recommended` + react). Pas de Prettier, pas de type-check, pas de règle a11y.                                                                       |
| Dépendances critiques   | `@supabase/supabase-js`, `@google/generative-ai` (**déprécié par Google**), `react-markdown`                                                                          |
| Observabilité           | **Aucune.** Pas de logging structuré, pas de métriques, pas d'ErrorBoundary.                                                                                          |

### Forces

- Architecture **explicitement documentée** (Spine + invariants AD-1..AD-6) — rare et précieux.
- Séparation Presentation / Service Adapters déjà largement respectée.
- CI parallélisée avec un job-gate stable (`ci-ok`) — bon socle.
- Conventional Commits + release-please déjà en place.
- Accessibilité prise au sérieux dans le code existant (skip link, `aria-*`, focus visible) + un diagnostic RGAA (`docs/diagnostic-rgaa.md`).
- Gestion d'erreur réseau soignée dans `ModulesTab` (timeout + état d'erreur, pas de spinner infini).

### Faiblesses & risques

| #    | Sévérité | Problème                                                                                                                                                                                                                                   |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-1  | 🔴       | **Clé Gemini (`VITE_GEMINI_API_KEY`) inlinée dans le bundle** → extractible par tout visiteur du site déployé. Vecteur d'abus / de coût. Une clé a **déjà fuité** via `test-gemini.js` (commit `51f61c7`), toujours dans l'historique git. |
| R-2  | 🟠       | **RLS Supabase non vérifiée** : aucune migration dans le repo, l'autorité d'écriture repose peut-être sur « cacher la route » côté React.                                                                                                  |
| R-3  | 🟠       | **Zéro test** → toute régression (humaine ou IA) passe en prod silencieusement.                                                                                                                                                            |
| R-4  | 🟠       | **Zéro garde-fou sécurité automatisé** (SAST, secrets, deps, en-têtes).                                                                                                                                                                    |
| R-5  | 🟡       | `AdminPage` importait le client Supabase brut (violation AD-2).                                                                                                                                                                            |
| R-6  | 🟡       | `CourseDetail` construit un `<iframe src>` depuis `course.video_url` (donnée admin) **sans validation d'hôte** (SSRF/XSS-embed).                                                                                                           |
| R-7  | 🟡       | **Images non optimisées** : `hero-collage.png` = **2 Mo**, `illustration-404.png` = **1,3 Mo** → LCP catastrophique sur mobile/4G.                                                                                                         |
| R-8  | 🟡       | `@google/generative-ai` déprécié ; Vite 5.4 hors du set de patchs de sécurité backportés.                                                                                                                                                  |
| R-9  | ⚪       | `dist/` accumulait d'anciens bundles (pas de `emptyOutDir`) → mesures de taille faussées.                                                                                                                                                  |
| R-10 | ⚪       | Pas de type-safety → un renommage de colonne DB ou une réponse Gemini malformée = `undefined` silencieux 3 écrans plus loin.                                                                                                               |

### Dette technique

- `src/data/courses.js` : legacy, remplacé par Supabase, jamais retiré.
- `_bmad-output/` : ~40 fichiers de planification vendorés + `.claude/skills/` (BMAD) commités = bruit important dans le repo.
- 6 catégories de violations `jsx-a11y` dans le code existant (labels stylés non liés, overlays cliquables) — suivies dans `docs/diagnostic-rgaa.md`.

---

## PHASE 11 — LIVRABLES

### 1. Problèmes détectés

Voir tableau R-1..R-10 ci-dessus.

### 2 & 3 & 4. Améliorations, fichiers créés, fichiers modifiés

#### Phase 2 — Qualité logicielle

| Fichier                               | Rôle                                                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.prettierrc.json`, `.prettierignore` | Formatage automatique (repo entier reformatté une fois)                                                                                                               |
| `.editorconfig`                       | Cohérence éditeur (EOL, indentation)                                                                                                                                  |
| `tsconfig.json`                       | **Type-check incrémental** (`tsc --noEmit`, `checkJs:false` global + `// @ts-check` par fichier)                                                                      |
| `.eslintrc.cjs` _(modifié)_           | + `jsx-a11y`, + `eslint-config-prettier`, + règles anti-IA (`eqeqeq`, `prefer-const`, `no-var`, `eval` interdit), + `no-restricted-imports` (AD-2), override tests/k6 |
| `.nvmrc`                              | Node 20 épinglé                                                                                                                                                       |
| `src/lib/schemas/*` + `zod`           | **Contrats Zod aux frontières** (env, `courses`, `waitlist`, réponse Gemini) — `parseOrThrow` / `parseOrWarn`                                                         |

#### Phase 3 — Tests

| Fichier                                                            | Rôle                                                                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `vite.config.js` _(modifié)_                                       | Config Vitest + couverture v8, **seuil 80 % bloquant**, `emptyOutDir`, sourcemaps, manualChunks                         |
| `src/test/setup.js`                                                | jest-dom, cleanup, stubs jsdom, silence des logs                                                                        |
| `src/lib/routes.test.js` · `validation.test.js` · `logger.test.js` | Unitaires (logique pure)                                                                                                |
| `src/config/env.test.js` · `src/hooks/useTypewriter.test.js`       | Unitaires (config, hook)                                                                                                |
| `src/services/supabase.test.js` · `src/services/ai.test.js`        | Intégration (SDK mockés via `vi.hoisted`), contrats d'erreur, **validation de schéma**                                  |
| `playwright.config.js` + `e2e/*.spec.js`                           | **E2E** : landing + skip link + CTA sécurisé, 404, routage d'onglets, dégradation IA, login admin (chromium + mobile)   |
| Couverture actuelle                                                | **~94 % lignes** sur le périmètre `lib`/`services`/`hooks`/`config` (86 tests verts). Stratégie **ratchet** documentée. |

#### Phase 4 — Sécurité

| Fichier                                                                   | Rôle                                                                                                                                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.semgrep.yml`                                                            | 8 règles projet (eval, `dangerouslySetInnerHTML`, iframe sandbox, `target=_blank`, import SDK hors `services/`, clé en dur, secret `VITE_`, `JSON.parse`) |
| `.gitleaks.toml`                                                          | Détection de secrets (+ règles clé Google moderne, JWT `service_role`)                                                                                    |
| `.github/dependabot.yml`                                                  | MAJ deps hebdo groupées + patchs sécu                                                                                                                     |
| `.github/workflows/codeql.yml`                                            | SAST GitHub (taint tracking)                                                                                                                              |
| `vercel.json` _(modifié)_                                                 | **CSP stricte**, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, cache assets                           |
| `src/lib/validation.js`                                                   | `isValidEmail`, `isSafeHttpUrl`, `isAllowedVideoUrl` (**liste blanche**), `sanitizeText`, `safeJsonParse`                                                 |
| `src/config/env.js`                                                       | Accès env validé, unique — rappel AD-1                                                                                                                    |
| `src/components/workspace/modules/CourseDetail.jsx` _(modifié)_           | `<iframe>` vidéo **gaté par liste blanche d'hôtes** + `sandbox` YouTube                                                                                   |
| `src/pages/AdminPage.jsx` _(modifié)_                                     | Passe par les wrappers `signIn/signOut/getSession/onAuthChange` (AD-2)                                                                                    |
| `src/services/supabase.js` _(modifié)_                                    | + wrappers auth, + validation Zod des lignes, + logging                                                                                                   |
| `supabase/migrations/0001_rls_policies.sql`                               | **RLS cible** `courses` + `waitlist` + `get_waitlist_counts()` (AD-3/AD-4)                                                                                |
| `supabase/functions/gemini-proxy/index.ts`                                | **Edge Function** qui détiendra la clé Gemini côté serveur (correctif AD-1)                                                                               |
| `SECURITY.md`, `docs/secure-coding-guide.md`, `docs/ai/security-rules.md` | Politique + guide + règles applicatives (OWASP Top 10 mappé)                                                                                              |

#### Phase 5 — Performance

| Fichier                                   | Rôle                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `package.json` → `size-limit`             | **Budget bundle bloquant** (JS démarrage < 120 kB gzip, CSS < 15 kB) |
| `.lighthouserc.json`                      | Lighthouse CI (perf ≥ 80, a11y ≥ 90, CLS < 0.1)                      |
| `src/lib/observability.js` + `web-vitals` | Mesure LCP/CLS/INP/FCP/TTFB réelle                                   |
| `scripts/perf/*` (k6)                     | **smoke / load / spike / stress** — voir Phase 5bis                  |

#### Phase 5bis — Tests de charge & stress _(ajout demandé)_

| Fichier                                  | Profil                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `scripts/perf/smoke.js`                  | 1 VU / 30 s — sanity post-déploiement                                                                                     |
| `scripts/perf/load.js`                   | 50 → 500 VUs soutenus — trafic normal / pic marketing                                                                     |
| `scripts/perf/spike.js`                  | 10 → 5000 VUs en 20 s — effet viral, test de récupération                                                                 |
| `scripts/perf/stress.js`                 | **paliers 1 → 5 → 10 → 20 → 30 → 50 → 100 → 250 → 500 → 1000 → 2500 → 5000 → 10 000 VUs** — recherche du point de rupture |
| `scripts/perf/lib/{options,scenario}.js` | Paliers partagés + parcours visiteur réaliste (HTML + route SPA + API cours optionnelle)                                  |
| `.github/workflows/load-test.yml`        | Dispatch manuel, **garde-fou anti-URL-de-prod**                                                                           |
| `docs/perf/load-testing.md`              | Mode d'emploi + règles impératives (jamais la prod, k6 Cloud au-delà de ~1000 VUs)                                        |

#### Phase 6 — CI/CD (`.github/workflows/ci.yml` réécrit)

Pipeline fail-fast : `quality` (format → lint → typecheck) ∥ `semgrep` ∥ `secrets` ∥ `audit`
→ puis `test` (unit + intégration + couverture), `e2e`, `build` (+ budget bundle) → `lighthouse`
(informatif) → **gate `CI`** (seul required check). Échec immédiat sur étape critique.

#### Phase 7 — Documentation IA (`docs/ai/`)

`project-context.md` · `architecture.md` · `coding-rules.md` · `testing-rules.md` ·
`security-rules.md` · `deployment-rules.md` · `business-rules.md` · `glossary.md`
(+ `roadmap-automatisation.md` : plan d'automatisation avancée V1→V10).

#### Phase 8 — Support vibecoding

`CLAUDE.md` · `AGENTS.md` (Codex) · `.github/copilot-instructions.md` ·
`.cursor/rules/vibe-hub.mdc` · `.windsurfrules` · `CONTRIBUTING.md`.
Tous pointent vers `docs/ai/` (source unique) + rappellent inline les interdits durs
(AD-1, AD-2, eval, routes en dur, `JSON.parse` nu) pour réduire les hallucinations.

#### Phase 9 — Architecture (améliorations appliquées)

- AD-2 refermé : `AdminPage` n'importe plus le client brut ; wrappers auth dans `services/`.
- AD-5 partiel : embeds vidéo sur liste blanche + sandbox.
- Nouvelle couche `src/config/` (accès env) et `src/lib/schemas/` (contrats de frontière).
- `src/lib/` étoffé : `logger`, `observability`, `validation`.

#### Phase 10 — Observabilité

`src/lib/logger.js` (JSON structuré, caviardage PII, `setLogSink` pour Sentry) ·
`src/lib/observability.js` (Web Vitals + `window.onerror` + `unhandledrejection`) ·
`src/components/ErrorBoundary.jsx` (enveloppe `<App/>`, écran de repli).

### 5. Contenu complet des fichiers

Tous les fichiers listés sont présents dans le dépôt (créés/modifiés dans cette itération).

### 6. Commandes à exécuter

```bash
npm install                         # installe deps + hooks git (husky)
cp .env.example .env                 # renseigner les valeurs
npm run validate                     # format + lint + typecheck + couverture + build + budget
npm run e2e                          # tests end-to-end (build + preview auto)
npx playwright install --with-deps   # 1re fois : navigateurs e2e

# Sécurité (local)
npm run security:audit               # npm audit (high/critical)
npm run security:semgrep             # règles projet
gitleaks detect --config .gitleaks.toml

# Perf / charge (jamais contre la prod — cf. docs/perf/load-testing.md)
npm run perf:smoke  -- -e BASE_URL=<preview>
npm run perf:stress -- -e BASE_URL=<staging>   # paliers jusqu'à 10 000 VUs
```

### 7. Dépendances ajoutées

**prod** : `web-vitals`, `zod`
**dev** : `prettier`, `eslint-config-prettier`, `eslint-plugin-jsx-a11y`, `typescript`,
`vitest`, `@vitest/coverage-v8`, `@vitest/ui`, `jsdom`, `@testing-library/{react,dom,jest-dom,user-event}`,
`@playwright/test`, `@lhci/cli`, `size-limit`, `@size-limit/file`, `husky`, `lint-staged`

- outils externes (non-npm) : **k6** (charge), **semgrep**, **gitleaks**.

### 8. Risques éventuels

- **Reformatage Prettier global** : ~130 fichiers touchés (formatage uniquement, y compris
  `DESIGN_SYSTEM.md`, `index.html`, composants). À committer isolément (`style: adopt prettier`).
- **`_bmad-output/` reverté** : un `git checkout -- _bmad-output/` a annulé un reformatage
  Prettier accidentel — il a aussi annulé une modif WIP non commitée de
  `_bmad-output/implementation-artifacts/sprint-status.yaml`. **À vérifier** (`git diff` / ré-appliquer).
- **CI `semgrep --config auto` retiré** au profit de packs ciblés (`p/security-audit`, `p/react`,
  `p/secrets`) en `--severity ERROR` — testés : 0 finding. Élargir progressivement.
- **Migration RLS** : `0001` décrit l'**état cible**. L'appliquer sans auditer les policies
  réelles du projet Supabase peut casser l'accès. `get_waitlist_counts()` est `SECURITY DEFINER`
  (déviation assumée vs la lettre d'AD-4, cf. commentaire dans la migration).
- **`gemini-proxy`** : fournie mais **non déployée** — `services/ai.js` appelle toujours Gemini
  côté navigateur tant que le proxy n'est pas en ligne.
- **Type-check** : `checkJs:false` — seuls les fichiers `// @ts-check` sont vérifiés. Green
  aujourd'hui mais ne couvre pas encore les composants.

### 9. Plan de migration

1. **Committer par lots** : (a) `style: prettier`, (b) `build: tooling qualité+tests`,
   (c) `test: suite initiale`, (d) `ci: pipeline complet`, (e) `docs: contexte IA + vibecoding`,
   (f) `feat: observabilité`, (g) `refactor: AD-2 + validation frontières`.
2. **Roter la clé Gemini** (Google AI Studio) — considérer l'ancienne comme compromise.
3. **Auditer la RLS Supabase** live, puis appliquer `supabase/migrations/0001`.
4. **Déployer `gemini-proxy`**, réécrire `services/ai.js` en `fetch()`, supprimer `VITE_GEMINI_API_KEY`.
5. **Optimiser les images** hero/404 (WebP/AVIF < 200 Ko, dimensions explicites).
6. Mettre le job **`CI`** en required status check + protéger `main`.
7. Activer Dependabot + CodeQL côté GitHub (Settings → Security).

### 10. Roadmap long terme

| Horizon          | Chantier                                                                                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Court (≤ 1 mois) | Points 2-6 ci-dessus · élargir la couverture aux composants · `getWaitlistCounts()`                                                                                                                                                                |
| Moyen (1-3 mois) | Passer `checkJs: true` → migration `.ts` progressive · endpoint de collecte métriques + dashboard + alertes · tests d'intégration réels (Testcontainers Supabase) · rate-limiting `gemini-proxy`                                                   |
| Long (3-6 mois)  | UI Builder réel dans un **iframe sandbox** (AD-5) · injection de fautes en CI · boucle agent→issue→agent · pentest multi-modèles par PR (cf. `docs/ai/roadmap-automatisation.md` V4-V10) · bump Vite/Tailwind · décommission `src/data/courses.js` |

---

## RÈGLE D'OR — comment chaque décision détecte une erreur IA au plus tôt

| Mécanisme                                           | Erreur attrapée                                                        | Quand                    |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------ |
| `// @ts-check` + Zod aux frontières                 | mauvais type, champ oublié, colonne renommée, réponse Gemini malformée | édition / exécution      |
| ESLint (`no-restricted-imports`, `eqeqeq`, `eval`…) | violation d'archi, coercion douteuse, code dangereux                   | à la frappe / pre-commit |
| Semgrep + gitleaks                                  | XSS, iframe non sandbox, secret, clé en dur                            | pre-push / CI            |
| Vitest + seuil 80 %                                 | régression de logique / contrat de service                             | pre-push / CI            |
| Playwright                                          | parcours utilisateur cassé, page blanche                               | CI                       |
| `npm audit` + Dependabot + CodeQL                   | dépendance vulnérable, faille de flux                                  | CI / hebdo               |
| `size-limit` + Lighthouse                           | bundle qui gonfle, LCP/CLS qui dérive                                  | CI                       |
| k6 (smoke→stress)                                   | effondrement sous charge, point de rupture                             | manuel / pré-release     |
| `logger` + `observability` + `ErrorBoundary`        | erreur en prod, Web Vital dégradé                                      | runtime                  |
