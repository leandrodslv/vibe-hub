# Architecture — Vibe Hub

> Résumé opérationnel. La **source de vérité** est l'Architecture Spine :
> `_bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md`.
> En cas de contradiction sur un point d'architecture, **la Spine tranche**.

## Paradigme : couches fines, une seule direction de dépendance

```
Presentation            Service Adapters              External Systems
src/pages/, components/  src/services/*.js             Supabase (PG + Auth)
  (React, useState local)  (seul importateur de SDK)   Edge Function gemini-proxy
        │                        │                      Gemini API
        └────────────►───────────┴────────────►─────────
```

Un composant **n'importe jamais** `@supabase/supabase-js` ni `@google/generative-ai`.
Il appelle une fonction de `src/services/`. (ESLint `no-restricted-imports` + règle Semgrep
`external-sdk-import-outside-services` le vérifient.)

## Les 6 invariants (AD-1 … AD-6)

| #        | Invariant                                                                                                          | État                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **AD-1** | Les appels Gemini ne tournent **jamais** côté navigateur (clé exposée)                                             | ⚠️ **violé** — `services/ai.js` appelle Gemini depuis le front. Cible : `supabase/functions/gemini-proxy`. |
| **AD-2** | Seuls `src/services/*` importent un SDK externe / parlent à un système externe                                     | ✅ appliqué (`AdminPage` migré vers les wrappers `signIn/signOut/getSession/onAuthChange`)                 |
| **AD-3** | L'autorité d'écriture sur `courses` / `waitlist` = RLS Postgres, pas le React                                      | 🟡 migration fournie (`supabase/migrations/0001`), **à appliquer + auditer l'existant**                    |
| **AD-4** | La demande waitlist se lit via un **agrégat** (`get_waitlist_counts`), jamais les lignes brutes                    | 🟡 fonction fournie, `getWaitlistCounts()` à ajouter dans `services/supabase.js`                           |
| **AD-5** | Le code généré par l'IA ne s'affiche que dans un **iframe sandbox** isolé                                          | 🟡 UI Builder encore mocké ; `isAllowedVideoUrl` déjà en place pour les embeds cours                       |
| **AD-6** | Deux tiers de persistance : Supabase (durable/partagé) · `localStorage` préfixé (`ai_*`, `progress_*`) — pas de 3ᵉ | ✅ respecté                                                                                                |

## Conventions structurantes

- **Erreurs de service** : les fonctions de `services/*` **lèvent** par défaut. Exception unique
  sanctionnée : `addToWaitlist` renvoie `{ success } | { duplicate } | { error }` parce que
  l'appelant doit distinguer le doublon. Ne pas introduire une 3ᵉ forme.
- **Tri des cours** : `order_index` est le **seul** ordre canonique partout. `created_at` n'est
  jamais une clé de tri.
- **Session IA** : un objet session porte `projectId` (session → projet, sens unique). Jamais
  l'inverse.
- **Env** : tout `VITE_*` est **public** (inliné par Vite). Un secret ne passe jamais par un
  `VITE_*`. Accès uniquement via `src/config/env.js`.
- **Routage** : `/`, `/app`, `/admin` sont des documents distincts résolus par
  `src/lib/routes.js`. Les liens vers `/app` depuis la landing s'ouvrent dans un nouvel onglet
  avec `NOUVEL_ONGLET` (`target=_blank` + `rel="noopener noreferrer"`). Ne jamais écrire un
  chemin en dur dans un composant.

## Observabilité (nouveau — cf. deployment-rules.md)

- `src/lib/logger.js` — log structuré JSON, caviarde les clés sensibles, `setLogSink()` pour
  brancher Sentry/Logtail plus tard.
- `src/lib/observability.js` — Core Web Vitals + `window.onerror` + `unhandledrejection`.
- `src/components/ErrorBoundary.jsx` — enveloppe `<App/>` dans `main.jsx`.

## Dette architecturale suivie

1. **AD-1** — proxy Gemini à déployer (priorité sécurité #1).
2. **AD-3/AD-4** — appliquer les migrations RLS et auditer le projet Supabase réel.
3. **AD-5** — vrai runtime sandbox pour l'UI Builder (choix de lib différé, cf. Spine § Deferred).
4. Vite 5.4 / Tailwind 3 — bumps de version à planifier (non bloquant).
