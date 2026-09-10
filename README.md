# Vibe Hub

Plateforme d'apprentissage IA pour designers UI/UX — landing page + workspace interactif.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS**
- **Lucide React** (icônes)

## Architecture

```
src/
├── components/
│   ├── landing/          # Sections de la landing page
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── SocialProof.jsx
│   │   ├── Programme.jsx
│   │   ├── APropos.jsx
│   │   ├── FAQ.jsx
│   │   └── Footer.jsx
│   └── workspace/        # Workspace interactif
│       ├── TopBar.jsx
│       ├── tabs/
│       │   ├── IATab.jsx       # Chat assistant IA
│       │   ├── ModulesTab.jsx  # Grille des cours
│       │   └── OutilsTab.jsx   # Générateur UI
│       └── modules/
│           ├── CourseCard.jsx
│           └── CourseDetail.jsx
├── data/
│   └── courses.js        # Données des cours et FAQs
├── lib/
│   └── routes.js         # Routes de l'app + helpers de liens (`/`, `/app`, `/admin`)
├── hooks/
│   └── useTypewriter.js  # Hook effet machine à écrire
├── pages/
│   ├── LandingPage.jsx
│   ├── WorkspacePage.jsx
│   └── AdminPage.jsx
├── App.jsx               # Router principal (résolution de la route au chargement)
├── main.jsx
└── index.css
```

## Routes

La landing et le logiciel sont **débranchés** : ce sont deux URLs distinctes, pas deux états
d'un même composant. Les CTA « Découvrir Vibe Hub » sont de vrais liens qui ouvrent le
logiciel dans un **nouvel onglet** (`target="_blank"` + `rel="noopener noreferrer"`), en
laissant la landing intacte dans l'onglet d'origine.

| URL                | Écran                                   |
| ------------------ | --------------------------------------- |
| `/`                | Landing page publique                   |
| `/app`             | Logiciel — onglet Assistant IA (défaut) |
| `/app?tab=modules` | Logiciel — onglet Cours                 |
| `/app?tab=outils`  | Logiciel — onglet Outils                |
| `/admin`           | Administration des cours                |

L'onglet actif du workspace est écrit dans l'URL (`history.replaceState`) : le lien reste
copiable et un rafraîchissement retombe sur le même onglet. Toutes ces routes se construisent
via `src/lib/routes.js` — ne pas écrire les chemins en dur dans les composants.

> **Déploiement (Vercel) :** ces routes sont résolues côté client. Sans réécriture côté
> serveur, un accès direct à `/app` ou `/admin` chercherait un fichier qui n'existe pas et
> renverrait un 404. Le `vercel.json` à la racine réécrit donc toute requête inconnue vers
> `index.html` — les fichiers statiques (`/assets/**`) restent servis normalement, les
> rewrites ne s'appliquant qu'après le check du système de fichiers. `npm run dev` et
> `npm run preview` le font déjà nativement.

## Installation & démarrage

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) dans ton navigateur.

## Scripts

| Commande             | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `npm run dev`        | Serveur de développement                                                 |
| `npm run build`      | Build de production                                                      |
| `npm run preview`    | Prévisualise le build                                                    |
| `npm run validate`   | format + lint + typecheck + couverture + build + budget bundle (= la CI) |
| `npm test`           | Tests unitaires + intégration (Vitest)                                   |
| `npm run test:cov`   | Idem + couverture (seuil 80 % bloquant)                                  |
| `npm run e2e`        | Tests end-to-end (Playwright)                                            |
| `npm run format`     | Formatage Prettier                                                       |
| `npm run lint`       | ESLint (0 warning toléré)                                                |
| `npm run typecheck`  | `tsc --noEmit` (fichiers `// @ts-check`)                                 |
| `npm run security:*` | `audit` · `semgrep` · `secrets`                                          |
| `npm run perf:*`     | `smoke` · `load` · `spike` · `stress` (k6 — voir `docs/perf/`)           |

## Industrialisation AI-First

Ce projet est outillé pour un développement assisté par IA de niveau production. Points d'entrée :

| Besoin                                                          | Fichier                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Contexte pour une IA (Claude, Cursor, Copilot, Codex, Windsurf) | `docs/ai/` · `CLAUDE.md` · `AGENTS.md`                                      |
| Contribuer                                                      | `CONTRIBUTING.md`                                                           |
| Sécurité (politique + guide + règles)                           | `SECURITY.md` · `docs/secure-coding-guide.md` · `docs/ai/security-rules.md` |
| Tests (unit / intég / e2e / charge)                             | `docs/ai/testing-rules.md` · `docs/perf/load-testing.md`                    |
| Audit complet + roadmap                                         | `AUDIT_REPORT.md` · `docs/ai/roadmap-automatisation.md`                     |
| Invariants d'architecture (AD-1..AD-6)                          | `docs/ai/architecture.md` (source : Architecture Spine BMAD)                |

**À faire en priorité** (cf. `AUDIT_REPORT.md` § plan de migration) : roter la clé Gemini,
auditer + appliquer la RLS Supabase (`supabase/migrations/`), déployer `gemini-proxy`,
optimiser les images `hero-collage` / `illustration-404`.

## Prochaines étapes produit

- [ ] Déployer `supabase/functions/gemini-proxy` et brancher l'IA réelle dessus (AD-1)
- [ ] Progression des cours persistée par utilisateur (aujourd'hui `localStorage`, FR-3)
- [ ] Passer `checkJs: true` puis migrer vers TypeScript
- [ ] UI Builder réel dans un iframe sandbox (AD-5)
