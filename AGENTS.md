# AGENTS.md — Vibe Hub

Instructions pour agents de code (Codex, Jules, et tout outil lisant `AGENTS.md`).
Équivalent de `CLAUDE.md` ; la source détaillée est **`docs/ai/`**.

## Projet

SPA **React 18 + Vite + Tailwind CSS 3**. Plateforme d'apprentissage IA pour designers UI/UX
(français). Back-end **Supabase** (Postgres + Auth) + **Gemini**. Déploiement **Vercel**.
Pas de TypeScript (check-JS incrémental via `// @ts-check`), pas de React Router, pas de state
manager global.

## Setup

```bash
nvm use && npm install
cp .env.example .env
```

## Commandes de vérification (à lancer avant de considérer une tâche finie)

```bash
npm run format:check
npm run lint            # 0 warning toléré
npm run typecheck
npm run test:cov        # couverture ≥ 80 % (bloquant)
npm run build && npm run size
npm run e2e             # si la tâche touche à l'UI / au routage
```

Ou tout d'un coup : `npm run validate` (+ `npm run e2e` séparément).

## Contraintes d'architecture (bloquantes — vérifiées par lint + semgrep)

- Import de `@supabase/supabase-js` / `@google/generative-ai` **uniquement** dans `src/services/`.
- Aucun secret en `import.meta.env.VITE_*`. Accès env via `src/config/env.js`.
- Pas d'`eval`, `new Function`, `dangerouslySetInnerHTML` non sanitisé.
- Routes via `src/lib/routes.js`. `JSON.parse` non fiable via `safeJsonParse`.
- Persistance : Supabase (durable) ou `localStorage` préfixé (éphémère). Rien d'autre.

## Conventions

- Commits : Conventional Commits. Titre de PR = futur commit `main` = ligne de CHANGELOG.
- Français pour l'UI et les commentaires.
- Nouveau fichier de logique → `// @ts-check` + JSDoc.
- Nouveau helper/service/hook → test Vitest. Bug corrigé → test de régression.
- Composants : function components, `useState` local.

## Ne pas faire

- Introduire TypeScript en masse, React Router, Redux/Zustand sans mettre à jour
  l'Architecture Spine.
- Ré-alimenter `src/data/courses.js` (legacy, remplacé par Supabase).
- Committer `dist/`, `coverage/`, `.env`, `perf-results/`.
- Lancer un test de charge contre la prod (`docs/perf/load-testing.md`).
