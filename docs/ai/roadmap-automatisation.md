# Roadmap — Industrialisation AI‑First par l'automatisation

> Source : `AUDIT_AI_FIRST.md` (les 11 phases + la règle d'or) croisé avec le retour
> d'expérience de Quentin Adam (Clever Cloud) sur le vibecoding à grande échelle.
>
> **Thèse commune aux deux :** l'IA ne produit de la valeur que si on l'entoure d'un
> « harnais » d'automatisations qui détectent une erreur générée par une IA **le plus tôt
> possible**. Ce qui coûtait trop cher à faire à la main (mocks, tests d'intégration,
> pentest à chaque commit, audits de perf, migrations exploratoires) devient rentable dès
> lors qu'un agent l'exécute. Le code devient jetable ; ce qui compte et qu'on maintient :
> **les specs, l'architecture, les tests, l'environnement de test**.

---

## 0. Principes directeurs (repris de la vidéo)

| Principe                                                                  | Traduction pour Vibe Hub                                                                                                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Langage contraint = meilleure boucle de rétroaction                       | `// @ts-check` partout + **Zod** à toutes les frontières (env, réponses Gemini, lignes Supabase, payloads). Le compilateur / le schéma parle, l'agent corrige. |
| Boucle de feedback la plus courte possible                                | pre-commit → pre-push → CI fail‑fast → agent auto-fix. Chaque échec doit produire un **artefact lisible par une IA** (rapport structuré, pas un log brut).     |
| Demander à l'IA des tâches **inhumaines**                                 | Pentest multi‑modèles en continu, simulation de pannes à chaque commit, revue croisée de toutes les branches ouvertes chaque semaine.                          |
| L'IA n'est pas un junior — c'est « un junior qui a lu toutes les thèses » | On l'encadre par des tests, pas par de la relecture ligne à ligne. Le budget « tokens de test » est assumé.                                                    |
| Pas de plan annuel d'outillage IA                                         | Workflows versionnés et jetables ; revue trimestrielle « on garde / on jette ».                                                                                |
| On ne rouvre plus le code                                                 | Investir dans `docs/ai/*`, les schémas, les fixtures et les oracles de test, pas dans le polish du code généré.                                                |

---

## 1. État des lieux — ce qui est déjà en place

Le socle « feedback rapide » existe déjà, il ne faut **pas** le refaire :

- **Qualité** : ESLint (0 warning toléré), Prettier, `tsc --noEmit` via `// @ts-check`, EditorConfig.
- **SAST / secrets / deps** : Semgrep (`.semgrep.yml` + registre auto), Gitleaks, `npm audit`, CodeQL, Dependabot.
- **Tests** : Vitest + Testing Library (unit/intég), couverture v8 **seuil 80 %**, Playwright E2E.
- **Perf** : k6 (smoke/load/spike/stress), size-limit (budget bundle), Lighthouse CI.
- **CI** : `ci.yml` fail‑fast, gate final unique `CI`, `pr-title.yml`, `release-please`, `load-test.yml`.
- **Hooks** : Husky pre-commit (lint-staged) + pre-push (typecheck + tests).
- **Doc IA** : `docs/ai/` (project-context, architecture, coding/testing/security/deployment rules).

**Ce qui manque pour passer au régime « vidéo »** → les vagues ci‑dessous.

---

## 2. Correspondance vidéo → automatisation

| Idée dans la vidéo                                                          | Automatisation cible                                                       | Vague | Outil                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----- | ---------------------------------------- |
| Specs + tests unitaires écrits d'abord, « code jusqu'à ce que ça passe »    | Template de story « spec → tests rouges → agent implémente »               | V1    | Claude Code + BMAD                       |
| Tests d'intégration avec **Testcontainers**                                 | Postgres/Supabase jetable + edge function testée pour de vrai              | V2    | `supabase` CLI / Testcontainers + Vitest |
| **Mocks** pour isoler l'externe (ex. « simuler une bourse »)                | MSW + fixtures déterministes Gemini/Supabase, générateur de mock           | V3    | MSW, script Node                         |
| **Simulation** de pannes à chaque commit (perte de paquets, nœud qui tombe) | Fault‑injection sur le proxy Gemini + property‑based + chaos réseau E2E    | V4    | fast-check, Playwright routes, k6        |
| Le simulateur **ouvre une issue** → un autre agent la **résout**            | `report → issue (label ai-fix) → workflow agent-fix → PR`                  | V5    | GitHub Actions + Claude Code headless    |
| **Pentest sur chaque commit**, plusieurs modèles qui « se tabassent »       | Job pentest par PR : DAST + revue LLM croisée (Claude + Gemini) du diff    | V6    | GitHub Actions, ZAP/nuclei, LLM          |
| Agent qui lit **toutes les branches, PR, Slack, mails** → doc de réunion    | Cron hebdo « weekly sync » → `reports/weekly-sync.md`                      | V7    | Cron + Claude Code / n8n                 |
| « Teste juste pour voir » : migration de lib + **audit de perf** (x3)       | Workflow `explore-*` à la demande → PR + diff de perf                      | V8    | `workflow_dispatch` + Claude Code        |
| **Décommissionner le legacy**, traduction encadrée par tests                | Inventaire dette + tests de caractérisation + réécriture pilotée           | V9    | script + Claude Code                     |
| Failles « jamais exploitées, pas dans les logs »                            | Observabilité en prod comme oracle (Sentry + web-vitals + logs structurés) | V10   | Sentry, Supabase logs                    |

---

## 3. Les vagues (ordre d'implémentation)

Chaque vague = un lot livrable indépendamment, avec **Trigger / Entrée / Sortie / Definition of Done**.
Priorité décroissante : V1‑V3 d'abord (fondations), V4‑V6 (le cœur « vidéo »), V7‑V10 (effet de levier).

### V1 — Contrats & type-safety renforcés _(fondation)_ — ✅ livré 2026-09-10

Objectif : que l'erreur d'une IA casse **au parse**, pas en prod.

- [x] `zod` en dépendance (+3,1 kB gzip au bundle de démarrage, sous le budget). Schémas dans `src/lib/schemas/` : `env.js`, `course.js`, `waitlist.js`, `gemini.js`, `index.js`.
- [x] `src/lib/schemas/parse.js` : helpers `parseOrThrow` (donnée indispensable → `SchemaError` tracée) et `parseOrWarn` (donnée survivable → log + repli).
- [x] `src/config/env.js` : `VITE_SUPABASE_URL` validée via `supabaseUrlSchema` au boot (message explicite, dégradation gracieuse conservée).
- [x] `src/services/supabase.js` : `courseArraySchema` sur `getCourses`/`getAllCourses` ; `courseInputSchema`/`courseUpdateSchema` sur le payload **avant** l'appel réseau ; `courseSchema` sur la ligne renvoyée.
- [x] `src/services/ai.js` : `geminiTextSchema` sur `response.text()` — une complétion vide devient une défaillance tracée, plus un `""` silencieux.
- [x] `tsconfig.json` : `noUncheckedIndexedAccess: true` (`strict` était déjà à `true`).
- [x] Script npm `types:db` (`supabase gen types typescript --local`). ⚠️ nécessite `supabase start` — à câbler en V2.
- [x] Tests : `src/lib/schemas/schemas.test.js` (12) + cas ajoutés dans `supabase.test.js` / `ai.test.js`. Couverture globale 95 %.
- **Reste** : `supabase/functions/gemini-proxy/index.ts` (Deno) — valider le body entrant + `geminiProxyResponseSchema` côté client → fait en **V9** (migration AD-1).
- **Trigger** : à chaque `npm run test` / `npm run typecheck` (déjà en pre-push + CI).
- **DoD atteint** : renommer `courses.title` en base fait échouer `getCourses` (test `SchemaError`) ; une réponse Gemini vide renvoie un message d'erreur tracé.

### V2 — Tests d'intégration réels (Testcontainers) _(~3 j)_

Objectif : arrêter de tout mocker — vérifier que le programme « communique bien avec le monde extérieur » (Quentin Adam).

- [x] Choix : **`@testcontainers/postgresql`** (+ `pg`, `@types/pg`) plutôt que la stack
      Supabase complète — les policies de `0001` sont appliquées par Postgres, pas par
      PostgREST/GoTrue. ~3 s de démarrage au lieu de ~40 s.
- [x] Harnais `src/test/integration/helpers/db.js` : `startContainer()` (rôles Supabase +
      migrations + GRANT par défaut), `connect(uri)` → `sql` / `reset` / `asRole()`.
- [x] `globalSetup.js` : un conteneur partagé ; `uri = null` si Docker absent → suites en
      `describe.skipIf` (`npm run test:integration` reste vert sans Docker).
- [x] `vitest.integration.config.js` (env `node`, série, hors `npm test`) + script
      `test:integration` + ajout à `npm run validate`.
- [x] 11 tests, tous verts contre un vrai Postgres :
  - RLS `courses` : `anon` lit seulement les publiés, ne peut pas INSERT/UPDATE ; `authenticated` a le CRUD complet.
  - RLS `waitlist` : `anon` peut rejoindre, personne (même `authenticated`) ne lit d'email brut (AD-3) ; doublon → `23505`.
  - RPC `get_waitlist_counts` : agrégats corrects, `anon` refusé (execute révoqué), `security definer` opère malgré RLS (AD-4).
- [x] Job CI `integration` (`needs: [quality]`) + ajouté au gate `ci-ok`.
- **Reste** : test d'intégration de l'edge function `gemini-proxy` (Supabase réel + Gemini
  mocké) → après V3 (mocks déterministes). Parcours auth signup→session→workspace → nécessite
  GoTrue, repoussé (faible valeur vs coût).
- **Trigger** : PR + push main.
- **DoD atteint** : renommer une colonne ou casser une policy dans une migration fait
  échouer `test:integration` en CI avant merge.

### V3 — Mocks déterministes & tests de régression _(~2 j)_

Objectif : « 1 bug corrigé = 1 test qui empêche sa réapparition » + isoler l'IA externe.

- [x] `msw` (dev). `src/test/mocks/` : `server.js` (setupServer partagé), `handlers/gemini.js`
      (intercepte `:generateContent` au niveau fetch), `handlers/supabase.js` (PostgREST
      `courses` / `waitlist` / `rpc`), `index.js` (barrel).
- [x] `src/test/mocks/scenarios/` : jeux nommés déterministes — `gemini.js` (nominal,
      withCodeBlock, empty, blocked, malformedJson, quotaExceeded, overloaded, serverError,
      promptInjectionInReply) ; `courses.js` (nominal, empty, malformedRow).
- [x] Câblé dans `src/test/setup.js` : `listen({ onUnhandledRequest: 'bypass' })` +
      `resetHandlers()` / `resetScenarios()` entre chaque test → aucune régression sur les
      tests qui mockent au niveau module.
- [x] `ai.test.js` **migré vers MSW** : teste le vrai code de mapping d'erreur d'`ai.js`
      (429 → quota, 503 → surcharge, 500 → générique, JSON tronqué, complétion vide, injection
      de prompt inerte) — survivra à la migration AD-1 (`fetch` vers le proxy).
- [x] `src/services/supabase.msw.test.js` : `getCourses`/`addToWaitlist` de bout en bout
      via HTTP mocké, y compris `malformedRow` → `SchemaError` (V1) et conflit `23505`.
- [x] `scripts/new-regression-test.mjs` + `npm run test:regression:new -- "<slug>" [issue]`
      → scaffolde `src/test/regression/<slug>.test.js` (gabarit rouge-puis-vert). Dossier +
      README créés.
- [x] `.github/workflows/fix-needs-test.yml` : sur une PR au titre `fix…`, échoue si le
      diff ne touche aucun `*.test.*`. À ajouter à la protection de branche pour rendre
      bloquant (contexte : « Fix needs test »).
- **Trigger** : `npm test` (mocks) + CI `fix-needs-test` sur PR `fix:`.
- **DoD atteint** : la réponse externe (Gemini / Supabase) est simulée de façon
  déterministe, cas de panne inclus ; un `fix:` sans test est signalé en CI.

### V4 — Simulation / injection de fautes à chaque commit ← cœur « vidéo » — ✅ livré

Vibe Hub n'est pas distribué, mais les mêmes principes s'appliquent aux **frontières fragiles** : Gemini, le réseau, les quotas.

- [x] **Property-based** (`fast-check`) sur la logique pure : `src/lib/routes.property.test.js`
      (round-trip `appHref`↔`currentRoute`, onglets toujours valides) + `validation.property.test.js`
      (`sanitizeText` borné/sans char de contrôle, `safeJsonParse` ne lève jamais, `isSafeHttpUrl`
      jamais vrai pour un schéma dangereux…). Dans la suite unitaire normale.
- [x] **Injection de fautes** : latence ajoutée aux handlers MSW (`setGeminiLatency`,
      `setSupabaseLatency`) ; harnais seedé `src/test/simulation/harness.js` (PRNG mulberry32,
      `pickFaults`, `applyFaults`, `writeReport`).
- [x] **Suite de simulation** `src/test/simulation/resilience.sim.test.js`
      (`vitest.simulation.config.js`, `npm run test:simulation`) : pour chaque graine, tire une
      combinaison de pannes (scénario Gemini × scénario Supabase × latence) et vérifie 4
      invariants — `generateAIResponse` renvoie toujours une string non vide, **jamais la clé
      API**, `getCourses` résout en tableau OU lève une `Error`, `addToWaitlist` résout toujours
      en `{success|duplicate|error}`.
- [x] **Bug trouvé & corrigé** : seed 7 → `getCourses` rejetait avec l'objet nu de
      supabase-js. `rethrow()` enveloppe désormais en `Error` (`src/services/supabase.js`) +
      test de régression `src/test/regression/supabase-rethrow-wraps-non-error.test.js`.
- [x] **Rapport** : un échec écrit `reports/simulation-seed-<n>.md` (date, commande de repro
      `SIM_SEEDS=<n> npm run test:simulation`, pannes en JSON, stack, étapes pour l'agent). C'est
      l'entrée de la V5.
- [x] **Chaos réseau E2E** `e2e/chaos.spec.js` : `route.abort()` / 500 sur `courses`, 503 sur
      Gemini → message d'erreur lisible, **jamais** `role="alert"` (ErrorBoundary), nav intacte.
- [x] **CI** : job `simulation` dans `ci.yml` (12 graines, upload des rapports en cas d'échec)
  - `.github/workflows/simulation-nightly.yml` (200 graines, cron 02:17 UTC ; un échec ouvre
    une issue `ai-fix` par rapport — stub V5).
- **Reste** : `useTypewriter` en property-based ; « 100 requêtes en rafale » (throughput) →
  couvert indirectement par les invariants, à durcir si besoin.
- **DoD atteint** : un échec de simulation est reproductible par sa graine et produit un
  rapport Markdown exploitable par un agent.

### V5 — Boucle rapport → issue → agent ← cœur « vidéo » — ✅ livré (moitié auto, moitié locale)

Le rapport de bug est « posté dans une issue, dépilé par un autre agent qui va le résoudre ».
**Contrainte** : pas de clé API Anthropic — seulement un plan Claude Pro. Donc la 1ʳᵉ moitié
(rapport → issue) est automatique en CI, la 2ᵉ (issue → correctif) se lance **en local** avec
Claude Code. Un workflow d'automatisation complète est fourni **désactivé**, activable via un
token OAuth.

- [x] **Label `ai-fix`** créé sur le repo.
- [x] `.github/workflows/ci-failure-to-issue.yml` (`workflow_run` sur `CI`) : un échec CI sur
      `main` ouvre une issue `ai-fix` (lien du run + jobs fautifs), dédup par short-sha.
- [x] `.github/workflows/simulation-nightly.yml` (V4) : chaque `reports/simulation-seed-<n>.md`
      d'un run nocturne en échec → une issue `ai-fix` avec le rapport en corps.
- [x] **`npm run ai-fix`** (`scripts/ai-fix.mjs`) : liste les issues `ai-fix` ouvertes ;
      `npm run ai-fix <n>` crée la branche `ai-fix/<n>`, écrit `AI_FIX_CONTEXT.md` (rapport +
      mission + contraintes d'archi + « ouvre une PR draft ») → tu lances `claude` dessus.
- [x] `.github/workflows/agent-fix.yml` — **automatisation complète, OFF par défaut**.
      Pour l'activer : `claude setup-token` → secret `CLAUDE_CODE_OAUTH_TOKEN` + variable
      `AI_AUTOMATION_ENABLED=true`. Utilise `anthropics/claude-code-action`, ouvre une **PR
      draft**, jamais de merge auto.
- [x] **Garde-fous** : `.github/CODEOWNERS` (`supabase/migrations/`, `src/config/`, `.github/`,
      `docs/ai/` → review obligatoire si la protection de branche l'exige) ; le script et le
      prompt d'agent interdisent de toucher ces zones sans le signaler ; `AI_FIX_CONTEXT.md`
      git-ignoré.
- **Politique PR** : **draft, merge humain obligatoire** (choix retenu).
- **Trigger** : échec CI sur `main` (auto) + run nocturne (auto) ; résolution manuelle/locale
  (`npm run ai-fix`) — ou auto si le token OAuth est configuré.
- **DoD atteint** : un échec nocturne se retrouve le matin en issue `ai-fix` avec le rapport ;
  `npm run ai-fix <n>` amène à une PR draft en quelques minutes.

### V6 — Pentest sur chaque PR ← cœur « vidéo » — ✅ livré

« Tout commit entrant se tape du pentest… puis tu lances Gemini, puis Grok, puis tout le monde
sur toi-même en permanence. » Même contrainte que V5 : pas de clé API → la revue LLM Claude
se lance en local, la revue Gemini en CI si le secret existe.

**Checks déterministes (bloquants, dans `ci.yml`)** :

- [x] **SAST** : job `semgrep` étendu avec `p/owasp-top-ten` (en plus de `p/security-audit`,
      `p/react`, `p/secrets` et `.semgrep.yml`).
- [x] `npm run security:headers` (`scripts/check-security-headers.mjs`) : audite `vercel.json`
      — CSP sans `unsafe-eval`/`unsafe-inline`, `object-src 'none'`, `frame-ancestors 'none'`,
      `base-uri`, HSTS, `X-Frame-Options`… Ajouté au job `build` + à `npm run validate`.
- [x] `npm run security:bundle` (`scripts/check-bundle-secrets.mjs`) : scanne `dist/` —
      clés Google/AWS, JWT (décodé : `role: anon` OK, `service_role` = critique), clés privées,
      source maps découvrables. Un secret venant d'un `.env` **local** est un avertissement
      (dev), un secret **codé en dur** est bloquant. `.security/allowlist.yml` pour les
      exceptions justifiées.
- [x] `vite.config.js` : sourcemaps passées en `'hidden'` (générées pour Sentry, plus
      référencées dans le JS livré).

**Revue LLM** :

- [x] `npm run pentest:review` (`scripts/security-review.mjs`) : assemble le diff vs
      `origin/main` + la grille sécurité (10 axes : XSS, injection, secrets, SSRF proxy,
      contrôle d'accès vs RLS, CSRF, `target=_blank`, CSP, validation d'entrée, dépendance)
      dans `PENTEST_REVIEW.md` → tu lances `claude` dessus.
- [x] `npm run pentest:llm` (`scripts/llm-security-review.mjs`) : envoie le diff à **Gemini**
      (si `GEMINI_API_KEY`), sortie JSON `{severity,file,line,issue,fix}` → `reports/pentest-gemini.md`,
      exit 1 sur `critical`/`high`.
- [x] `.github/workflows/pentest.yml` (PR, **non bloquant**) : lance la revue Gemini si le
      secret existe → commentaire PR unique (mis à jour, pas dupliqué) + artefact. Job `dast`
      (ZAP baseline) en `workflow_dispatch` avec une `target_url` (preview réel), `.zap/rules.tsv`.
- **Politique** : findings déterministes bloquants ; revue LLM informative (au reviewer de
  trancher — évite qu'une hallucination LLM bloque le merge).
- **Reste** : revue Claude en CI (nécessiterait le token OAuth de V5) ; cron nocturne DAST
  contre la prod → à brancher quand un domaine stable existe ; fusion des rapports
  Claude+Gemini en un seul.
- **DoD atteint** : chaque PR passe le SAST OWASP + le scan bundle + l'audit d'en-têtes ;
  une revue LLM du diff est disponible (`pentest:review` toujours, Gemini si secret).

### V7 — Agent « tâches inhumaines » : revue de synchro hebdo — ✅ livré

Reproduit l'agent qui « lit toutes les branches, les résultats de tests, les commentaires de
PR/issues » pour préparer la réunion. Même schéma que V5/V6 : agrégation gratuite en CI,
synthèse par Gemini si secret, sinon par Claude Code en local.

- [x] `scripts/weekly-sync.mjs` (`npm run weekly-sync`) — agrège via `gh` + `git` :
      branches distantes (ahead/behind vs `main`, dernier auteur/date), PR ouvertes (review,
      mergeable, âge, nb de commentaires, labels), issues (dont `ai-fix`, issues « chaudes »
      ≥ 3 commentaires), échecs CI sur `main` sur 7 j, `npm audit --omit=dev`, couverture
      (instantané), rapports de simulation en attente. → `reports/weekly-sync-data.md`.
- [x] Synthèse : si `GEMINI_API_KEY` → `reports/weekly-sync-<date>.md` (**1 page**,
      « À discuter en réunion » / « Déjà réglé » / « Quick wins ») ; sinon
      `WEEKLY_SYNC_CONTEXT.md` (données + consigne) pour Claude Code.
- [x] `scripts/lib/gemini.mjs` — helper `askGemini()` partagé (pentest V6 refactoré dessus).
- [x] `.github/workflows/weekly-sync.yml` (`schedule` lundi 06:00 UTC + `workflow_dispatch`) :
      agrège, synthétise, publie dans une **issue épinglable** `weekly-sync` (créée puis
      éditée chaque semaine) + artefact.
- **Reste** : connecteurs Slack / Gmail (n8n) si l'équipe s'en sert ; tendances sur 7 j
  (couverture/bundle/Lighthouse) — aujourd'hui instantané seulement, l'historique
  demanderait de stocker les métriques quelque part.
- **DoD atteint** : `npm run weekly-sync` (ou le cron) produit un doc d'1 page qui pointe
  les PR qui traînent, les issues chaudes, les échecs CI — pas le bruit.

### V8 — Agents exploratoires à la demande _(~2 j + usage)_

« Teste juste pour voir, implémente A→Z, et donne-moi un audit de perf. »

- [ ] `.github/workflows/explore.yml` (`workflow_dispatch`, entrée = objectif) : crée une branche `explore/<slug>`, lance Claude Code, ouvre une **PR étiquetée `spike` (jamais mergée telle quelle)** avec :
  - le diff complet ;
  - un **rapport de perf comparatif** : bundle (size-limit diff), Lighthouse avant/après, k6 si pertinent, temps de build ;
  - une reco « on garde / on jette / à retravailler ».
- Cas d'usage prêts à l'emploi : _remplacer une lib_ (ex. `react-markdown` → alternative), _upgrade majeur React/Vite_, _migration incrémentale TS d'un module_, _déplacer `ai.js` entièrement derrière l'edge function (dette AD‑1)_.
- **Trigger** : manuel.
- **DoD** : décider d'une migration prend 1 run + 15 min de relecture, pas 2 semaines de dev.

### V9 — Décommission du legacy & dette technique _(continu)_

« En 2026, on ne fait plus tourner que du code produit en 2026. » — version Vibe Hub : plus de dette AD ouverte, plus de `data/courses.js`, plus d'appel Gemini navigateur.

- [ ] `scripts/tech-debt-inventory.mjs` : scanne `TODO|FIXME|@deprecated|LEGACY|AD-\d`, la carte du dépôt, les invariants de l'Architecture Spine → génère `reports/tech-debt.md` + ouvre/actualise un **GitHub Project** « Dette ».
- [ ] Pour chaque item : **tests de caractérisation** d'abord (on fige le comportement actuel), puis réécriture pilotée par agent encadrée par ces tests.
- [ ] Cible nommée n°1 : **AD‑1** — faire passer 100 % des appels Gemini par `supabase/functions/gemini-proxy`, supprimer la clé du bundle. (V6 le détecte déjà comme finding.)
- **Trigger** : inventaire mensuel (cron) + à la demande.
- **DoD** : le nombre d'invariants AD en dette décroît à chaque sprint ; `data/courses.js` supprimé.

### V10 — Observabilité comme oracle de test _(~2 j)_

« On a trouvé plein de failles que personne n'a jamais exploitées — c'est pas dans les logs, donc a priori c'est bon. » Sans logs, pas d'oracle.

- [ ] **Logging structuré** : compléter `src/lib/observability` — JSON, niveaux, `requestId`, jamais de PII ni de prompt complet.
- [ ] **Sentry** (ou équivalent) front + edge function : erreurs, `release` = tag release-please, source maps upload en CI (privées).
- [ ] **web-vitals** déjà présent → envoyer LCP/CLS/INP vers un endpoint (table Supabase `metrics` ou Vercel Analytics).
- [ ] **Alertes** : taux d'erreur proxy, quota Gemini proche, pic 4xx/5xx, régression web-vitals → canal d'équipe.
- [ ] Boucle : un rapport Sentry récurrent → issue `ai-fix` (réutilise V5).
- **Trigger** : runtime prod.
- **DoD** : toute erreur prod est tracée, corrélée à une release, et peut devenir un test.

---

## 4. Séquencement conseillé

```
Sprint 1 : V1 + V3        (contrats + mocks/régression — débloque tout le reste)
Sprint 2 : V2 + V6        (intégration réelle + pentest par PR)
Sprint 3 : V4 + V5        (simulation + boucle agent→issue→agent)
Sprint 4 : V7 + V10       (revue hebdo + observabilité)
Continu  : V8 (à la demande) · V9 (inventaire mensuel)
```

Dépendances dures : V5 a besoin de V4 **et** V3 (le correctif doit produire un test).
V6 nocturne et V10 alimentent V5. V7 consomme les artefacts de V2/V4/V6.

---

## 5. Nouveaux fichiers / workflows à créer

| Chemin                                                     | Rôle                                         | Vague |
| ---------------------------------------------------------- | -------------------------------------------- | ----- |
| `src/lib/schemas/*.js`                                     | schémas Zod des frontières                   | V1    |
| `src/lib/database.types.ts`                                | types Supabase générés                       | V1    |
| `src/test/integration/*.test.js`                           | tests contre Postgres réel                   | V2    |
| `src/test/mocks/{gemini,supabase}.js`, `mocks/scenarios/*` | MSW + fixtures déterministes                 | V3    |
| `scripts/new-regression-test.mjs`                          | scaffold « 1 bug = 1 test »                  | V3    |
| `src/test/simulation/*` + `scripts/simulate.mjs`           | injection de fautes seedée                   | V4    |
| `.github/workflows/simulation.yml`                         | job simulation + rapport                     | V4    |
| `.github/workflows/report-to-issue.yml`                    | échec CI → issue `ai-fix`                    | V5    |
| `.github/workflows/agent-fix.yml`                          | issue `ai-fix` → PR draft                    | V5    |
| `.github/workflows/pentest.yml`                            | SAST diff + DAST preview + revue LLM croisée | V6    |
| `.security/allowlist.yml`                                  | findings sécurité justifiés                  | V6    |
| `.github/workflows/weekly-sync.yml`                        | doc de préparation de réunion                | V7    |
| `.github/workflows/explore.yml`                            | agent exploratoire → PR `spike` + audit perf | V8    |
| `scripts/tech-debt-inventory.mjs`                          | inventaire dette → Project                   | V9    |
| `src/lib/observability/*`, config Sentry                   | logs + traces + alertes                      | V10   |

---

## 6. Garde-fous transverses (à faire une fois, tôt)

- **Branch protection** : `CI` requis, `pentest` requis, ≥1 review humaine, pas de merge auto pour les branches `ai-fix/*` et `explore/*`.
- **CODEOWNERS** : `supabase/migrations/`, `src/config/`, `.github/`, `docs/ai/` → relecture humaine obligatoire.
- **Budgets agents** : timeout + plafond tokens par workflow, `concurrency` pour éviter les runs parallèles coûteux, `paths-ignore` sur la doc.
- **Secrets** : les clés modèles (Anthropic, Gemini, Grok) en secrets GitHub scoping environnement `ci` ; jamais dans les logs (Gitleaks couvre déjà le repo).
- **Kill switch** : label `no-ai` sur une PR/issue = aucun agent ne la touche ; variable repo `AI_AUTOMATION_ENABLED`.
- **Revue trimestrielle** : « quels workflows on garde, lesquels on jette » — l'outillage IA se périme vite.

---

## 7. La règle d'or, appliquée

Chaque vague répond à _« comment détecter automatiquement une erreur générée par une IA le plus tôt possible ? »_ :

| Étage                      | Détecte quoi                                   | Latence         |
| -------------------------- | ---------------------------------------------- | --------------- |
| Zod / `tsc` (V1)           | mauvais type, réponse modèle malformée         | < 1 s (édition) |
| pre-commit / pre-push      | format, lint, tests unitaires                  | secondes        |
| CI fail-fast (existant)    | régression, couverture, budget bundle          | ~minutes        |
| Intégration réelle (V2)    | RLS cassée, contrat API rompu                  | ~minutes (PR)   |
| Simulation (V4)            | dégradation sous panne, non-déterminisme       | PR + nuit       |
| Pentest multi-modèles (V6) | faille sécurité dans le diff                   | PR + nuit       |
| Agent-fix (V5)             | transforme un échec en correctif proposé       | nuit            |
| Weekly sync (V7)           | tensions humaines, décisions d'archi en retard | hebdo           |
| Observabilité (V10)        | ce qui a quand même filtré en prod             | runtime         |
