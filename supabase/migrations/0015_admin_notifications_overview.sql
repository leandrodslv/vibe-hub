-- ════════════════════════════════════════════════════════════════════════════
-- 0015 — Epic 13 story 13.3 : agrégats notifications pour la carte "Notifications"
-- de l'Accueil admin. `notifications`/`notification_preferences` (0003) n'ont
-- aucune policy admin — jamais de lecture ligne à ligne côté admin, seulement
-- cet agrégat, même garde que get_waitlist_counts()/get_ai_usage_summary()
-- (0011/0014) : le filtre is_admin() vit dans le corps de la fonction, le
-- GRANT Postgres étant binaire par rôle.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.get_notifications_overview()
returns table (
  total_users          bigint,
  total_notifications  bigint,
  unread_notifications bigint,
  email_enabled_count  bigint,
  last_digest_sent_at  timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.notification_preferences)::bigint,
    (select count(*) from public.notifications)::bigint,
    (select count(*) from public.notifications where read = false and dismissed = false)::bigint,
    (select count(*) from public.notification_preferences where email_enabled = true)::bigint,
    (select max(last_digest_sent_at) from public.notification_preferences)
  where public.is_admin()
$$;

revoke all on function public.get_notifications_overview() from public, anon;
grant execute on function public.get_notifications_overview() to authenticated;
