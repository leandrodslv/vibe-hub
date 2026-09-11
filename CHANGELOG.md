# Changelog

## [0.2.0](https://github.com/leandrodslv/vibe-hub/compare/v0.1.0...v0.2.0) (2026-09-11)


### ✨ Fonctionnalités

* **admin:** écran "accès refusé" pour un compte non-admin sur /admin ([9c69e86](https://github.com/leandrodslv/vibe-hub/commit/9c69e86b681f762386fd4e2bd5e73637a7cae235))
* **landing:** add branded favicon ([d3abd30](https://github.com/leandrodslv/vibe-hub/commit/d3abd30f4d1ac21f6132fb72ac425535fd4e8df1))
* **landing:** add skip link, aria labels and mobile menu ([0f86952](https://github.com/leandrodslv/vibe-hub/commit/0f86952cdf009ed7bd2efd246ef27589f7e36418))
* **landing:** implement story 1.1 landing page with Franc design system ([6d1bd3f](https://github.com/leandrodslv/vibe-hub/commit/6d1bd3f8e9d9b9b171725fbcf759a43e37524b4f))
* **landing:** update hero visual and sticker styling ([11a0f70](https://github.com/leandrodslv/vibe-hub/commit/11a0f708b05794cc2cc8895e80844c26020f3d93))
* **notifications:** applique la migration 7.2 sur Supabase (prod) ([3845e05](https://github.com/leandrodslv/vibe-hub/commit/3845e050c4b8a4cb7a581d9e0438c17ebd70b716))
* **notifications:** centre de notifications (Epic 7, stories 7.2/7.3) ([23a16c2](https://github.com/leandrodslv/vibe-hub/commit/23a16c210ac7446b19104458bb01680b932596b5))
* **notifications:** complète la story 7.1 — inscription + point d'entrée ([f19ed57](https://github.com/leandrodslv/vibe-hub/commit/f19ed57f09b0c907a5d7b0e8b6e3440164db2df1))
* **notifications:** générateurs serveur 9.4/9.5/9.6 (Resend, rappels, événements) ([3a0e736](https://github.com/leandrodslv/vibe-hub/commit/3a0e73635be6be0a9d8a5064281b9294c70c270f))
* routing landing/app + socle AI-first & roadmap d'automatisation V1→V10 ([#17](https://github.com/leandrodslv/vibe-hub/issues/17)) ([3f5578f](https://github.com/leandrodslv/vibe-hub/commit/3f5578f44db049f448cb90d186a0d033d8ea340a))


### 🐛 Corrections

* **gemini-proxy:** pin @google/genai vers une version publiée ([#34](https://github.com/leandrodslv/vibe-hub/issues/34)) ([2ca2379](https://github.com/leandrodslv/vibe-hub/commit/2ca23797c8277cbbe1748399ea9db4775d6f42a6))
* **landing:** restore full Modules card content from design ([6db9737](https://github.com/leandrodslv/vibe-hub/commit/6db9737089ae7f7a345beb358a7070d83904db04))
* **notifications:** topic Realtime unique par abonnement (crash ErrorBoundary) ([d378349](https://github.com/leandrodslv/vibe-hub/commit/d37834975de8d1b85330d3b8bf7820ac57e3c6d4))
* route Gemini via l'Edge Function gemini-proxy (AD-1) ([#18](https://github.com/leandrodslv/vibe-hub/issues/18)) ([8f4d15f](https://github.com/leandrodslv/vibe-hub/commit/8f4d15fb45c8d59452ed5665be0e3ad3815f96ee))
* **supabase:** is_admin() cassait getCourses() pour tout visiteur anonyme ([66c3891](https://github.com/leandrodslv/vibe-hub/commit/66c38914a25d8339a0d8eced9f0b68ee3c64a1b7))
* **supabase:** révoque l'accès RPC public de edf_handle_new_user() ([5360990](https://github.com/leandrodslv/vibe-hub/commit/536099034b909b68f423ddec2d2ba0b8a79b544e))
* **supabase:** table admins + RLS courses/waitlist-counts réservées aux admins ([d4b2f75](https://github.com/leandrodslv/vibe-hub/commit/d4b2f7585458270480898f59ba33d763e6f48329))


### 📚 Documentation

* **bmad:** add admin crud implementation artifact ([3cd0465](https://github.com/leandrodslv/vibe-hub/commit/3cd0465cb634122c7b44cdff83d75366957400b1))
* **brief:** add Vibe Hub product brief ([8beb0ed](https://github.com/leandrodslv/vibe-hub/commit/8beb0ed0df3228c29be40a72bdf296d4e3718de6))
* **notifications:** 9.6c appliquée en prod (validée par l'utilisateur) ([2b0f417](https://github.com/leandrodslv/vibe-hub/commit/2b0f417f9e8f42b2cf05409704c6e155b3a95144))
* **planning:** add PRD, UX designs, and architecture spine ([c466743](https://github.com/leandrodslv/vibe-hub/commit/c4667434a2c5ec3da8d36baec5460ec9c40f0ef3))
