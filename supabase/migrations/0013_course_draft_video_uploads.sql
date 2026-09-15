-- ════════════════════════════════════════════════════════════════════════════
-- 0013 — Bucket Storage pour le brouillon IA depuis un fichier vidéo local
-- (TikTok/Facebook — Epic 10 story 10.5, epics-video-platforms.md).
--
-- Contexte : `course-draft` (Edge Function) ne prend que des URLs YouTube
-- publiques (Gemini les ingère nativement) — aucune Edge Function ne doit
-- télécharger une vidéo TikTok/Facebook elle-même, CGU des deux plateformes à
-- l'appui (cf. Story 10.1). L'admin doit donc pouvoir uploader un fichier
-- QU'IL A DÉJÀ enregistré lui-même ; ce bucket n'est qu'un point de passage
-- temporaire entre le navigateur et l'Edge Function (qui lit via
-- service_role, envoie à Gemini, PUIS SUPPRIME le fichier — jamais stocké
-- durablement).
--
-- Seul le rôle admin peut y écrire (is_admin(), 0011). Aucune policy SELECT/
-- UPDATE/DELETE pour `authenticated` : l'Edge Function lit et supprime via
-- service_role, qui contourne RLS par nature — pas besoin de policy dédiée,
-- et ça évite qu'un admin (ou pire, un token compromis) puisse lister/relire
-- les vidéos déjà uploadées par quelqu'un d'autre.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-draft-uploads',
  'course-draft-uploads',
  false,
  209715200, -- 200 Mo — largement suffisant pour une vidéo courte TikTok/Reel
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
on conflict (id) do nothing;

drop policy if exists "course-draft-uploads: admin can insert" on storage.objects;
create policy "course-draft-uploads: admin can insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'course-draft-uploads' and public.is_admin());
