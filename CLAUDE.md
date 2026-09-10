# CLAUDE.md — Vibe Hub

Contexte projet pour Claude Code. Lis d'abord **`docs/ai/`** (project-context, architecture,
coding-rules, testing-rules, security-rules, deployment-rules, business-rules, glossary).

## En 30 secondes

SPA React 18 + Vite + Tailwind. EdTech IA pour designers UI/UX francophones. Back : Supabase
(Postgres + Auth) + Gemini. Hébergement : Vercel. Pas de TS (check-JS incrémental), pas de
React Router (`src/lib/routes.js`), pas de store global.

## Commandes

```bash
npm run dev            # serveur de dev
npm run validate       # format + lint + typecheck + couverture + build + budget bundle (= la CI)
npm test               # Vitest
npm run e2e            # Playwright (build + preview)
```

## Règles non négociables

1. **AD-2** — un composant/page n'importe JAMAIS `@supabase/supabase-js` ni
   `@google/generative-ai`. Passer par `src/services/`. (lint + semgrep le vérifient)
2. **AD-1** — aucun secret derrière `import.meta.env.VITE_*` (inliné, public). Env → `src/config/env.js`.
3. Pas d'`eval` / `new Function` / `dangerouslySetInnerHTML` sans sanitizer (AD-5).
4. Routes (`/app`, `/admin`) jamais en dur → `src/lib/routes.js`. Liens `_blank` → `NOUVEL_ONGLET`.
5. `JSON.parse` de donnée non fiable → `safeJsonParse` (`src/lib/validation.js`).
6. Données durables → Supabase via `services/`. Éphémères → `localStorage` préfixé (`ai_*`, `progress_*`). Pas de 3ᵉ voie (AD-6).
7. Services : `throw` par défaut ; seule exception `addToWaitlist` → `{success|duplicate|error}`.
8. Cours triés par `order_index` uniquement.
9. Tout nouveau fichier de logique commence par `// @ts-check`.
10. Tout nouveau helper/service/hook a un test. Tout bug → test de régression. Couverture ≥ 80 %.

## Style

Function components + `useState` local. Français dans l'UI et les commentaires. Prettier
(`npm run format`) — ne pas discuter le formatage. Commits conventionnels ; le titre de PR
devient le commit sur `main`.

## Pièges connus

- La clé Gemini part actuellement dans le bundle (dette AD-1, `gemini-proxy` à déployer).
- Les policies RLS réelles ne sont pas vérifiées (aucune migration jusqu'à `0001`).
- `hero-collage.png` (2 Mo) et `illustration-404.png` (1,3 Mo) plombent le LCP.
- 6 règles `jsx-a11y` sont en `off` (dette suivie dans `docs/diagnostic-rgaa.md`) — ne pas
  ajouter de code qui en dépendrait.
