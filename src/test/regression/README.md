# Tests de régression

> Règle : **chaque bug corrigé produit ici un test qui échoue avant le fix et passe après.**

Ces tests sont ramassés par la suite unitaire normale (`npm test`) — ils vivent
juste dans un dossier dédié pour être identifiables et ne jamais être supprimés.

## Créer un test de régression

```bash
npm run test:regression:new -- "<slug-du-bug>" [numero-issue]
# ex. npm run test:regression:new -- "waitlist-double-submit" 42
```

Puis :

1. Écris l'assertion qui **reproduit** le bug.
2. `npx vitest run src/test/regression/<slug>.test.js` → doit **échouer** sur le code actuel.
3. Corrige le bug. Le test passe.
4. Commit `fix: …` incluant le test (la CI `fix-needs-test` le vérifie).
