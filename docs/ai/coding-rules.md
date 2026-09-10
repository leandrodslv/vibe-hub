# Règles de code — Vibe Hub

## Feedback rapide : les commandes

| Commande                          | Quand                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run lint`                    | avant chaque commit (hook `pre-commit` le fait sur les fichiers stagés)                |
| `npm run format` / `format:check` | Prettier — le formatage n'est jamais discuté                                           |
| `npm run typecheck`               | `tsc --noEmit` — vérifie les fichiers portant `// @ts-check`                           |
| `npm test`                        | Vitest (hook `pre-push`)                                                               |
| `npm run validate`                | tout l'enchaînement local (format + lint + types + couverture + build + budget bundle) |

## Style & conventions

- **Français** dans l'UI et les commentaires ; anglais pour les identifiants de code.
- **Prettier** : `singleQuote`, `semi`, `printWidth: 100`, `trailingComma: es5`. Ne pas se
  battre avec — lancer `npm run format`.
- **ESLint** : `eqeqeq`, `prefer-const`, `no-var`, `no-console` (sauf `warn`/`error`),
  `eval`/`new Function` **interdits** (règle `no-restricted-syntax`).
- Composants : **function components** uniquement (sauf `ErrorBoundary`, obligatoirement une
  classe). État **local** (`useState`) — pas de store global.
- Pas de `PropTypes`. Le typage se fait via **TypeScript en mode check-JS incrémental**.

## Type-safety incrémentale (important pour attraper les hallucinations d'IA)

- `tsconfig.json` est en `checkJs: false` **globalement** pour ne pas casser la CI d'un coup.
- **Tout nouveau fichier** de logique (helpers `lib/`, adaptateurs `services/`, `config/`,
  hooks non triviaux) **DOIT** commencer par `// @ts-check` et être annoté en JSDoc.
- Objectif : suffisamment de fichiers annotés pour passer `checkJs: true`, puis migrer en `.ts`.
- Un fichier `// @ts-check` qui ne type-check pas **casse `npm run typecheck`** → CI rouge.

## Frontières à ne jamais franchir (rappel Architecture Spine)

1. Un composant **n'importe pas** `@supabase/supabase-js` ni un SDK Gemini
   → passer par `src/services/`. Gemini : `services/ai.js` = `fetch()` vers `gemini-proxy`. (AD-1/AD-2)
2. Un secret **ne passe pas** par `import.meta.env.VITE_*`. Accès env uniquement via
   `src/config/env.js`. (AD-1)
3. Pas d'`eval`, `new Function`, `dangerouslySetInnerHTML` sans sanitizer + justification. (AD-5)
4. Un chemin de route (`/app`, `/admin`) ne s'écrit pas en dur → `src/lib/routes.js`.
5. `JSON.parse` d'une donnée non fiable (localStorage, réseau) → `safeJsonParse` de
   `src/lib/validation.js`. Plus largement, toute donnée qui **entre** dans l'app depuis
   une frontière (réponse Supabase, réponse Gemini, env, payload) → valider par un schéma
   Zod de `src/lib/schemas/` via `parseOrThrow` (indispensable) ou `parseOrWarn`
   (survivable). Ne jamais consommer directement un `data` de `supabase-js` ni un
   `response.text()` de Gemini.
6. Nouvelle donnée durable/partagée → Supabase via `services/`. Nouvelle donnée éphémère
   par navigateur → `localStorage` avec préfixe (`ai_*`, `progress_*`). Pas de 3ᵉ mécanisme. (AD-6)

## Gestion des erreurs

- `services/*` : **lèvent** (`throw`) par défaut. Le seul retour `{success}/{duplicate}/{error}`
  autorisé est celui d'`addToWaitlist`.
- Composant qui appelle un service : `try/catch` + état d'erreur affiché (voir `ModulesTab`
  pour le patron : spinner → erreur lisible, jamais un spinner infini).
- Toute erreur inattendue loggée via `logger.error(msg, { ...serializeError(e) })`.
- Un sous-arbre qui peut casser doit être sous un `<ErrorBoundary>`.

## Accessibilité (RGAA — objectif produit)

- `jsx-a11y` est actif dans ESLint. 6 règles sont temporairement en `off` (labels stylés non
  liés, overlays cliquables) — suivies dans `docs/diagnostic-rgaa.md`. **Ne pas ajouter de
  nouveau code qui en aurait besoin** ; les réactiver au fil des corrections.
- Cibles tactiles ≥ 44px, focus visible (`focus-visible:ring-*`), `aria-hidden` sur les icônes
  décoratives, `aria-current` sur la nav, mention « (nouvel onglet) » pour les liens `_blank`.

## Commits & Git

- **Conventional Commits** obligatoires (`feat:`, `fix:`, `perf:`, `refactor:`, `test:`,
  `docs:`, `build:`, `ci:`, `chore:`). Le titre de PR = le futur message de commit sur `main`
  (squash-merge) = ligne de CHANGELOG (release-please). Validé par le workflow `PR Title`.
- Description en minuscule, sans point final.
- Une PR = un sujet. CI verte. Aucun secret ni fichier généré commité.
- Ne jamais commiter `.env`, `dist/`, `coverage/`, `playwright-report/`, `perf-results/`.
