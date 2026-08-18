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

| URL | Écran |
|---|---|
| `/` | Landing page publique |
| `/app` | Logiciel — onglet Assistant IA (défaut) |
| `/app?tab=modules` | Logiciel — onglet Cours |
| `/app?tab=outils` | Logiciel — onglet Outils |
| `/admin` | Administration des cours |

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

| Commande | Description |
|---|---|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build de production |

## Prochaines étapes suggérées

- [ ] Passer à React Router si le besoin de routes imbriquées apparaît (routage maison pour l'instant, cf. `src/lib/routes.js`)
- [ ] Connecter un vrai backend (Supabase, Firebase) pour la progression des cours
- [ ] Brancher l'IA réelle sur l'onglet IA (Anthropic API / OpenAI)
- [ ] Ajouter TypeScript
- [ ] Implémenter l'authentification
