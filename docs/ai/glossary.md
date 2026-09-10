# Glossaire — Vibe Hub

| Terme                    | Définition                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **Landing**              | Page publique `/` (marketing). Débranchée du workspace.                                             |
| **Workspace**            | Le « logiciel » à `/app` : 3 onglets nav (Cours, IA, Outils) + Notifications.                       |
| **Onglet / tab**         | Vue du workspace. Écrite dans l'URL (`/app?tab=outils`), `history.replaceState`. Défaut : `ia`.     |
| **Débranchement**        | Landing et workspace = 2 URLs / 2 documents distincts, pas 2 états React.                           |
| **Module**               | Regroupement de cours (`module_name`, ex. « MODULE 1 »).                                            |
| **Cours**                | Leçon vidéo + transcription. Table `courses`. Trié par `order_index`.                               |
| **Progression**          | % d'avancement d'un cours. Par navigateur, `localStorage` (`progress_*`), non authoritative (FR-3). |
| **Waitlist**             | Liste d'attente e-mail pour un outil `coming`. Table `waitlist`, `(tool_id, email)` unique.         |
| **UI Builder**           | Générateur d'interface (onglet Outils). Seul outil `live`, aujourd'hui **mocké**.                   |
| **Assistant IA**         | Chat de l'onglet IA. Aide à rédiger des prompts, pas à discuter.                                    |
| **PromptHandoff**        | Composant qui affiche un prompt généré + bouton « Envoyer au Générateur ».                          |
| **Projet (IA)**          | Regroupe des sessions IA + instruction système custom. `ai_projects` (localStorage).                |
| **Skill / Compétence**   | Raccourci `/xxx` injectant une instruction système invisible. `ai_skills`.                          |
| **Session (IA)**         | Une conversation. Porte `projectId` (sens unique). `ai_sessions`.                                   |
| **Service Adapter**      | Fichier `src/services/*.js`. **Seule** couche qui parle à un système externe (AD-2).                |
| **Architecture Spine**   | Le doc canonique d'architecture (`_bmad-output/.../ARCHITECTURE-SPINE.md`). Définit AD-1..AD-6.     |
| **AD-1 … AD-6**          | Les 6 invariants d'architecture. Voir `docs/ai/architecture.md`.                                    |
| **FR-1 … FR-9**          | Les exigences fonctionnelles du PRD.                                                                |
| **RLS**                  | Row Level Security — politiques d'accès Postgres. La vraie frontière d'autorisation (AD-3).         |
| **Clé anon**             | Clé publique Supabase, livrée au navigateur par conception. Protégée par la RLS.                    |
| **Clé service_role**     | Clé Supabase admin. **Jamais** côté client.                                                         |
| **gemini-proxy**         | Edge Function Supabase qui détiendra la clé Gemini côté serveur (AD-1).                             |
| **VITE_***               | Préfixe des variables inlinées dans le bundle par Vite = **publiques**. Jamais un secret.           |
| **BMAD**                 | Méthode de planification (artefacts sous `_bmad-output/`).                                          |
| **release-please**       | Bot qui maintient la PR de release + le CHANGELOG depuis les commits conventionnels.                |
| **VU**                   | _Virtual User_ — utilisateur virtuel simulé par k6 dans un test de charge.                          |
| **Ratchet (couverture)** | Politique : le seuil de couverture ne baisse jamais, le périmètre mesuré s'élargit.                 |
| **chunky-shadow**        | Classe utilitaire du design system (ombre marquée). Voir `DESIGN_SYSTEM.md` / `index.css`.          |
| **Franc (couleurs)**     | Palette `franc-*` du design system (violet, green, coral, pink, blue).                              |
