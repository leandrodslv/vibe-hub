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
├── hooks/
│   └── useTypewriter.js  # Hook effet machine à écrire
├── pages/
│   ├── LandingPage.jsx
│   └── WorkspacePage.jsx
├── App.jsx               # Router principal (landing ↔ workspace)
├── main.jsx
└── index.css
```

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

- [ ] Ajouter React Router pour des URLs propres (`/`, `/workspace`)
- [ ] Connecter un vrai backend (Supabase, Firebase) pour la progression des cours
- [ ] Brancher l'IA réelle sur l'onglet IA (Anthropic API / OpenAI)
- [ ] Ajouter TypeScript
- [ ] Implémenter l'authentification
