# Politique de sécurité — Vibe Hub

## Signaler une vulnérabilité

**Ne pas ouvrir d'issue publique.**

- GitHub → onglet **Security** → **Report a vulnerability** (advisory privé), ou
- e-mail à l'équipe (voir `_bmad-output` / contact projet) avec `[SECURITY]` en objet.

Merci d'inclure : description, impact, étapes de reproduction, version/commit.
Réponse sous **72 h**, correctif coordonné avant divulgation.

## Périmètre

| Dans le périmètre                         | Hors périmètre                                                   |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `vibehub.fr` et ses sous-domaines de prod | Déploiements de preview / staging                                |
| Le code de ce dépôt                       | Dépendances tierces (→ leur mainteneur ; on suit via Dependabot) |
| Config Supabase (RLS, Edge Functions)     | Ingénierie sociale, accès physique, DDoS volumétrique            |

## Ce que le projet fait déjà

- **Analyse statique** : Semgrep (règles projet + registre) + CodeQL en CI, sur chaque PR.
- **Secrets** : gitleaks en CI (diff sur PR, historique complet sur `main`).
- **Dépendances** : Dependabot (hebdo, groupé) + `npm audit` bloquant (high/critical) en CI.
- **En-têtes HTTP** : CSP stricte, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` (`vercel.json`).
- **Validation d'entrée** centralisée (`src/lib/validation.js`).
- **Lint anti-patterns dangereux** : `eval` / `new Function` interdits, import SDK hors
  `services/` interdit, `target="_blank"` sans `noopener` interdit.

## Faiblesses connues (suivies)

| #   | Faille                                                             | Gravité    | Statut                                                                            |
| --- | ------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------- |
| S-1 | Clé Gemini inlinée dans le bundle (`VITE_GEMINI_API_KEY`)          | 🔴 élevée  | Correctif fourni : Edge Function `gemini-proxy`. **Révoquer la clé actuelle.**    |
| S-2 | Clé Gemini historique dans git (`test-gemini.js`, avant `51f61c7`) | 🟠 moyenne | Révoquer la clé ; envisager `git filter-repo` si le repo reste public             |
| S-3 | RLS Supabase non vérifiée depuis le code (aucune migration)        | 🟠 moyenne | Migration `supabase/migrations/0001` fournie — **appliquer + auditer l'existant** |
| S-4 | UI Builder : pas encore de sandbox (mais sortie mockée)            | 🟡 faible  | AD-5 — à traiter avant toute vraie génération                                     |

Détail et plan d'action : `docs/ai/security-rules.md` et `AUDIT_REPORT.md`.

## Gestion des secrets

- `.env` est git-ignoré. Modèle : `.env.example`.
- **Aucun secret** derrière un préfixe `VITE_` (inliné dans le bundle par Vite).
- La clé `anon` Supabase est **publique par conception** — la sécurité repose sur la RLS.
- La clé `service_role` ne doit **jamais** apparaître côté client (règle gitleaks dédiée).
- Secrets CI : GitHub Actions secrets. Secrets Edge Function : `supabase secrets set`.
