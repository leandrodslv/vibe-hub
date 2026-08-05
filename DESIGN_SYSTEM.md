# Design System — Vibe Hub

> Référence unique pour tous les tokens, composants et patterns du projet.  
> Stack : **React 18 + Vite + Tailwind CSS 3**

---

## 1. Typographie

### Police

| Rôle | Famille | Import |
|------|---------|--------|
| Globale | **Inter** | Google Fonts — weights 400 500 600 700 800 |

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
body { font-family: 'Inter', sans-serif; }
```

### Échelle de taille

| Usage | Classe Tailwind | Valeur |
|-------|----------------|--------|
| Hero H1 (landing) | `text-6xl md:text-[88px]` | 60 → 88 px |
| H1 section | `text-[32px]` | 32 px |
| H1 workspace | `text-[22px]` | 22 px |
| H2 card | `text-xl` / `text-lg` | 20 / 18 px |
| H3 card | `text-[15px]` | 15 px |
| Body | `text-[15px]` | 15 px |
| Body small | `text-[13px]` | 13 px |
| Label / meta | `text-[11px]` | 11 px |
| Tag / badge | `text-[10px]` | 10 px |

### Poids

| Usage | Classe |
|-------|--------|
| Titres principaux | `font-extrabold` (800) |
| Titres secondaires | `font-bold` (700) |
| Éléments interactifs | `font-semibold` (600) |
| Corps de texte | `font-medium` (500) |
| Texte courant | `font-normal` (400) |

### Tracking spécial

| Usage | Classe |
|-------|--------|
| Hero H1 | `tracking-tighter` |
| Labels uppercase | `tracking-widest` ou `tracking-wider` |
| Texte courant | aucun |

---

## 2. Couleurs

> Le projet est **monochrome** : noir, blanc, gris. Les gradients colorés sont réservés aux icônes d'outils.

### Palette principale

| Token | Hex | Usage |
|-------|-----|-------|
| **Noir** | `#000000` / `black` | Texte principal, CTA, actifs |
| **Gris foncé** | `#333333` | Hover des CTA noirs |
| **Gris texte** | `#666666` | Texte secondaire, liens nav |
| **Gris muted** | `#999999` | Placeholder, labels discrets |
| **Blanc** | `#FFFFFF` / `white` | Cartes, inputs, fonds |
| **Fond landing** | `#F9F9F9` | Background page landing |
| **Fond workspace** | `#FAFAFA` | Background panneaux |
| **Fond input** | `#F4F4F4` | Inputs, badges, muted bg |
| **Bordure principale** | `#EAEAEA` | Toutes les bordures standard |
| **Bordure hover** | `#CCCCCC` | Bordure au survol |
| **Bordure dashed** | `#D4D4D4` | Zones dashed / vides |

### Sélection texte (global)

```css
selection:bg-black selection:text-white
```

### Gradients icônes (outils uniquement)

| Outil | Classes Tailwind |
|-------|-----------------|
| UI Builder | `from-blue-500 to-indigo-600` |
| Code Auditor | `from-emerald-500 to-teal-600` |
| Content Writer | `from-orange-500 to-rose-500` |
| Color Studio | `from-violet-500 to-purple-600` |
| Vision Lens | `from-sky-500 to-blue-600` |

---

## 3. Espacement & Layout

### Containers

| Contexte | Classes |
|----------|---------|
| Landing (large) | `max-w-7xl mx-auto px-6` |
| Landing (contenu) | `max-w-5xl mx-auto` |
| Texte lisible | `max-w-2xl mx-auto` |

### Grille workspace

| Breakpoint | Colonnes |
|-----------|----------|
| Mobile | `grid-cols-1` |
| Tablette `md` | `grid-cols-2` |
| Desktop `lg` | `grid-cols-3` |
| Large `xl` | `grid-cols-4` (modules) |

### Hauteurs fixes

| Élément | Valeur |
|---------|--------|
| Navbar landing | `h-20` |
| TopBar workspace | `h-14` |
| Barre outil interne | `h-[52px]` |
| Prompt input bar | `h-16` |

---

## 4. Border Radius

