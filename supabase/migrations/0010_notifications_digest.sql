-- ════════════════════════════════════════════════════════════════════════════
-- 0010 — Digest email quotidien (Story 9.4, AD-8, NFR7)
--
-- `get_digest_candidates()` sélectionne, pour chaque utilisateur avec
-- `email_enabled = true`, ses notifications non lues depuis son dernier
-- digest — rate-bound à un envoi par jour par utilisateur (NFR7) via
-- `last_digest_sent_at`. `mark_digest_sent()` n'est appelée par l'Edge
-- Function qu'après un envoi réussi : un échec laisse l'utilisateur éligible
-- au run suivant (retry borné par la cadence du cron, jamais de fan-out).
--
-- ✅ APPLIQUÉ en production le 2026-09-11 (migration live : create_digest_candidates,
--    colonne + les deux fonctions seulement).
--
-- ⚠️  RESTE À FAIRE MANUELLEMENT (aucun n'a pu passer par cette session — cf.
--     supabase/functions/notifications-digest/index.ts pour le détail) :
--
--   1. Créer un compte Resend, vérifier un domaine d'envoi, récupérer une clé API.
--
--   2. Déployer la fonction :
--        supabase functions deploy notifications-digest
--
--   3. Poser les secrets (jamais en VITE_*, AD-1) :
--        supabase secrets set RESEND_API_KEY=...
--        supabase secrets set SITE_URL=https://votre-domaine
--        supabase secrets set DIGEST_FROM_EMAIL="Vibe Hub <notifications@votre-domaine>"
--
--   4. Planifier l'appel quotidien (SQL Editor du dashboard — remplacer
--      <SERVICE_ROLE_KEY> par la clé service_role du projet, Settings → API ;
--      ne JAMAIS committer cette valeur dans le repo) :
--
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
--   select cron.schedule(
--     'notifications-digest-daily',
--     '0 8 * * *',                                    -- 08:00 UTC chaque jour
--     $$
--     select net.http_post(
--       url := 'https://gbqrbpvylensrhkwxjgv.supabase.co/functions/v1/notifications-digest',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--         'Content-Type', 'application/json'
--       ),
--       body := '{}'::jsonb
--     );
--     $$
--   );
-- ════════════════════════════════════════════════════════════════════════════

alter table public.notification_preferences
  add column if not exists last_digest_sent_at timestamptz;

create or replace function public.get_digest_candidates()
returns table (user_id uuid, email text, notifications jsonb)
language sql
security definer
set search_path = public
as $$
  select
    p.user_id,
    u.email,
    jsonb_agg(jsonb_build_object('title', n.title, 'link', n.link, 'category', n.category) order by n.created_at desc) as notifications
  from public.notification_preferences p
  join auth.users u on u.id = p.user_id
  join public.notifications n on n.user_id = p.user_id and n.read = false and n.dismissed = false
    and n.created_at > coalesce(p.last_digest_sent_at, '-infinity'::timestamptz)
  where p.email_enabled = true
    and (p.last_digest_sent_at is null or p.last_digest_sent_at < now() - interval '1 day')
    and u.email is not null
  group by p.user_id, u.email;
$$;

create or replace function public.mark_digest_sent(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notification_preferences set last_digest_sent_at = now() where user_id = p_user_id;
$$;

revoke execute on function public.get_digest_candidates() from public, anon, authenticated;
revoke execute on function public.mark_digest_sent(uuid) from public, anon, authenticated;
