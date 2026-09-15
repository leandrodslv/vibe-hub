-- ════════════════════════════════════════════════════════════════════════════
-- 0016 — Epic 14 story 14.3 : série temporelle pour le graphique "Utilisation IA"
-- de l'Accueil admin. Même garde que get_ai_usage_summary()/get_notifications_
-- overview() (0014/0015) : security definer, filtré is_admin() en interne, zéro
-- ligne pour un appelant non-admin.
--
-- Les jours sans appel n'existent pas dans ai_usage_log — generate_series() les
-- matérialise à zéro pour garder un axe X continu côté graphique (Story 14.3 AC).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.get_ai_usage_daily(days int default 14)
returns table (
  day          date,
  endpoint     text,
  total_tokens bigint
)
language sql
security definer
set search_path = public
as $$
  select
    d.day::date,
    e.endpoint,
    coalesce(sum(l.total_tokens), 0)::bigint as total_tokens
  from generate_series(
    date_trunc('day', now()) - (least(greatest(days, 1), 90) - 1 || ' days')::interval,
    date_trunc('day', now()),
    '1 day'::interval
  ) as d(day)
  cross join (values ('gemini-proxy'), ('course-draft')) as e(endpoint)
  left join public.ai_usage_log l
    on date_trunc('day', l.created_at) = d.day
    and l.endpoint = e.endpoint
  where public.is_admin()
  group by d.day, e.endpoint
  order by d.day, e.endpoint
$$;

revoke all on function public.get_ai_usage_daily(int) from public, anon;
grant execute on function public.get_ai_usage_daily(int) to authenticated;