| Usage | Classe | Valeur |
|-------|--------|--------|
| Boutons, inputs | `rounded-lg` | 8 px |
| Inputs, petites cartes | `rounded-xl` | 12 px |
| Cartes, panneaux | `rounded-2xl` | 16 px |
| Grandes icônes | `rounded-3xl` | 24 px |
| Pills / badges | `rounded-full` | 9999 px |
| Icône outil (header) | `rounded-lg` | 8 px |
| Icône outil (card) | `rounded-xl` | 12 px |

---

## 5. Ombres

| Usage | Classes Tailwind |
|-------|-----------------|
| Carte hero/mockup | `shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)]` |
| Carte au survol | `hover:shadow-xl hover:shadow-black/5` |
| Prompt bar active | `shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]` |
| Prompt bar repos | `shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]` |
| Icône outil (card) | `shadow-lg shadow-{color}-500/20` |
| Bouton CTA | `shadow-lg shadow-black/10` |
| Petite carte | `shadow-sm` |

---

## 6. Composants

### Bouton primaire (CTA)

```jsx
<button className="bg-black text-white text-[14px] font-semibold px-6 py-2.5 rounded-xl hover:bg-[#333] transition-all active:scale-95 shadow-lg shadow-black/10 cursor-pointer">
  Label
</button>
```

### Bouton secondaire (texte)

```jsx
<button className="text-sm font-semibold text-[#666] hover:text-black transition-colors cursor-pointer">
  Label
</button>
```

### Bouton ghost (retour / nav)

```jsx
<button className="flex items-center gap-1.5 text-[#666] hover:text-black font-semibold text-[13px] bg-[#F4F4F4] hover:bg-[#EAEAEA] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
  <ChevronLeft className="w-3.5 h-3.5" /> Label
</button>
```

### Input texte

```jsx
<input
  className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-black transition-all placeholder:text-[#999] text-black"
/>
```

### Input avec icône gauche

```jsx
<div className="relative">
  <Search className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  <input className="... pl-10" />
</div>
```

### Carte standard

```jsx
<div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm">
  {/* contenu */}
</div>
```

### Carte interactive (hover)

```jsx
<button className="group bg-white border border-[#EAEAEA] rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 hover:border-[#CCCCCC] cursor-pointer">
  {/* contenu */}
</button>
```

### Badge / Tag

```jsx
<span className="text-[10px] font-bold uppercase tracking-wider text-[#999] bg-[#F4F4F4] px-2 py-0.5 rounded">
  Label
</span>
```

### Badge pill (status)

```jsx
{/* Live */}
<div className="flex items-center gap-1.5 bg-[#F4F4F4] border border-[#EAEAEA] px-2 py-0.5 rounded-full">
  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
  <span className="text-[10px] font-bold text-black">Live</span>
</div>

{/* Bientôt / Beta */}
<span className="text-[10px] font-bold text-[#999] uppercase tracking-wider bg-[#F4F4F4] px-2.5 py-1 rounded-full">
  Bientôt
</span>
```

### Onglets workspace (pill)

```jsx
<div className="flex items-center bg-[#F4F4F4] p-1 rounded-full gap-1">
  <button className="px-6 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 bg-white shadow-sm text-black">
    Actif
  </button>
  <button className="px-6 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 text-[#666] hover:text-black">
    Inactif
  </button>
</div>
```

### Onglets avec underline (filtres)

```jsx
<div className="flex items-center gap-1 border-b border-[#EAEAEA]">
  {/* Actif */}
  <button className="px-3 py-2.5 text-[13px] font-semibold border-b-2 border-black text-black -mb-px cursor-pointer">
    Tous
  </button>
  {/* Inactif */}
  <button className="px-3 py-2.5 text-[13px] font-semibold border-b-2 border-transparent text-[#666] hover:text-black -mb-px cursor-pointer">
    Design
  </button>
</div>
```

### Séparateur vertical

```jsx
<div className="w-px h-5 bg-[#EAEAEA]" />
```

### Panneau workspace (conteneur principal)

```jsx
<div className="flex-1 flex flex-col h-full bg-[#FAFAFA] rounded-2xl overflow-hidden border border-[#EAEAEA] shadow-sm">
  {/* contenu */}
</div>
```

---

## 7. Animations & Transitions

### Transitions standard

