# Contexte projet — Vibe Hub

> Fichier lu en premier par toute IA (Claude Code, Cursor, Copilot, Codex, Windsurf).
> Objectif : comprendre en 2 minutes quoi, pour qui, avec quoi, et ce qu'il ne faut jamais casser.

## Le produit en une phrase

Plateforme d'apprentissage IA **pour designers UI/UX** (francophones) : une **landing page**
publique + un **workspace** interactif (catalogue de cours vidéo, assistant IA de rédaction de
prompts, générateur d'UI, boîte à outils avec liste d'attente).

## Utilisateurs

| Persona                    | Besoin                                                                     |
| -------------------------- | -------------------------------------------------------------------------- |
| Designer UI/UX (apprenant) | Se former à l'IA générative appliquée au design, à son rythme, sans coder  |
| Admin (l'équipe Vibe Hub)  | Gérer le catalogue de cours (CRUD), voir la demande sur les outils à venir |

## Stack (ne pas dévier sans mettre à jour l'Architecture Spine)

| Couche      | Choix                                                                     | Version |
| ----------- | ------------------------------------------------------------------------- | ------- |
| UI          | React (function components, `useState` local uniquement)                  | 18.3    |
| Build / dev | Vite                                                                      | 5.4     |
| Style       | Tailwind CSS 3 + design tokens (`tailwind.config.js`, `DESIGN_SYSTEM.md`) | 3.4     |
| Icônes      | lucide-react + Material Symbols (onglet Cours)                            | —       |
| Markdown    | react-markdown + remark-gfm                                               | 10 / 4  |
| Back-end    | Supabase (Postgres + Auth)                                                | 2.x     |
| IA          | Google Gemini (`gemini-2.5-flash-lite`)                                   | —       |
| Tests       | Vitest + Testing Library (unit/intég), Playwright (e2e), k6 (charge)      | —       |
| Hébergement | Vercel (statique + rewrites SPA), Supabase Edge Functions                 | —       |

**Pas de** : TypeScript (adoption incrémentale via `// @ts-check`), React Router (routage
maison `src/lib/routes.js`), state manager global (Redux/Zustand/Context-store), SSR.

## Carte du dépôt

```
src/
  config/env.js          Accès validé aux variables d'environnement (point unique)
  lib/                    Logique pure & sans dépendance : routes, validation, logger, observability
  hooks/                  useTypewriter…
  services/               SEULE couche autorisée à parler à un système externe (AD-2)
    supabase.js            courses, waitlist, wrappers auth
    ai.js                  appel Gemini (⚠️ dette AD-1 : passe par le navigateur aujourd'hui)
  components/
    ErrorBoundary.jsx      filet anti page blanche
    landing/               sections de la landing (FR-1)
    workspace/
      Sidebar.jsx
      tabs/                ModulesTab, IATab, OutilsTab, NotificationsTab
      modules/             CourseCard, CourseDetail
  pages/                  LandingPage, WorkspacePage, AdminPage, NotFoundPage
  data/courses.js         LEGACY — remplacé par Supabase, ne pas ré-alimenter

supabase/
  migrations/             RLS (AD-3) + get_waitlist_counts (AD-4)
  functions/gemini-proxy/ Edge Function cible pour AD-1 (à déployer)

scripts/perf/             Tests de charge/stress k6 (smoke, load, spike, stress)
e2e/                      Tests Playwright
docs/ai/                  CE DOSSIER — règles pour les IA
_bmad-output/             Artefacts de planification BMAD (PRD, UX, Architecture Spine) — source de vérité produit
```

## Documents de référence (au-delà de ce dossier)

- **Architecture Spine** : `_bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md` — les invariants AD-1..AD-6. **Autorité en cas de conflit d'architecture.**
- **PRD** : `_bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md` — les FR-1..FR-9.
- **Design system** : `DESIGN_SYSTEM.md` + `tailwind.config.js`.
- **Diagnostic RGAA** : `docs/diagnostic-rgaa.md` — l'accessibilité est un objectif produit, pas un bonus.

## Règle d'or

> **« Comment détecter automatiquement une erreur générée par une IA le plus tôt possible ? »**

Chaque contribution privilégie : feedback rapide · automatisation · type-safety (`// @ts-check`) ·
tests · sécurité · observabilité · reproductibilité. Voir les autres fichiers de ce dossier.
