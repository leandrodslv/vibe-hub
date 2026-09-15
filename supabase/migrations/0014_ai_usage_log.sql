-- ════════════════════════════════════════════════════════════════════════════
-- 0014 — Epic 11 (epics-ai-ops.md): visibilité coûts/usage IA + suivi rotation
-- de clé, sans jamais exposer ou manipuler `GEMINI_API_KEY` elle-même (AD-13).
--
-- ai_usage_log  : une ligne par appel Gemini réussi (gemini-proxy/course-draft),
--                 écrite uniquement par service_role (Edge Functions, AD-1/AD-12)
--                 — RLS activée, ZÉRO policy (même posture que `admins`, 0011) :
--                 même un admin authentifié ne peut pas la lire en direct, elle
--                 passe uniquement par get_ai_usage_summary() ci-dessous.
-- ai_key_rotations : metadata pure (date, qui, note) qu'un admin enregistre à la
--                 main après avoir tourné la clé via `supabase secrets set` — ne
--                 contient jamais la clé elle-même (AD-13).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.ai_usage_log (
  id                bigint generated always as identity primary key,
  created_at        timestamptz not null default now(),
  endpoint          text not null check (endpoint in ('gemini-proxy', 'course-draft')),
  model             text not null,
  prompt_tokens     int not null default 0,
  candidates_tokens int not null default 0,
  total_tokens      int not null default 0
);

alter table public.ai_usage_log enable row level security;
-- Pas de policy : écriture par service_role uniquement (bypass RLS), lecture
-- uniquement via get_ai_usage_summary() (security definer, filtré is_admin()).

create index if not exists ai_usage_log_created_at_idx on public.ai_usage_log (created_at desc);

create table if not exists public.ai_key_rotations (
  id         bigint generated always as identity primary key,
  rotated_at timestamptz not null default now(),
  rotated_by uuid references auth.users (id) on delete set null,
  note       text
);

alter table public.ai_key_rotations enable row level security;

drop policy if exists "ai_key_rotations: admin reads" on public.ai_key_rotations;
create policy "ai_key_rotations: admin reads"
  on public.ai_key_rotations for select
  to authenticated
  using (public.is_admin());

drop policy if exists "ai_key_rotations: admin inserts" on public.ai_key_rotations;
create policy "ai_key_rotations: admin inserts"
  on public.ai_key_rotations for insert
  to authenticated
  with check (public.is_admin());

-- ─── get_ai_usage_summary : agrégats 7j/30j par endpoint, même garde que
-- get_waitlist_counts() (0011) — le GRANT Postgres est binaire, le filtre
-- is_admin() vit donc dans le corps de la fonction, pas dans le GRANT ────────
create or replace function public.get_ai_usage_summary()
returns table (
  endpoint       text,
  window_days    int,
  calls          int,
  prompt_tokens  bigint,
  candidates_tokens bigint,
  total_tokens   bigint
)
language sql
security definer
set search_path = public
as $$
  select
    l.endpoint,
    w.window_days,
    count(*)::int as calls,
    coalesce(sum(l.prompt_tokens), 0)::bigint as prompt_tokens,
    coalesce(sum(l.candidates_tokens), 0)::bigint as candidates_tokens,
    coalesce(sum(l.total_tokens), 0)::bigint as total_tokens
  from public.ai_usage_log l
  cross join (values (7), (30)) as w(window_days)
  where public.is_admin()
    and l.created_at >= now() - (w.window_days || ' days')::interval
  group by l.endpoint, w.window_days
$$;

revoke all on function public.get_ai_usage_summary() from public, anon;
grant execute on function public.get_ai_usage_summary() to authenticated;
