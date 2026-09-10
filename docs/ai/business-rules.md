# Règles métier — Vibe Hub

> Dérivées du PRD (`_bmad-output/planning-artifacts/prds/prd-vibe-hub-2026-08-05/prd.md`,
> FR-1 … FR-9). En cas de doute sur une règle produit, le PRD tranche.

## Domaine

Formation asynchrone à l'IA générative **pour designers UI/UX francophones**. Pas de code
requis côté apprenant. Rythme libre.

## Cours (catalogue) — FR-2, FR-3

- Un cours appartient à un **module** (`module_name`, ex. « MODULE 1 »).
- Champs : `title`, `description`, `duration` (texte libre, ex. `12:45`), `image_url`,
  `video_url` (YouTube / SharePoint / Stream / lien direct), `published`, `order_index`.
- **`order_index` est le seul ordre d'affichage**, partout (Modules tab, admin). Jamais `created_at`.
- Seuls les cours **`published = true`** sont visibles côté apprenant (`getCourses`). L'admin
  voit tout (`getAllCourses`).
- **Progression** (FR-3) : par navigateur, **`localStorage`**, non authoritative. Repart à 0
  à chaque session (pas de compte utilisateur en v1). Clé préfixée `progress_*`.
- `video_url` non reconnue / non autorisée → le lecteur retombe sur le placeholder, jamais
  d'`<iframe>` vers un hôte hors liste blanche (sécurité + `isAllowedVideoUrl`).

## Admin — FR-4

- Accès `/admin`, protégé par **Supabase Auth** (email + mot de passe).
- Un seul type de compte en v1 : l'admin. Toute personne authentifiée = admin (à restreindre
  quand l'auth multi-utilisateurs arrivera).
- CRUD complet sur `courses`. L'autorité est la **RLS Postgres** (AD-3), pas l'UI.
- À la création, `order_index = max(order_index) + 1`.

## Assistant IA (onglet IA) — FR-5, FR-6

- Rôle : aider à **rédiger des prompts UI/UX**, pas à discuter librement.
- Le prompt final destiné au Générateur est encadré dans **un unique bloc de code Markdown**
  → composant `PromptHandoff` (bouton « Envoyer au Générateur » ⇒ ouvre l'onglet Outils).
- **Projets** (`ai_projects`) : regroupent des sessions, portent une instruction système
  personnalisée + une couleur. Une session porte `projectId` (sens unique).
- **Compétences / skills** (`ai_skills`) : raccourcis `/xxx` injectant une instruction système
  invisible pour une réponse. 3 par défaut (`/ui`, `/review`, `/explain`).
- **Sessions** (`ai_sessions`) : titre auto depuis le 1ᵉʳ message, dédup des discussions vides,
  tout en `localStorage`.
- L'IA **peut se tromper** : le disclaimer « Vérifiez les prompts générés » est obligatoire.
- Sans clé configurée : message d'erreur explicite, jamais de crash.

## Boîte à outils (onglet Outils) — FR-7, FR-8

- **UI Builder** : seul outil `status: 'live'` (aujourd'hui **mocké** — pas de vraie
  génération ; AD-5 impose un iframe sandbox le jour où ça devient réel).
- Autres outils : `status: 'coming'` + **liste d'attente**.
- **Waitlist** (FR-8) : `(tool_id, email)` unique. Doublon → message « déjà inscrit », pas une
  erreur. `INSERT` public, aucune lecture publique.
- Décompte de la demande (FR-9) : via `get_waitlist_counts()` (agrégat only, AD-4).

## Landing (`/`) — FR-1

- Publique, indexable, en français. Sections : Navbar, Hero, SocialProof, Programme, APropos,
  FAQ, Footer.
- Les CTA « Découvrir Vibe Hub » ouvrent `/app` dans un **nouvel onglet** (`NOUVEL_ONGLET`) —
  la landing reste intacte dans l'onglet d'origine.
- Landing et workspace sont **débranchés** : deux URLs, deux documents, pas deux états d'un
  composant.

## Notifications (onglet cloche) — hors nav principale

Données de **démonstration** uniquement (pas de back-end de notifications en v1). Préférences
en état local, non persistées.

## Hors périmètre v1 (ne pas implémenter sans décision produit)

Authentification apprenant · progression serveur · paiement · vraie génération UI Builder ·
back-end notifications · i18n (français uniquement).
