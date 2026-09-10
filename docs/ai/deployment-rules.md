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
- [ ] `supabase/functions/gemini-proxy` déployée + `GEMINI_API_KEY` en secret Supabase (AD-1).
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

- Une ligne = un objet JSON (`ts`, `level`, `message`, `env`, contexte).
- En prod : seuls `warn` / `error` sortent.
- Les clés sensibles (`*key*`, `*token*`, `*secret*`, `email`, `password`, `authorization`)
  sont **caviardées** automatiquement.
- `setLogSink(fn)` : point de branchement pour Sentry / Logtail / un POST `/logs`.
  **Aucune dépendance imposée aujourd'hui** — à activer quand un collecteur existe.

### Métriques — `src/lib/observability.js`

- **Core Web Vitals** : CLS, INP, LCP, FCP, TTFB → `logger.info('web-vital', …)`.
- Capture globale : `window.onerror`, `unhandledrejection`.
- `initObservability()` appelé une fois dans `main.jsx`.
- **TODO** : `navigator.sendBeacon('/metrics', …)` quand l'endpoint de collecte existe
  (Vercel Analytics ou Edge Function `/metrics`).

### Erreurs UI — `src/components/ErrorBoundary.jsx`

Enveloppe `<App/>`. Une exception de rendu → log `react:error-boundary` + écran de repli
« Recharger la page » au lieu d'une page blanche.

### Ce qu'il reste à mettre en place (roadmap observabilité)

- [ ] Endpoint de collecte des métriques + logs (Edge Function ou service tiers).
- [ ] Dashboard (Grafana / Vercel Analytics / Logtail).
- [ ] Alertes : taux d'erreur `services/*`, p95 LCP, échecs `gemini-proxy`, quota Gemini.
- [ ] Traces distribuées navigateur → `gemini-proxy` → Gemini (propager un `request-id`).
- [ ] Rate limiting + plafond de coût dans `gemini-proxy` (point d'application, cf. Spine).

## Rollback

- Front : Vercel → « Promote » un déploiement précédent.
- Migration DB : chaque migration doit avoir sa contre-migration ou être backward-compatible
  (ajout de colonne nullable plutôt que rename).
