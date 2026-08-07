# Diagnostic d'accessibilité numérique — RGAA

**Produit** : Vibe Hub
**Date du diagnostic** : 07/08/2026
**Périmètre audité** : Landing Page (`/`), Workspace (onglets IA, Modules, Outils), Admin (`/admin`)
**Version auditée** : branche `main`, commit `d3abd30`

---

> ## ⚠️ Mise à jour — 07/08/2026 : Landing Page corrigée
>
> **La grille ci-dessous décrit l'état initial.** Les correctifs de la Landing Page ont depuis été appliqués et vérifiés :
>
> - **Lighthouse Accessibilité : 93 → 100 / 100**, aucun audit échoué
> - **axe-core : 3 violations → 0**
> - **Cibles tactiles sous 44 px : 4 → 0**
> - Lien d'évitement ajouté (1er élément tabulable), `<main>` en place, menu mobile fonctionnel sous 768 px
> - `prefers-reduced-motion` respecté : 2 animations infinies → 0, `scroll-behavior: auto`
> - **Plan du site ajouté** dans le pied de page (`<nav aria-labelledby>`, 3 rubriques / 9 entrées, dont les 3 espaces applicatifs) → **2 moyens de navigation**, critère levé
>
> **Non-conformité résiduelle assumée** : « Mentions légales » et « Confidentialité » restent en `href="#"` (RGAA 6.1) — décision produit, les pages n'existent pas encore. Remplacer les deux `#` par les URLs réelles suffit à lever le point.
>
> Les vues **Workspace** et **Admin** n'ont pas été modifiées : les constats et le plan d'action les concernant restent valables en l'état.

---

## Légende

- 🟩 OUI — conforme
- 🟥 NON — non conforme
- 🟦 PARTIELLEMENT — conforme sur une partie du périmètre seulement
- ⬜ Non concerné (test grisé)

---

## Scores

### Score Lighthouse « Accessibilité »

| Page | Score | Audits échoués |
|---|---|---|
| Landing Page `/` | **93 / 100** | `color-contrast`, `landmark-one-main` |
| Admin `/admin` | **65 / 100** | `button-name`, `color-contrast`, `landmark-one-main`, `target-size` |
| Workspace (IA / Modules / Outils) | *non mesurable* | Vue non adressable par URL (état React interne) — auditée via axe-core à la place |

> ⚠️ **Le score Lighthouse de 93 est trompeur.** Lighthouse n'automatise qu'environ 30 % des critères RGAA et ne teste ni la navigation clavier réelle, ni le comportement des modales, ni le zoom, ni la pertinence des alternatives. Les 10 audits « manuels » que Lighthouse laisse non notés (`focusable-controls`, `focus-traps`, `managed-focus`, `custom-controls-labels`, `custom-controls-roles`…) sont précisément ceux qui échouent sur ce projet.

### Score du diagnostic

# **D**