| Usage | Classe |
|-------|--------|
| Couleur | `transition-colors duration-200` |
| Tout (hover cards) | `transition-all duration-300` |
| Transform (icône) | `transition-transform duration-300` |

### Micro-interactions hover

| Effet | Classe |
|-------|--------|
| Élévation carte | `hover:-translate-y-0.5` ou `hover:-translate-y-1` |
| Scale icône | `group-hover:scale-105` |
| Scale bouton CTA | `hover:scale-[1.02]` |
| Press bouton | `active:scale-95` |

### Animations globales

| Nom | Description | Durée |
|-----|-------------|-------|
| `animate-mouse` | Floating mouse cursor (hero) | 6s ease-in-out infinite |
| `animate-spin` | Spinner de chargement | — |
| `animate-pulse` | Dot pulsant (badge Live) | — |
| `animate-in fade-in` | Apparition de vue | `duration-500` |

### Scroll reveal (landing)

```js
// Classes initiales sur les éléments
className="reveal opacity-0 translate-y-12 transition-all duration-700"
// Ajoutées par IntersectionObserver quand visible
classList.add('opacity-100', 'translate-y-0')
```

---

## 8. Icônes

**Librairie** : [Lucide React](https://lucide.dev)

### Tailles standard

| Contexte | Classe |
|----------|--------|
| Icône inline texte | `w-4 h-4` |
| Icône bouton/nav | `w-4 h-4` ou `w-5 h-5` |
| Icône card header | `w-5 h-5` |
| Icône grande (outil) | `w-9 h-9` |
| Icône hero / coming soon | `w-6 h-6` ou `w-8 h-8` |

### Règle absolue

- Toujours des **icônes SVG** (Lucide). Jamais d'émojis comme icônes UI.

---

## 9. Navbar landing

- Position : `fixed top-0 w-full z-50`
- Fond : `bg-[#F9F9F9]/80 backdrop-blur-md`
- Bordure : `border-b border-[#EAEAEA]/50`
- Hauteur : `h-20`
- Logo : `text-xl font-extrabold tracking-tight`
- Liens : `text-[15px] font-medium text-[#666] hover:text-black`
- CTA : bouton primaire `rounded-lg`

---

## 10. Accessibilité

| Règle | Application |
|-------|-------------|
| `cursor-pointer` | Sur **tous** les éléments cliquables |
| `aria-label` | Sur les boutons icône sans texte |
| Contraste texte | Minimum 4.5:1 — `#666` sur blanc = ✓ |
| Focus | `outline-none focus:border-black` sur les inputs |
| `disabled` | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Motion | Pas d'animation décorative infinie (sauf `.animate-mouse` hero) |

---

## 11. Structure de fichiers

```
src/
├── index.css                  ← Police + directives Tailwind + keyframes
├── App.jsx                    ← Routing landing ↔ workspace
├── pages/
│   ├── LandingPage.jsx
│   └── WorkspacePage.jsx
├── components/
│   ├── landing/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── SocialProof.jsx
│   │   ├── Programme.jsx
│   │   ├── APropos.jsx
│   │   ├── FAQ.jsx
│   │   └── Footer.jsx
│   └── workspace/
│       ├── TopBar.jsx
│       ├── tabs/
│       │   ├── IATab.jsx
│       │   ├── ModulesTab.jsx
│       │   └── OutilsTab.jsx
│       └── modules/
│           ├── CourseCard.jsx
│           └── CourseDetail.jsx
├── services/
│   └── ai.js                  ← Gemini API
├── data/
│   └── courses.js
└── hooks/
    └── useTypewriter.js
```

---

## 12. Do / Don't

| ✅ Do | ❌ Don't |
|-------|---------|
| Utiliser les tokens hexadécimaux définis | Inventer de nouvelles couleurs |
| Icônes Lucide SVG | Émojis comme icônes |
| `cursor-pointer` sur tout ce qui est cliquable | Laisser le curseur par défaut |
| Gradients uniquement sur les icônes d'outils | Gradients sur les fonds de page |
| Transitions `duration-200` à `duration-300` | Transitions > 500ms |
| `rounded-2xl` pour les cartes | Mélanger les radius aléatoirement |
| Texte secondaire en `#666` minimum | `#999` pour du texte de corps |
