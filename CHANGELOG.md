# Changelog

## [0.2.0](https://github.com/leandrodslv/vibe-hub/compare/v0.1.0...v0.2.0) (2026-09-17)


### ✨ Fonctionnalités

* **admin:** affiche la demande waitlist par outil dans /admin ([436b2a6](https://github.com/leandrodslv/vibe-hub/commit/436b2a6aa2d3706d6ad7f061d78d2e972f51d552))
* **admin:** ajoute un accueil dashboard comme point d'entree ([9c0ed49](https://github.com/leandrodslv/vibe-hub/commit/9c0ed49e9beca2f19837fbcbcaeb2e802055fd9f))
* **admin:** alerte de rotation de cle Gemini apres 90 jours ([6f49803](https://github.com/leandrodslv/vibe-hub/commit/6f498038626ead3c50887d0a5773088af913701d))
* **admin:** applique le design system Franc à l'espace admin ([06fbfc0](https://github.com/leandrodslv/vibe-hub/commit/06fbfc02d71703229a16641ca44f5bffc8597ff6))
* **admin:** auto-remplit titre/description/miniature sans IA ([7344805](https://github.com/leandrodslv/vibe-hub/commit/73448054047599c9a3230944b774bf5cfbb33f30))
* **admin:** brouillon de cours genere par IA depuis une video YouTube ([d82caa9](https://github.com/leandrodslv/vibe-hub/commit/d82caa973ff9bd6494dc56114115f1877ff21e11))
* **admin:** brouillon IA en un clic pour vidéo TikTok/Facebook ([c636f2d](https://github.com/leandrodslv/vibe-hub/commit/c636f2d51aa17ea8e781e81fcc608b2b26f627f1))
* **admin:** écran "accès refusé" pour un compte non-admin sur /admin ([9c69e86](https://github.com/leandrodslv/vibe-hub/commit/9c69e86b681f762386fd4e2bd5e73637a7cae235))
* **admin:** enrichit le dashboard Accueil (demande, IA, notifications) ([269b32d](https://github.com/leandrodslv/vibe-hub/commit/269b32daa0238ba088bdecbd5758f2fafeb105e4))
* **admin:** refonte du dashboard inspiree SkillPath ([d3ecaf5](https://github.com/leandrodslv/vibe-hub/commit/d3ecaf5309bfe1e28bba025f8614b90606d93c7a))
* **admin:** véritable espace de création de contenu écrit par cours ([2040ae8](https://github.com/leandrodslv/vibe-hub/commit/2040ae853174ceb4fddf41e57ce1d73b441c1005))
* **admin:** visibilite couts/tokens IA + suivi rotation de cle ([060acd7](https://github.com/leandrodslv/vibe-hub/commit/060acd7049ab7fb7604bff9a348459fab915c3fe))
* **courses:** supporte les vidéos TikTok, Facebook et YouTube Shorts ([a55cce6](https://github.com/leandrodslv/vibe-hub/commit/a55cce6f5eb5bfc3a28304d435859d20b108a6be))
* **landing:** add branded favicon ([d3abd30](https://github.com/leandrodslv/vibe-hub/commit/d3abd30f4d1ac21f6132fb72ac425535fd4e8df1))
* **landing:** add skip link, aria labels and mobile menu ([0f86952](https://github.com/leandrodslv/vibe-hub/commit/0f86952cdf009ed7bd2efd246ef27589f7e36418))
* **landing:** implement story 1.1 landing page with Franc design system ([6d1bd3f](https://github.com/leandrodslv/vibe-hub/commit/6d1bd3f8e9d9b9b171725fbcf759a43e37524b4f))
* **landing:** update hero visual and sticker styling ([11a0f70](https://github.com/leandrodslv/vibe-hub/commit/11a0f708b05794cc2cc8895e80844c26020f3d93))
* **notifications:** applique la migration 7.2 sur Supabase (prod) ([3845e05](https://github.com/leandrodslv/vibe-hub/commit/3845e050c4b8a4cb7a581d9e0438c17ebd70b716))
* **notifications:** centre de notifications (Epic 7, stories 7.2/7.3) ([23a16c2](https://github.com/leandrodslv/vibe-hub/commit/23a16c210ac7446b19104458bb01680b932596b5))
* **notifications:** complète la story 7.1 — inscription + point d'entrée ([f19ed57](https://github.com/leandrodslv/vibe-hub/commit/f19ed57f09b0c907a5d7b0e8b6e3440164db2df1))
* **notifications:** générateurs serveur 9.4/9.5/9.6 (Resend, rappels, événements) ([3a0e736](https://github.com/leandrodslv/vibe-hub/commit/3a0e73635be6be0a9d8a5064281b9294c70c270f))
* routing landing/app + socle AI-first & roadmap d'automatisation V1→V10 ([#17](https://github.com/leandrodslv/vibe-hub/issues/17)) ([3f5578f](https://github.com/leandrodslv/vibe-hub/commit/3f5578f44db049f448cb90d186a0d033d8ea340a))
* **scripts:** brouillon IA depuis une vidéo locale (TikTok/Facebook) ([f04141a](https://github.com/leandrodslv/vibe-hub/commit/f04141a010d67eda009b9db0bcf2e00cb0637415))
* **scripts:** mode --transcribe (Whisper local) pour la vidéo ([bb6e707](https://github.com/leandrodslv/vibe-hub/commit/bb6e7072e65f0cb9c3354bc860f458fded79110b))
* **workspace:** ajoute un accueil dashboard comme point d'entree ([a0d8873](https://github.com/leandrodslv/vibe-hub/commit/a0d8873aa4f01b7938e4d97747d774655226eadd))


### 🐛 Corrections

* **admin:** lower hero overlay opacity so unsplash texture shows through ([160dfb5](https://github.com/leandrodslv/vibe-hub/commit/160dfb57db7c253c9496300dbed82b5afdf26cbe))
* **admin:** remonte la banniere de priorite en haut de l'accueil ([b74c616](https://github.com/leandrodslv/vibe-hub/commit/b74c6167b0de23398501040fdd65bd81fd2251be))
* **courses:** persiste la progression de cours en localStorage (AD-6) ([8336097](https://github.com/leandrodslv/vibe-hub/commit/83360972dde03e1d1ccf0665a0b5408d50027844))
* **gemini-proxy:** pin @google/genai vers une version publiée ([#34](https://github.com/leandrodslv/vibe-hub/issues/34)) ([2ca2379](https://github.com/leandrodslv/vibe-hub/commit/2ca23797c8277cbbe1748399ea9db4775d6f42a6))
* **landing:** restore full Modules card content from design ([6db9737](https://github.com/leandrodslv/vibe-hub/commit/6db9737089ae7f7a345beb358a7070d83904db04))
* **notifications:** topic Realtime unique par abonnement (crash ErrorBoundary) ([d378349](https://github.com/leandrodslv/vibe-hub/commit/d37834975de8d1b85330d3b8bf7820ac57e3c6d4))
* route Gemini via l'Edge Function gemini-proxy (AD-1) ([#18](https://github.com/leandrodslv/vibe-hub/issues/18)) ([8f4d15f](https://github.com/leandrodslv/vibe-hub/commit/8f4d15fb45c8d59452ed5665be0e3ad3815f96ee))
* **supabase:** is_admin() cassait getCourses() pour tout visiteur anonyme ([66c3891](https://github.com/leandrodslv/vibe-hub/commit/66c38914a25d8339a0d8eced9f0b68ee3c64a1b7))
* **supabase:** révoque l'accès RPC public de edf_handle_new_user() ([5360990](https://github.com/leandrodslv/vibe-hub/commit/536099034b909b68f423ddec2d2ba0b8a79b544e))
* **supabase:** table admins + RLS courses/waitlist-counts réservées aux admins ([d4b2f75](https://github.com/leandrodslv/vibe-hub/commit/d4b2f7585458270480898f59ba33d763e6f48329))


### ⏪ Reverts

* **workspace:** retire l'onglet Accueil du Workspace ([ed86850](https://github.com/leandrodslv/vibe-hub/commit/ed8685063d7c77f184d23dfa7016230d5756d733))


### 📚 Documentation

* **bmad:** add admin crud implementation artifact ([3cd0465](https://github.com/leandrodslv/vibe-hub/commit/3cd0465cb634122c7b44cdff83d75366957400b1))
* **brief:** add Vibe Hub product brief ([8beb0ed](https://github.com/leandrodslv/vibe-hub/commit/8beb0ed0df3228c29be40a72bdf296d4e3718de6))
* **env:** documente VITE_COURSE_DRAFT_URL dans .env.example ([7b41a99](https://github.com/leandrodslv/vibe-hub/commit/7b41a990e1e8a0d6638b08cbec83e6f9c31afd80))
* **epics:** consigne le rejet motivé du brouillon IA TikTok/Facebook ([329477c](https://github.com/leandrodslv/vibe-hub/commit/329477c3b5750b654db9d27480151064fbdf8bc2))
* **notifications:** 9.6c appliquée en prod (validée par l'utilisateur) ([2b0f417](https://github.com/leandrodslv/vibe-hub/commit/2b0f417f9e8f42b2cf05409704c6e155b3a95144))
* **planning:** add PRD, UX designs, and architecture spine ([c466743](https://github.com/leandrodslv/vibe-hub/commit/c4667434a2c5ec3da8d36baec5460ec9c40f0ef3))
* **workspace:** corrige un commentaire (cinq onglets, pas quatre) ([5f5e903](https://github.com/leandrodslv/vibe-hub/commit/5f5e9035dbad08291bcc64223f0cf09e3ce80f76))
