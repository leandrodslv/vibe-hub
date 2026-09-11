# Règles de déploiement & observabilité — Vibe Hub

## Cible

- **Front** : Vercel (statique). `vercel.json` : rewrites SPA (toute URL inconnue → `index.html`)
  - en-têtes de sécurité + cache long sur `/assets/*`.
- **Back** : Supabase (Postgres + Auth + Edge Functions).

## Pipeline (release-please)

1. Les commits conventionnels mergés sur `main` alimentent une **PR de release** permanente.
2. Merger la PR de release → tag + GitHub Release + (à câbler) déploiement prod.
3. Le job `deploy` vit dans `.github/workflows/release-please.yml` (commenté — à adapter :
   `npx vercel deploy --prod`).

## Avant de déployer

- [ ] CI verte (job `CI`).
- [ ] `npm run validate` en local passe.
- [ ] Variables d'env configurées côté Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) —
      **jamais** de secret en `VITE_*`.
- [ ] Migrations Supabase appliquées (`supabase db push`) et **RLS auditée**.
- [ ] `supabase/functions/gemini-proxy` déployée (`supabase functions deploy gemini-proxy --no-verify-jwt`) + `GEMINI_API_KEY` et `ALLOWED_ORIGINS` en secrets Supabase (AD-1).
- [ ] `VITE_GEMINI_PROXY_URL` configurée côté Vercel (Preview + Production). Sans elle,
      l'assistant IA se dégrade proprement (message « proxy non configuré »).
- [ ] Smoke test de charge post-déploiement : `npm run perf:smoke -- -e BASE_URL=<preview>`.
- [ ] Lighthouse : perf ≥ 80, a11y ≥ 90 (cf. `.lighthouserc.json`).

## Environnements

| Env     | Front                     | Supabase              | Notes                             |
| ------- | ------------------------- | --------------------- | --------------------------------- |
| local   | `npm run dev` (5173)      | projet de dev         | `.env` local                      |
| preview | déploiement Vercel par PR | projet de dev/staging | cible des tests e2e & charge      |
| prod    | `main` mergé + release    | projet de prod        | **jamais** cible d'un stress test |

## Observabilité

### Logs structurés — `src/lib/logger.js`

- Une ligne = un objet JSON (`ts`, `level`, `message`, `env`, `release`, `sessionId`, contexte).
- En prod : seuls `warn` / `error` sortent.
- Les clés sensibles (`*key*`, `*token*`, `*secret*`, `email`, `password`, `authorization`)
  sont **caviardées** automatiquement.
- `setLogContext({ … })` : contexte joint à **chaque** entrée (posé au boot :
  `release`, `sessionId`). `setLogSink(fn)` : point de branchement collecteur.

### Métriques & erreurs — `src/lib/observability.js` (V10)

- **Core Web Vitals** : CLS, INP, LCP, FCP, TTFB.
- Capture globale : `window.onerror`, `unhandledrejection`, + `reportError()` (utilisé par
  l'ErrorBoundary).
- **`release`** = `version` package.json `+` court SHA (injecté par Vite `define`,
  `__APP_RELEASE__`). **`sessionId`** = identifiant d'onglet (`sessionStorage`, aucune PII).
- **Collecte** : si `VITE_METRICS_URL` est défini → `navigator.sendBeacon` vers cet endpoint
  (Edge Function `metrics` ou Vercel). Sinon : log console seulement. `initObservability()`
  dans `main.jsx`.
- **Edge Function `metrics`** (`supabase/functions/metrics/`) : insère dans `public.metrics`
  (migration `0002`) via `service_role`. Table sans policy `anon` (personne ne lit en brut) ;
  agrégat admin `get_metrics_summary(hours)`. Défense en profondeur : la fonction re-nettoie
  clés/JWT/e-mails. Tests : `src/test/integration/rls.metrics.test.js`.

### Sentry (optionnel, sans dépendance imposée)

`sourcemap: 'hidden'` (V6) est déjà le bon réglage. Pour activer :

1. Ajouter `@sentry/browser` en dépendance.
2. Créer `src/lib/sentry.js` : si `env.sentryDsn`, `Sentry.init({ dsn, release: __APP_RELEASE__, environment: env.mode })`, puis `setLogSink((entry) => { if (entry.level === 'error') Sentry.captureMessage(String(entry.message), { extra: entry }); })`.
3. Importer `src/lib/sentry.js` depuis `main.jsx` (avant `initObservability()`).
4. CI : `sentry-cli sourcemaps upload --release <__APP_RELEASE__> dist/assets`, puis **exclure
   les `.map` du déploiement** (le mode `hidden` garde déjà le finding `sourcemap-referenced`
   de `security:bundle` à zéro).

### Erreurs UI — `src/components/ErrorBoundary.jsx`

Enveloppe `<App/>`. Une exception de rendu → `reportError('react:error-boundary', …)` (log +
beacon, corrélé `release`/`sessionId`) + écran de repli au lieu d'une page blanche.

### Boucle erreur → correction (V5)

Une erreur prod récurrente (via le dashboard `get_metrics_summary` ou Sentry) → ouvrir une
issue `ai-fix` avec la trace + `release` → `npm run ai-fix <n>`. Un webhook Sentry →
`repository_dispatch` peut automatiser la création d'issue (même schéma que
`ci-failure-to-issue.yml`).

### Ce qu'il reste

- [ ] Dashboard (une page admin lisant `get_metrics_summary`, ou Grafana/Vercel Analytics).
- [ ] Alertes : p75 LCP en régression, taux d'erreur `services/*`, échecs `gemini-proxy`,
      quota Gemini → canal d'équipe.
- [ ] Purge `metrics` > 30 j (pg_cron).
- [ ] Traces distribuées navigateur → `gemini-proxy` → Gemini (propager `sessionId`/`request-id`).
- [ ] Rate limiting + plafond de coût dans `gemini-proxy` (point d'application, cf. Spine).

## Rollback

- Front : Vercel → « Promote » un déploiement précédent.
- Migration DB : chaque migration doit avoir sa contre-migration ou être backward-compatible
  (ajout de colonne nullable plutôt que rename).
