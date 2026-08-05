# Intention produit -- Vibe Hub (post-brainstorming)

Source : `.memlog.md` (103 idees, 13 techniques, synthese finale) -- session du 2026-08-05.

## Opportunite centrale

Vibe Hub est un prototype fonctionnel (Gemini + Supabase deja integres) mais son pitch actuel ("cours + chat IA generique") ne differencie pas et son execution beta trahit un inachevement qui contredit la promesse "maitrisez l'IA". Le vrai actif differenciant -- les "skills" (instructions IA custom) -- est enterre comme feature secondaire alors qu'il devrait etre le pilier produit et marketing. Avant de construire davantage, le projet a besoin d'un cadrage (PRD/brief) pour ne pas disperser l'effort sur les 100+ pistes generees.

## Directions retenues

**1. "Skills" comme marketplace / differenciant central.** Le concept revient dans 5 techniques (SCAMPER, One Feature Only, Kill the Crown Jewel, Pirate Code, Time Horizon) -- signal de convergence fort. Transformer les "skills" en presets telechargeables/partageables que les etudiants publient et vendent (modele galerie Notion), avec objectif 1 an de 50 presets publies par la communaute, pas seulement par Julien. A mettre en avant dans le marketing (chapeau jaune) plutot que de rester une fonctionnalite cachee du chat.

**2. Landing page "demo-first".** La valeur doit se DEMONTRER, pas s'expliquer en texte : remplacer le Hero statique par un Loom brut du chat IA en action ou une animation avant/apres d'un ecran Figma transforme par IA, et exposer une cle demo avec rate-limiting strict pour que les visiteurs testent le chat sans inscription. Complementer avec un hook haut de funnel type "roast mon portfolio par IA" (Crazy 8s) qui convertit mieux qu'une liste de cours.

**3. Fix rapides de credibilite (avant tout autre chantier).** Tension identifiee entre authenticite beta et polish premium, resolue par des correctifs cheap et immediats : remplacer la photo Unsplash du formateur par une vraie photo (authenticite bat le poli en beta), et combler l'absence de rate-limiting/suivi d'usage sur la cle API Gemini (risque d'explosion de couts a l'ouverture -- chapeau noir). Ces deux points sont bloquants pour la credibilite d'un produit qui vend "maitrisez l'IA".

**4. Freemium plutot que beta fermee.** Trois techniques convergent (Assumption Reversal : ouvrir totalement l'acces et monetiser seulement skills/outils avances ; Ship in 60 Minutes : waitlist legere via Typeform sans vraie auth Supabase ; One Feature Only : chat IA gratuit et illimite, faire payer le parcours structure qui garantit la maitrise). Le moteur de croissance vise l'usage gratuit large plutot que le filtrage a l'entree.

**5. Export code pour le generateur UI.** L'outil generateur de l'onglet Outils doit sortir du vrai code React/Tailwind fonctionnel, pas seulement des images (collision generation de code IA), avec un modele "fork this" a la Replit permettant aux visiteurs de forker une skill publique sans login -- casse la limite actuelle et transforme les utilisateurs gratuits en canal marketing.

**6. Cadrer avant de scaler.** Le projet n'a aucun PRD/spec malgre l'outillage BMad installe (chapeau bleu). Lancer `bmad-product-brief` puis `bmad-prd` en s'appuyant sur ce document reduit le risque de dispersion avant de construire davantage.

## Autres idees fortes a garder en vue

- **JTBD reels** : "ne pas paraitre incompetent devant son PM/dev", "prouver a son boss que l'IA n'a pas baisse la qualite" (besoin d'un portfolio de travaux assistes par IA), "se debloquer en 10 minutes quand un fichier Figma stagne" -- positionner Vibe Hub comme assurance carriere plutot que formation theorique.
- **Import Figma direct dans le chat** au lieu de partir d'un prompt vide (HMW).
- **Adapter le code review** a l'UI/UX : soumission d'ecran + critiques IA/pairs en ligne.
- **Graphe de fluidite IA** façon graphe de contributions GitHub, comme preuve sociale de progression.
- **Streaks/gamification** style Duolingo pour la pratique quotidienne des outils IA.
- **Roadmap publique** a partir des dossiers docs/ vides -- transparence a cout de build nul.
- **Ouvrir la plateforme des le jour 1** a des experts IA-design invites, Julien en curateur, pour lever le goulot d'etranglement gourou-unique.
- **Vendre avant de construire** (playbook Gumroad) pour valider le prix du cours avant de finir le backend.
- **Certificat reel a la semaine 4** partageable sur LinkedIn -- ligne d'arrivee garantie + distribution a cout nul.
