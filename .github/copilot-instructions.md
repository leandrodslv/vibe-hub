# Instructions GitHub Copilot — Vibe Hub

SPA **React 18 + Vite + Tailwind CSS 3** (JavaScript, pas TypeScript). Plateforme
d'apprentissage IA pour designers UI/UX francophones. Back-end **Supabase** + **Gemini**.

Référence complète : `docs/ai/`. Résumé ci-dessous.

## Génère du code qui respecte

- **Function components** React + `useState` local. Pas de classe (sauf `ErrorBoundary`).
  Pas de Redux/Zustand/Context-store. Pas de React Router.
- **Français** dans les chaînes UI et les commentaires.
- Style **Prettier** : guillemets simples, point-virgules, largeur 100.
- Tailwind avec les **design tokens** du projet (`surface`, `on-surface`, `primary`,
  `primary-container`, `font-headline-lg`, `chunky-shadow`…) — pas de couleurs arbitraires
  hors `DESIGN_SYSTEM.md`.

## Interdits (le lint/semgrep/CI échoueront)

- Importer `@supabase/supabase-js` ou un SDK Gemini (`@google/generative-ai` / `@google/genai`)
  ailleurs que dans `src/services/`. `services/ai.js` lui-même ne fait qu'un `fetch()` vers `gemini-proxy` (AD-1).
- `import.meta.env.VITE_*` pour un secret. Utilise `src/config/env.js`.
- `eval`, `new Function`, `dangerouslySetInnerHTML` sans `DOMPurify`.
- Écrire un chemin de route en dur (`/app`, `/admin`) → `src/lib/routes.js`.
- `JSON.parse` d'une donnée de `localStorage`/réseau sans `safeJsonParse` (`src/lib/validation.js`).
- Un lien `target="_blank"` sans `rel="noopener noreferrer"` (constante `NOUVEL_ONGLET`).

## Attendus

- Nouveau fichier de logique → première ligne `// @ts-check`, types en JSDoc.
- Nouvelle fonction util / service / hook → fichier `*.test.js` associé (Vitest + Testing
  Library, dépendances mockées via `vi.mock` + `vi.hoisted`).
- Appel de service dans un composant → `try/catch` + état d'erreur affiché (jamais un spinner
  infini ; voir `ModulesTab.jsx`).
- Erreurs loggées via `logger.error` (`src/lib/logger.js`), pas `console.log`.
- Accessibilité : cibles ≥ 44px, `focus-visible:ring`, `aria-hidden` sur icônes décoratives,
  `aria-current` sur la nav.

## Messages de commit

Conventional Commits : `feat(scope): description en minuscule sans point final`.
