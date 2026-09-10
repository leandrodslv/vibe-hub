# Contribuer à Vibe Hub

## Démarrage

```bash
nvm use                 # Node 20 (cf. .nvmrc)
npm install             # installe aussi les hooks git (husky)
cp .env.example .env    # puis renseigner les valeurs
npm run dev
```

## Boucle de dev

| Étape                       | Commande             |
| --------------------------- | -------------------- |
| Dév                         | `npm run dev`        |
| Formater                    | `npm run format`     |
| Vérifier tout (comme la CI) | `npm run validate`   |
| Tests en watch              | `npm run test:watch` |
| E2E                         | `npm run e2e`        |

Les hooks git font le minimum automatiquement :

- **pre-commit** : `lint-staged` (prettier + eslint --fix sur les fichiers stagés).
- **pre-push** : `typecheck` + `test`.

## Règles (résumé — détail dans `docs/ai/`)

1. **Conventional Commits** — le titre de PR devient le commit sur `main` et la ligne de
   CHANGELOG. Format : `type(scope): description en minuscule sans point`.
   Types : `feat fix perf revert docs style refactor test build ci chore`.
2. **Architecture** — un composant ne parle jamais à un système externe directement :
   il passe par `src/services/`. Pas de secret en `VITE_*`. Voir `docs/ai/architecture.md`.
3. **Tests** — tout nouveau helper/service/hook est testé. Tout bug corrigé a un test de
   régression. Couverture ≥ 80 % (bloquant). Voir `docs/ai/testing-rules.md`.
4. **Types** — tout nouveau fichier de logique commence par `// @ts-check`.
5. **Sécurité** — `docs/secure-coding-guide.md`. `npm run security:semgrep` avant de pousser
   du code qui touche aux URLs, iframes, DB, env.
6. **Accessibilité** — `jsx-a11y` actif, objectif RGAA (`docs/diagnostic-rgaa.md`).

## Pull requests

- Une PR = un sujet. Remplir le template.
- CI verte (job **`CI`**) obligatoire.
- Aucun secret ni fichier généré (`dist/`, `coverage/`, `.env`, `perf-results/`).
- Décrire la dette assumée dans « Notes de review ».

## IA / vibecoding

Les assistants (Claude Code, Cursor, Copilot, Codex, Windsurf) sont configurés pour lire
`docs/ai/`. Si tu ajoutes une règle durable, mets à jour le fichier `docs/ai/` concerné —
pas seulement le prompt de ton outil.

## Tests de charge

Voir `docs/perf/load-testing.md`. **Jamais contre la prod.**
