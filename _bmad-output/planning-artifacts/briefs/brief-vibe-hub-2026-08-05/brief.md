---
title: Vibe Hub — Brief Produit
status: draft
created: 2026-08-05
updated: 2026-08-05
---

# Brief Produit : Vibe Hub

## Résumé exécutif

Vibe Hub est un outil **interne** — destiné à une équipe/entreprise, pas à un lancement public ou une monétisation externe — qui apprend aux designers UI/UX et product designers à utiliser l'IA dans leur workflow existant, puis leur met immédiatement entre les mains un workspace interactif pour s'exercer. Il combine un catalogue de cours asynchrones (prompting pour outils d'image générative, workflows UI assistés par IA) avec un workspace articulé autour de trois espaces : un assistant IA en chat pensé pour les prompts design, une grille d'outils IA pour designers, et une bibliothèque de cours. L'angle différenciant : on répète aux designers que "l'IA va changer le métier", mais on leur donne rarement un moyen no-code et pensé pour le design de construire ce réflexe en interne — la plupart des contenus IA pour créatifs s'adressent soit à des développeurs, soit à un public marketing générique externe. Vibe Hub ne se contente pas d'enseigner des concepts IA : il place un générateur d'UI par IA fonctionnel sur le même écran que la leçon. **[HYPOTHÈSE]** Le projet est aujourd'hui un prototype fonctionnel (React/Vite/Tailwind, chat propulsé par Gemini, liste d'attente via Supabase), pas encore déployé auprès de la vraie équipe cible — ce brief décrit le produit visé ; le scope et les critères de succès doivent être lus comme des cibles pré-déploiement, pas des métriques déjà obtenues.

## Le problème

Les designers qui veulent intégrer l'IA à leur workflow se heurtent à un décalage de contenu : la formation IA disponible est soit (a) du prompt engineering générique destiné à tout le monde, sans vocabulaire ni cas d'usage propres au design, soit (b) orientée développeurs, supposant une aisance avec le code que le public visé n'a pas et ne recherche pas. **[HYPOTHÈSE]** Aujourd'hui, ils bricolent avec des tutos YouTube épars, des astuces glanées sur le Discord Midjourney, et du tâtonnement dans des outils comme ChatGPT ou Midjourney, sans parcours structuré ni espace pour s'entraîner sereinement. Le coût : une adoption de l'IA lente et incohérente, de l'argent dépensé en abonnements mal maîtrisés, et une anxiété grandissante face aux designers déjà à l'aise avec l'IA qui prennent de l'avance. **[HYPOTHÈSE — à valider]** Ce constat est déduit du texte de la FAQ et du cadrage des cours dans le code ; il n'a pas été confirmé par de vrais entretiens utilisateurs.

## La solution

Vibe Hub combine deux choses sur un seul écran : des cours IA structurés et spécifiques au design (ex. "Introduction à l'IA pour l'UI", "Maîtriser Midjourney v6") et un workspace live où le même apprenant peut immédiatement mettre en pratique ce qu'il vient d'apprendre — discuter avec un assistant IA qui parle le langage du design et transforme une idée floue en prompt de génération exploitable, puis faire tourner ce prompt dans un outil UI Builder qui produit du vrai code React/Tailwind. Le cours et l'outil ne sont pas deux produits séparés : l'assistant chat passe explicitement le relais à l'UI Builder ("je vais te rédiger le prompt parfait à utiliser dans le Générateur UI"), si bien que la boucle d'apprentissage et la boucle de mise en pratique se renforcent l'une l'autre dans la même session.

## Ce qui différencie Vibe Hub

L'avantage revendiqué ici est l'intégration au workflow, pas la technologie : les modèles IA sous-jacents (Gemini aujourd'hui) ne sont ni propriétaires ni uniques. Ce qui change, c'est qu'un designer n'a jamais besoin de quitter la plateforme pour aller "essayer ça sur ChatGPT" — la leçon, l'assistant de rédaction de prompt et l'outil de génération vivent dans la même interface, avec une UI monochrome au niveau d'un vrai design system, qui incarne elle-même la qualité UI qu'elle enseigne à son audience. **[HYPOTHÈSE]** À ce stade, le vrai avantage est la qualité de contenu et la cohérence du workflow, pas une barrière défensive — un concurrent bien financé pourrait reproduire le mécanisme. À réévaluer une fois de vraies données d'usage disponibles.

## À qui Vibe Hub s'adresse

**Utilisateur principal :** les designers UI/UX et product designers de l'équipe/entreprise interne concernée, sans background code, curieux ou sous pression d'adopter des outils IA mais qui ne savent pas par où commencer. **[HYPOTHÈSE]** Probablement des designers déjà en poste dans l'équipe (pas des étudiants externes), à en juger par le cadrage "pas besoin de coder" et l'hypothèse d'un accès payant à ChatGPT Plus/Midjourney "recommandé". Le succès pour eux : terminer un module et repartir avec un prompt ou un asset utilisable, appliqué à un vrai projet client/interne dans la semaine — pas juste avoir regardé une vidéo. **[HYPOTHÈSE — à confirmer]** Taille et composition exactes de l'équipe cible non connues ; probablement une équipe de petite à moyenne taille (quelques designers à une quinzaine), typique d'une PME ou d'un département design au sein d'une structure plus large — pas un déploiement à l'échelle d'un grand groupe.

**Utilisateur secondaire :** **[HYPOTHÈSE — non confirmée]** des leads d'équipe ou managers voulant suivre l'adoption de l'IA dans l'équipe design, et potentiellement d'autres équipes internes (dev, marketing) si l'outil s'étend au-delà du design. À explorer en discovery.

## Critères de succès

**[HYPOTHÈSE — cibles provisoires en attendant les vrais objectifs de Léandro]**
- Signal de succès utilisateur : un membre de l'équipe termine au moins un module complet et utilise au moins une fois, dans la même session, l'enchaînement chat IA → UI Builder (preuve que la boucle centrale fonctionne, pas juste de la consommation de contenu).
- Objectif d'adoption interne : part de l'équipe design ayant ouvert le workspace et utilisé au moins un outil IA sur une période donnée (ex. mensuelle) — pas de métrique de conversion commerciale puisqu'il n'y a pas de monétisation externe. La liste d'attente Supabase sert ici à prioriser quel outil "bientôt disponible" construire en premier selon la demande interne.
- Crédibilité du catalogue de cours : remplacer les données de cours actuelles, qui sont des placeholders dupliqués (`src/data/courses.js` répète les deux mêmes modules sur neuf cartes), par du contenu réel et distinct avant tout déploiement à l'équipe. C'est un bloquant de déploiement, pas un nice-to-have. **[HYPOTHÈSE]** Léandro est probablement le seul créateur de contenu à ce stade (aucune équipe pédagogique dédiée identifiée) ; le rythme de production du contenu est donc probablement le facteur limitant du calendrier, plus que la technique.

## Périmètre

**Inclus pour la v1 (déjà couvert par le build actuel) :**
- Landing page (hero, preuve sociale, présentation du programme, FAQ)
- Workspace avec trois onglets : Modules (grille de cours), assistant IA en chat avec commandes slash et organisation en projets, Outils (grille d'outils IA)
- Un outil IA fonctionnel (UI Builder, propulsé par Gemini) générant du code React/Tailwind à partir de prompts
- Capture de liste d'attente (Supabase) pour les outils pas encore construits

**Explicitement hors périmètre pour la v1** (d'après la liste "prochaines étapes" du README, confirmée par le code — pas d'authentification, pas de persistance au-delà de la liste d'attente, pas de routeur) :
- Authentification et comptes utilisateurs
- Suivi réel de la progression des cours (le % de progression actuel dans les données de cours est statique, pas calculé)
- URLs propres / React Router (landing et workspace basculent aujourd'hui en interne, sans routage réel)
- Les quatre outils autres qu'UI Builder (Code Auditor, Content Writer, Color Studio, Vision Lens) — liste d'attente uniquement tant qu'ils ne sont pas construits
- Migration vers TypeScript

## Vision

**[HYPOTHÈSE — non encore discutée]** Si ça fonctionne, Vibe Hub devient l'outil interne par défaut vers lequel un designer de l'équipe se tourne quand il veut ajouter une nouvelle capacité IA à son workflow — pas une plateforme de cours avec un chatbot greffé dessus, mais un workspace que l'équipe garde ouvert au quotidien, où de nouveaux outils IA arrivent directement dans la grille qu'elle utilise déjà. Le catalogue de cours devient la couche d'onboarding d'un workspace interne de plus en plus riche en outils, plutôt que le centre de gravité du produit. **[HYPOTHÈSE]** Une extension au-delà de l'équipe design (autres équipes internes) est envisageable à terme mais non confirmée.

---

## Ce qui reste à valider

Ce brief a été produit en mode rapide (auto), avec des hypothèses `[HYPOTHÈSE]` posées faute d'échange complet avec Léandro. Avant de passer à un PRD ou une architecture, les points suivants méritent une validation explicite :

1. **Mandat du projet** — soutien officiel de l'entreprise, ou initiative bottom-up de Léandro sans mandat formalisé ? Le code ne contient aucun signal (branding, config multi-utilisateurs) permettant de trancher. Ça calibre le niveau de rigueur des prochains artefacts et la question de qui maintient l'outil dans la durée.
2. **Métriques de succès réelles** — les cibles d'adoption listées ci-dessus sont provisoires, pas mesurées ni discutées.
3. **Taille et composition de l'équipe cible** — estimation provisoire (petite à moyenne équipe design), non confirmée.
4. **Pipeline de contenu des cours** — hypothèse que Léandro est seul créateur de contenu à ce stade, non confirmée.

*(Voir `.memlog.md` dans ce workspace pour l'historique complet des décisions et hypothèses posées durant ce run.)*
