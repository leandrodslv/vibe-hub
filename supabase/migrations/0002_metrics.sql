-- ════════════════════════════════════════════════════════════════════════════
-- 0002 — Table `metrics` : collecte web-vitals + erreurs (Observabilité V10)
--
-- Écriture UNIQUEMENT par l'Edge Function `metrics` (service_role, qui contourne
-- RLS). Aucune policy `anon` → un accès PostgREST direct est refusé. Lecture
-- admin via l'agrégat `get_metrics_summary()` seulement (esprit AD-3/AD-4 :
-- jamais de lignes brutes exposées largement).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.metrics (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('web-vital', 'error')),
  release     text,
  session_id  text,
  metric      text,                 -- LCP / CLS / INP / FCP / TTFB (web-vital)
  value       double precision,
  rating      text,                 -- good / needs-improvement / poor
  at          text,                 -- point de capture (error)
  payload     jsonb,                -- détails (déjà nettoyés côté client + fonction)
  created_at  timestamptz not null default now()
);

alter table public.metrics enable row level security;
-- Pas de policy : seul service_role (Edge Function) écrit ; personne ne lit en brut.

create index if not exists metrics_created_idx on public.metrics (created_at desc);
create index if not exists metrics_kind_metric_idx on public.metrics (kind, metric);

-- ─── Agrégat admin (AD-4-like) — jamais de session_id ni de payload ─────────
create or replace function public.get_metrics_summary(since_hours int default 24)
returns table (kind text, metric text, samples bigint, p75 double precision, poor_pct numeric)
language sql
security definer
set search_path = public
as $$
  select
    kind,
    metric,
    count(*) as samples,
    percentile_cont(0.75) within group (order by value) as p75,
    round(100.0 * count(*) filter (where rating = 'poor') / nullif(count(*), 0), 1) as poor_pct
  from public.metrics
  where created_at > now() - make_interval(hours => since_hours)
  group by kind, metric
  order by kind, metric
$$;

revoke all on function public.get_metrics_summary(int) from public, anon;
grant execute on function public.get_metrics_summary(int) to authenticated;

-- Purge : garder 30 jours (à câbler dans un cron pg_cron si dispo, sinon manuel).
-- delete from public.metrics where created_at < now() - interval '30 days';
