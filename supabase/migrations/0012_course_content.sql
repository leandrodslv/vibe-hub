-- ════════════════════════════════════════════════════════════════════════════
-- 0012 — Contenu écrit des cours (espace de création admin)
--
-- Jusqu'ici, le "Mode Lecture" de `CourseDetail.jsx` était 100% en dur dans le
-- code React — le même texte ("Comprendre le Latent Space"…) pour TOUS les
-- cours, jamais relié à la base. Cette migration ajoute la colonne qui permet
-- à l'admin d'écrire un vrai contenu par cours (Markdown, rendu avec
-- `react-markdown` — déjà une dépendance du projet, déjà utilisée dans
-- l'onglet IA).
--
-- Nullable : un cours vidéo-only sans contenu écrit reste valide (dégrade sur
-- un état vide côté `CourseDetail`, pas une contrainte NOT NULL).
-- ════════════════════════════════════════════════════════════════════════════

alter table public.courses
  add column if not exists content text;