**Justification** : 4 des 6 catégories bloquantes sont en échec (*Couleur non informative*, *Responsive*, *Navigation clavier*, *Lecteur d'écran*), et 2 sont partielles (*Zoom 200 %*, *Alternatives textuelles*). La Landing Page est de bonne facture (anneaux de focus explicites, ordre de tabulation logique, alternatives correctes) ; c'est le Workspace et l'Admin — développés sans design system ni conventions d'accessibilité — qui font chuter la note.

---

## Méthodologie

| Outil | Usage |
|---|---|
| Lighthouse 13.x (Chromium headless) | Score accessibilité par page |
| axe-core 4.13 (via Playwright) | Détection automatique sur les 5 vues |
| Script Playwright dédié | Ordre de tabulation, visibilité du focus, piège de focus des modales, cibles tactiles, débordement à 320 px / zoom 200 %, `prefers-reduced-motion`, espacement texte WCAG 1.4.12 |
| Calcul WCAG des ratios de contraste | 42 paires couleur texte/fond et bordure/fond du design system et des couleurs codées en dur |
| Revue de code | `src/components/**`, `src/pages/**`, `index.html`, `tailwind.config.js` |

Les tests **lecteur d'écran réel** (NVDA/JAWS/VoiceOver), **loupe Windows** et **validation éditoriale des contenus** restent à réaliser manuellement — ils sont signalés comme tels dans la grille.

---

## Grille d'analyse

### Contraste couleurs — *Design*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Contraste texte / arrière-plan ≥ 4,5:1 (ou 3:1 si > 24px regular / 18,5px bold) | | | ✓ | **Landing conforme** : `on-surface` 16,4:1 ; `on-surface-variant` 8,9:1 ; `primary` sur `surface` 6,4:1. **Échecs** : pied de page `text-on-primary/70` sur `primary` = **4,12:1** en 13px (© + « Mentions légales » + « Confidentialité »). **Workspace/Admin** : `#999999` sur blanc = **2,85:1** (« Workspace Beta », « Mes Projets », tags des cartes Outils, « Admin ») ; `#999` sur `#F4F4F4` = **2,59:1** (placeholders) ; `#CCCCCC` sur blanc = **1,61:1** (« Aucun projet », placeholders Admin). 21 occurrences détectées par axe. → Remonter `#999999` à `#6B6B6B` min. et `#CCCCCC` à `#767676` ; passer le pied de page à `/85`. |
| Contraste des éléments d'interface ≥ 3:1 | | ✓ | | **Aucune bordure d'élément interactif n'atteint 3:1.** Bordures de champs et de cartes `#EAEAEA` sur blanc = **1,20:1** ; bordure au focus `#CCCCCC` = **1,61:1** ; `surface-variant` (cartes FAQ) = **1,29:1** ; `outline-variant` = **1,70:1** ; bordure d'erreur `red-400` = **2,77:1**. → Réserver `#EAEAEA` aux séparateurs décoratifs et utiliser `#767676` minimum pour toute bordure qui *délimite* un champ ou un contrôle. |

### Couleur non informative *(bloquant si KO)* — *Design*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| L'information n'est pas véhiculée uniquement par la couleur | | ✓ | | **Bloquant.** (1) Onglets IA / Modules / Outils ([TopBar.jsx:17-27](src/components/workspace/TopBar.jsx#L17-L27)) : l'onglet actif se distingue **uniquement** par un fond blanc — vérifié : aucun `role`, `aria-selected` ni `aria-current`. (2) Sélecteur de couleur de projet ([IATab.jsx:729-736](src/components/workspace/tabs/IATab.jsx#L729-L736)) : **8 boutons sans aucun texte ni nom accessible**, l'information est 100 % chromatique. (3) Filtres de catégorie Outils, badges « Live », état publié/brouillon Admin. → Ajouter `role="tab"`/`aria-selected`, un `aria-label` sur chaque pastille et une coche sur la couleur sélectionnée. |
| Liens texte distinguables autrement que par la couleur | | | ✓ | Peu de liens en ligne dans du texte courant. Le lien « Accueil » porte un `border-b-4` (OK). Les liens du pied de page ne se distinguent que par la couleur au repos. |
| Boutons et éléments interactifs distinguables autrement que par la couleur | ✓ | | | Forme (pilule / rectangle arrondi), libellé explicite, ombre portée, position. Conforme. |
| Le focus est différencié autrement que par la couleur | | ✓ | | **Landing : conforme** (anneau `focus-visible:ring-2` — ajout de forme). **Workspace / Admin : non conforme.** Les champs utilisent `outline-none` (Tailwind ⇒ `outline: 2px solid transparent`, vérifié au runtime) et n'indiquent le focus **que** par un changement de couleur de bordure `#EAEAEA` → noir. → Remplacer par `focus-visible:ring-2 ring-offset-2`. |

### Taille et affichage du texte au zoom 200 % *(bloquant si KO)* — *Design*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Le texte s'agrandit bien | ✓ | | | Testé à 200 % (viewport logique 720 px). Aucune taille figée en `!important`, pas de `max-height` sur les blocs de texte courant. *À confirmer à la loupe Windows.* |
| Les textes ne se chevauchent pas | | | ✓ | **Landing : OK.** **Workspace : à risque** — `h-screen` + `overflow-hidden` sur le conteneur ([WorkspacePage.jsx:11](src/pages/WorkspacePage.jsx#L11)) et modale Compétences en `h-[80vh]` avec colonnes `w-1/3`/`w-2/3` non responsives ([IATab.jsx:769](src/components/workspace/tabs/IATab.jsx#L769)). |
| Redimensionnement sans perte de contenu / fonctionnalité | | | ✓ | **Landing : OK** (vérifié). **Workspace : perte de contenu** — la coque `overflow-hidden` coupe le contenu au lieu de le rendre défilable. → Passer le shell en `min-h-screen` + `overflow-auto`. |
| Augmentation des espacements texte sans perte | ✓ | | | Testé avec les valeurs WCAG 1.4.12 (`line-height:1.5`, `letter-spacing:.12em`, `word-spacing:.16em`, `margin-bottom:2em`) : aucun rognage, y compris sur le panneau FAQ `max-h-40` (scrollHeight 152 px = clientHeight). |
| Pas de défilement horizontal | ✓ | | | Vérifié à 1440 px, 720 px (zoom 200 %) et 320 px : `scrollWidth == clientWidth` dans les trois cas. |

### 2 moyens de navigation a minima — *Design*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Au moins 2 parmi : menu principal, plan de site, moteur de recherche global | | ✓ | | **Un seul moyen** : le menu principal (3 ancres), et il disparaît en dessous de 768 px. Pas de plan de site. Les champs « Rechercher… » du Workspace filtrent une liste locale, ce n'est pas un moteur de recherche global. → Ajouter un plan de site, ou une recherche transverse modules + outils + conversations. |

### Responsive *(bloquant si KO)* — *Design*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Éviter le scroll horizontal | | | ✓ | Aucun scroll horizontal mesuré. **Mais** sur le Workspace à 320 px, l'absence de scroll s'explique par `overflow-hidden` qui **rogne** le contenu : la barre d'onglets déborde jusqu'à x=429 px pour un viewport de 320 px. Contenu perdu plutôt que défilable. |
| Tous contenus / fonctionnalités disponibles en 320×256 | | ✓ | | **Bloquant.** (1) **La navigation principale disparaît totalement sur mobile** : liens et CTA sont en `hidden md:flex` ([Navbar.jsx:11,62](src/components/landing/Navbar.jsx#L11)) sans menu burger de remplacement — vérifié : `[]` élément de navigation visible à 320 px. (2) Le Workspace est inutilisable : barre d'onglets tronquée, barre latérale IA figée à `w-64` (256 px sur 320). → Ajouter un menu mobile ; rendre la barre latérale repliable. |
| Zones d'interaction tactiles ≥ 44×44 px | | ✓ | | Mesuré au runtime : **Landing 4 cibles sous-dimensionnées** (liens de nav 53×32, 61×24, 42×24 ; CTA 214×**40**) ; **Workspace 17 cibles** (boutons Renommer/Supprimer **22×22**, onglets 61×**32**, joindre/envoyer 40×40) ; **Admin 4 cibles** (bouton œil du mot de passe **16×16**). Confirmé par l'audit `target-size` de Lighthouse. |

### Contrôle utilisateur — *Design / Développement*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Bouton de contrôle de la vitesse de lecture / d'affichage, correctement retranscrit | | ✓ | | Plusieurs animations **infinies sans mécanisme de pause** : halos `animate-pulse` du hero, points `animate-bounce` de l'IA, spinners `animate-spin`, champ de confettis du pied de page. Le pied de page respecte `prefers-reduced-motion` (bon point), **mais pas le reste** : test avec `reducedMotion: reduce` → **2 animations infinies toujours actives** et `scroll-behavior: smooth` non désactivé. → Ajouter un bloc global `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } html { scroll-behavior: auto; } }` dans [index.css](src/index.css). |
| Audio et vidéo contrôlables au clavier | | | ✓ | `<video controls>` et l'iframe YouTube (avec `title`) sont pilotables au clavier. **Mais** le faux lecteur affiché en l'absence de vidéo est un `<div onClick>` non focusable ([CourseDetail.jsx:150-153](src/components/workspace/modules/CourseDetail.jsx#L150-L153)). |
| Le son ne démarre pas seul | ✓ | | | Aucun autoplay ; l'embed YouTube n'utilise pas `autoplay=1`. |
| Fenêtres : informer, ne rien imposer, garder le contrôle | | | ✓ | Les 5 modales ne sont pas annoncées (`role="dialog"`/`aria-modal` absents — vérifié), le focus n'est pas déplacé à l'ouverture ni restitué à la fermeture, et **Échap ne ferme pas** les modales Projet et Compétences ([IATab.jsx:710,767](src/components/workspace/tabs/IATab.jsx#L710)) — vérifié au runtime. Les modales Admin et Notification gèrent Échap (OK). |

### Navigation clavier *(bloquant si KO)* — *Développement*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| La prise de focus est visible | | | ✓ | **Landing : 14 / 14 éléments avec anneau de focus visible** (vérifié par parcours Tab complet) — très bon. **Workspace / Admin : champs sans indicateur** (`outline: 2px solid transparent` mesuré sur `<textarea>` du chat et `<input>` du mot de passe). |
| L'ordre de tabulation est logique et suit l'ordre de lecture | ✓ | | | Parcours Tab de la Landing vérifié : 14 arrêts, coordonnée `y` strictement croissante (24 → 2886), aucun `tabindex` positif dans le code. |
| Un lien d'évitement est présent | | ✓ | | **Absent sur les 4 vues.** Vérifié : le premier élément tabulable de la Landing est le lien « Accueil ». → Ajouter un « Aller au contenu principal » en première position, visible au focus. |
| Il est toujours possible de sortir d'une zone au clavier | | | ✓ | Aucun piège de focus (20 éléments restent focusables *derrière* les modales — c'est le défaut inverse, également non conforme : le focus s'échappe vers le contenu masqué). Le menu « slash » ne se ferme pas à Échap et n'est pas navigable aux flèches. |
| Le fonctionnement au clavier seul est « comme à la souris » | | ✓ | | **Bloquant.** Éléments cliquables non atteignables au clavier : cartes de module `<div onClick>` ([CourseCard.jsx:13-15](src/components/workspace/modules/CourseCard.jsx#L13-L15)) — c'est **le seul moyen d'ouvrir un cours** ; overlay du lecteur vidéo ([CourseDetail.jsx:150](src/components/workspace/modules/CourseDetail.jsx#L150)) ; lignes « Fichiers à télécharger » (`cursor-pointer` sans handler). Le menu « slash » ne se sélectionne qu'à la souris. → Remplacer ces `<div onClick>` par des `<button>`. |

### Lecteur d'écran *(bloquant si KO)* — *Développement*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| La page est utilisable avec un lecteur d'écran | | ✓ | | **Bloquant.** **Aucun `<main>` sur les 4 vues** (Lighthouse `landmark-one-main` + axe). Sur la Landing, **16 blocs de contenu sont hors landmark**. Le Workspace n'a strictement aucun repère (`main=0 nav=0 header=0 footer=0`). Le hero utilise `<header>` alors qu'il s'agit d'une section, pas d'une bannière. *Test NVDA/VoiceOver réel restant à faire.* |
| Pas d'incohérence dans l'ordre des titres | | ✓ | | Voir la section « Donner un titre aux rubriques » ci-dessous. |
| Labels des liens, boutons, consignes explicites | | ✓ | | **Boutons sans nom accessible** (axe `button-name`, critique) : bouton d'envoi du chat ([IATab.jsx:697-703](src/components/workspace/tabs/IATab.jsx#L697-L703)), bascule d'affichage du mot de passe ([AdminPage.jsx:105-111](src/pages/AdminPage.jsx#L105-L111)), croix de fermeture des modales IA, 8 pastilles de couleur, boutons Modifier/Supprimer d'une ligne de cours. Les onglets ne communiquent pas leur état. |
| Textes alternatifs pertinents | | | ✓ | Voir « Alternatives textuelles ». |
| Images, vidéos et audios ont une alternative textuelle | | | ✓ | Les `<iframe>` portent un `title` (bon point). Pas de transcription pour les vidéos de cours — à prévoir dès qu'un contenu réel sera publié. Aucun message d'état n'est annoncé : réponse de l'IA, chargement, succès d'inscription, erreurs — aucun `aria-live` dans le projet. |

### Formulaire — *Design / Développement*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Un intitulé explicite est accolé aux champs | | ✓ | | **Aucun champ du projet n'a de label programmatiquement associé.** Les `<label>` existent visuellement mais **sans `for`/`id`** et sans englober le champ : Admin (email, mot de passe, module, titre, description, durée, URL image, URL vidéo), modale Projet, modale Compétence, modale Notification. Les champs de recherche et le `<textarea>` du chat n'ont **que** des `placeholder`. Vérifié au runtime : 6 champs sans nom accessible. |
| Usage approprié de `<fieldset>` / `<legend>` | | ✓ | | Le groupe « Couleur » (8 boutons) n'est ni regroupé ni légendé, et ses options n'ont aucun libellé. → `<fieldset><legend>Couleur du projet</legend>` + `role="radio"`/`aria-checked` + `aria-label` par couleur. |
| L'ensemble des champs est cohérent | ✓ | | | Libellés homogènes entre les formulaires. |
| Les intitulés de boutons sont pertinents et cohérents | | | ✓ | Bons libellés textuels (« Enregistrer », « Annuler », « Se connecter »). Les boutons icône seuls restent sans nom. |
| Les champs obligatoires sont identifiables | | ✓ | | « Titre * » : astérisque **seul**, sans légende en début de formulaire ni `aria-required`/`required` annoncé. Le formulaire de connexion n'indique rien alors que le bouton est désactivé tant que les deux champs sont vides. |
| Les formats de saisie attendus sont précisés | | | ✓ | Indications présentes mais **fragiles** : « Ex : 12:45 » n'existe que dans le `placeholder` (disparaît à la saisie) ; l'aide sous le champ URL vidéo n'est pas rattachée par `aria-describedby`. |
| Messages d'erreur repérables, pertinents, avec suggestions | | ✓ | | Les messages sont de simples `<p>` : pas de `role="alert"`, pas d'`aria-describedby`, pas de mise au focus du champ fautif. Ils ne sont donc **jamais annoncés** à un lecteur d'écran. L'erreur est aussi signalée par une bordure rouge à 2,77:1 (couleur seule + contraste insuffisant). « Email ou mot de passe incorrect. » n'offre aucune piste de correction. |
| Les champs de même nature sont regroupés | ✓ | | | Regroupement logique respecté. |

### Donner un titre aux rubriques — *Développement*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Hiérarchie logique et pertinente | | | ✓ | **Landing : exemplaire** — `h1` → `h2` → `h3` × 3 → `h2` → `h2`, aucun saut. **Le reste : non conforme.** |
| Tous les titres sont balisés en titres | | ✓ | | Titres visuels non balisés : « Mes Projets », « Configuration », « Aujourd'hui », « Précédent » (`<span>`), « Compétences / Skills » (`<div>`), « Ce que vous trouverez dès aujourd'hui » (`<p>`). |
| Le premier titre de la page est le niveau H1 | | ✓ | | **Aucun `h1`** sur l'onglet IA (0 titre au total), l'onglet Modules (0 titre) et la connexion Admin (0 titre) — confirmé par Lighthouse `page-has-heading-one`. `h1` présent sur la Landing et l'onglet Outils. |
| Pas de saut de niveau | | ✓ | | axe `heading-order` : onglet Outils **h1 → h3**. Vue détail d'un cours : **h2 → h4** (« Fichiers à télécharger »), et le titre du cours passe de `h2` en mode vidéo à `h1` en mode lecture. |
| Contenus pertinents validés par l'équipe contenu | | | ✓ | Formulations claires. **À faire valider par le métier.** |

### Tableaux — *Développement*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| ⬜ Présence d'une description fidèle | | | | **Non concerné** — aucun `<table>` dans le projet. La liste des cours de l'Admin est une liste de cartes, pas un tableau de données. |
| ⬜ Description restituée au lecteur d'écran | | | | Non concerné. |
| ⬜ Titres proches, pertinents et correctement liés | | | | Non concerné. |

### Langue des pages — *Développement*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Attribut `lang="fr"` dans la balise `<html>` | ✓ | | | Vérifié : `<html lang="fr">` ([index.html:2](index.html#L2)), correctement restitué sur les 4 vues. **Réserve (RGAA 8.7)** : les termes anglais insérés dans le contenu français (« Live », « Workspace Beta », « UI Builder », « Preview », « Upload ») devraient porter `lang="en"`, sauf s'ils sont considérés comme entrés dans l'usage. |

### Documents téléchargés — *Développement / Métier-PM-PO*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| ⬜ Documents Office sans erreur au vérificateur | | | | **Non concerné à ce stade.** Le bloc « Fichiers à télécharger » (Figma UI Kit, Cheat Sheet PDF) est une maquette codée en dur, sans lien ni fichier réel. **À re-tester impérativement** lors du branchement de vrais documents. |
| ⬜ PDF avec balisage pertinent (test PAC) | | | | Idem. |
| ⬜ Documents restitués aux lecteurs d'écran | | | | Idem. |
| ⬜ Format pertinent selon les besoins de modification | | | | Idem. |

### Donner un titre aux pages — *Métier / PM / PO*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Chaque titre est différent et décrit brièvement le contenu | | ✓ | | Vérifié : `document.title` reste **« Vibe Hub — Master AI for UI/UX » sur les 4 vues**. L'application ne met jamais le titre à jour lors des changements de vue (SPA). → Mettre à jour `document.title` à chaque changement de vue/onglet. |
| Le titre est celui prévu par l'équipe métier | | | ✓ | Le titre actuel est **en anglais** sur un site déclaré `lang="fr"`. À arbitrer avec le métier. |

### Alternatives textuelles *(bloquant si KO)* — *Métier / PM / PO*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Chaque information importante d'une image est retranscrite en `alt`, validée par le métier | | | ✓ | **Landing : conforme** — `alt="Illustration de la marque Vibe Hub"`. **Workspace / Admin : alternatives non pertinentes et en anglais** : `alt="Upload"`, `alt="Preview"` ([IATab.jsx:592,642](src/components/workspace/tabs/IATab.jsx#L592)), `alt="Video cover"`, `alt="Wireframe design example"` ([CourseDetail.jsx:173,247](src/components/workspace/modules/CourseDetail.jsx#L173)), `alt="Preview"` ([AdminPage.jsx:465](src/pages/AdminPage.jsx#L465)). **Validation métier des textes non réalisée.** |
| Rien n'est retranscrit en cas d'absence d'information (image décorative) | | | ✓ | **Très bien traité sur la Landing** : `alt="" aria-hidden` sur l'illustration Programme, `aria-hidden` + `pointer-events-none` sur le champ de confettis et le filigrane du pied de page. **Exception** : `CourseCard` utilise `alt={course.title}`, qui duplique le `h3` situé juste en dessous → devrait être `alt=""`. |

### Liens et boutons — *Métier / PM / PO*

| À vérifier | 🟩 | 🟥 | 🟦 | Commentaire — Action |
|---|:-:|:-:|:-:|---|
| Nature des liens explicite, changement de contexte annoncé | | ✓ | | « Mentions légales » et « Confidentialité » pointent sur `href="#"` — **liens morts** qui ramènent en haut de page ([Footer.jsx:293,299](src/components/landing/Footer.jsx#L293)). L'iframe YouTube charge un contenu tiers sans mention préalable. Aucun `target="_blank"` dans le projet (bon point). |
| Action des boutons claire et sans ambiguïté | | | ✓ | Les boutons libellés en texte sont clairs et cohérents. Les boutons icône seuls ne le sont ni visuellement pour tous, ni du tout pour un lecteur d'écran (cf. « Labels explicites »). |

---

## Synthèse par catégorie

| Catégorie | Verdict | Bloquant |
|---|---|:-:|
| Contraste couleurs | 🟦 Partiel (1 critère KO sur 2) | |
| Couleur non informative | 🟥 **NON** | ⛔ |
| Zoom 200 % | 🟦 Partiel | ⛔ |
| 2 moyens de navigation | 🟥 NON | |
| Responsive | 🟥 **NON** | ⛔ |
| Contrôle utilisateur | 🟦 Partiel (1 critère KO) | |
| Navigation clavier | 🟥 **NON** | ⛔ |
| Lecteur d'écran | 🟥 **NON** | ⛔ |
| Formulaire | 🟥 NON (4 critères KO sur 8) | |
| Titres de rubriques | 🟥 NON (3 critères KO sur 5) | |
| Tableaux | ⬜ Non concerné | |
| Langue des pages | 🟩 OUI | |
| Documents téléchargés | ⬜ Non concerné à ce stade | |
| Titre des pages | 🟥 NON | |
| Alternatives textuelles | 🟦 Partiel | ⛔ |
| Liens et boutons | 🟦 Partiel (1 critère KO) | |

---

## Plan d'action priorisé

### P0 — Bloquants, à traiter avant toute mise en ligne

| # | Action | Fichiers | Effort |
|---|---|---|---|
| 1 | Rendre les cartes de module opérables au clavier (`<div onClick>` → `<button>`) — sans cela, **aucun cours n'est accessible au clavier** | `CourseCard.jsx`, `CourseDetail.jsx` | S |
| 2 | Ajouter un lien d'évitement « Aller au contenu principal » + un `<main>` sur chacune des 4 vues | `App.jsx`, `LandingPage.jsx`, `WorkspacePage.jsx`, `AdminPage.jsx` | S |
| 3 | Associer chaque `<label>` à son champ (`id` / `for`) et nommer les champs de recherche et le chat | `AdminPage.jsx`, `IATab.jsx`, `OutilsTab.jsx` | M |
| 4 | Donner un nom accessible aux boutons icône (`aria-label`) : envoi du chat, œil du mot de passe, fermetures de modale, actions de ligne, pastilles de couleur | `IATab.jsx`, `AdminPage.jsx` | S |
| 5 | Sémantiser les onglets (`role="tablist"` / `role="tab"` / `aria-selected` / `role="tabpanel"`) | `TopBar.jsx`, `WorkspacePage.jsx` | M |
| 6 | Rétablir un indicateur de focus visible sur le Workspace et l'Admin (remplacer `outline-none` par `focus-visible:ring-2`) | tout `src/components/workspace/**`, `AdminPage.jsx` | M |
| 7 | Ajouter un menu de navigation mobile sur la Landing (< 768 px) | `Navbar.jsx` | M |
| 8 | Ajouter un `h1` sur les vues IA, Modules et Admin ; corriger les sauts h1→h3 et h2→h4 | `IATab.jsx`, `ModulesTab.jsx`, `AdminPage.jsx`, `OutilsTab.jsx`, `CourseDetail.jsx` | S |

### P1 — Fortement recommandés

| # | Action | Effort |
|---|---|---|
| 9 | Modales : `role="dialog"`, `aria-modal`, `aria-labelledby`, piège de focus, restitution du focus, fermeture par Échap partout | M |
| 10 | Messages d'erreur : `role="alert"` + `aria-describedby` + mise au focus du champ fautif + suggestion de correction | M |
| 11 | Bloc global `prefers-reduced-motion` dans `index.css` (animations, transitions, `scroll-behavior`) | S |
| 12 | Remonter les couleurs de texte grises (`#999999`, `#CCCCCC`) et les bordures de contrôle (`#EAEAEA`) aux seuils 4,5:1 / 3:1 | M |
| 13 | Agrandir les cibles tactiles à 44×44 px (liens de nav, onglets, boutons d'action 22×22) | M |
| 14 | Mettre à jour `document.title` à chaque changement de vue | S |
| 15 | Rendre le Workspace utilisable au zoom 200 % et à 320 px (`min-h-screen` + `overflow-auto`, barre latérale repliable) | M |

### P2 — Compléments

| # | Action | Effort |
|---|---|---|
| 16 | Corriger les `alt` non pertinents / anglophones ; passer `CourseCard` en `alt=""` | S |
| 17 | Brancher ou retirer les liens « Mentions légales » et « Confidentialité » (`href="#"`) | S |
| 18 | Ajouter un second moyen de navigation (plan de site ou recherche globale) | M |
| 19 | Régions live (`aria-live`) pour les réponses de l'IA, les chargements et les confirmations | M |
| 20 | Rendre le menu « slash » navigable au clavier (flèches, Entrée, Échap) | M |
| 21 | Baliser les termes anglais avec `lang="en"` | S |
| 22 | Installer `eslint-plugin-jsx-a11y` pour prévenir les régressions en CI | S |

---

## Tests restant à réaliser manuellement

Ces critères ne peuvent pas être validés par l'outillage automatique et ne sont donc **pas conclus** dans la grille ci-dessus :

- Restitution réelle par NVDA, JAWS et VoiceOver (ordre de lecture, annonce des états, navigation par titres et par régions)
- Zoom 200 % avec la loupe Windows et le zoom texte seul de Firefox
- Validation éditoriale des alternatives textuelles, des titres de page et des intitulés par l'équipe métier
- Accessibilité des documents téléchargeables, dès qu'ils seront réellement servis
- Transcription et sous-titrage des vidéos de cours, dès la publication d'un contenu réel

---

## Reproduire ce diagnostic

```bash
# 1. Lancer l'application
npm run dev

# 2. Score Lighthouse (catégorie Accessibilité)
npx lighthouse http://localhost:5173/       --only-categories=accessibility --view
npx lighthouse http://localhost:5173/admin  --only-categories=accessibility --view

# 3. Détection automatique continue (à ajouter au projet)
npm i -D eslint-plugin-jsx-a11y @axe-core/playwright
```
