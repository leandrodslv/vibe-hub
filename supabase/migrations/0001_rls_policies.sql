-- ════════════════════════════════════════════════════════════════════════════
-- 0001 — Row Level Security : courses + waitlist
--
-- Architecture Spine AD-3 / AD-4 : l'autorité d'écriture est appliquée par
-- Postgres, PAS par le React (« cacher la route et espérer » est explicitement
-- refusé par le PRD). Le contrôle de session dans AdminPage.jsx reste un confort
-- UX, jamais la frontière de sécurité.
--
-- ⚠️  Ce fichier décrit l'ÉTAT CIBLE. Aucune migration n'existait dans le repo :
--     avant de l'appliquer, auditer les politiques réelles du projet Supabase
--     (`supabase db dump` ou l'éditeur SQL) — les tables peuvent déjà exister
--     avec d'autres policies.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── courses ───────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id            bigint generated always as identity primary key,
  module_name   text    not null,
  title         text    not null,
  description   text,
  duration      text,
  image_url     text,
  video_url     text,
  published     boolean not null default false,
  order_index   integer not null default 0,     -- AD : seul ordre canonique partout
  created_at    timestamptz not null default now()
);

alter table public.courses enable row level security;

-- Public (rôle anon) : lecture des seuls cours publiés.
drop policy if exists "courses: public reads published" on public.courses;
create policy "courses: public reads published"
  on public.courses for select
  to anon, authenticated
  using (published = true);

-- Admin (tout utilisateur authentifié — il n'y a pas d'autre compte que l'admin
-- en v1 ; à restreindre via un claim `role` ou une table `admins` quand l'auth
-- multi-utilisateurs arrivera) : CRUD complet.
drop policy if exists "courses: authenticated full access" on public.courses;
create policy "courses: authenticated full access"
  on public.courses for all
  to authenticated
  using (true)
  with check (true);

-- ─── waitlist ──────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id         bigint generated always as identity primary key,
  tool_id    text not null,
  email      text not null,
  created_at timestamptz not null default now(),
  unique (tool_id, email)                         -- => code 23505 géré par addToWaitlist
);

alter table public.waitlist enable row level security;

-- Public : INSERT uniquement. Aucun SELECT, sous aucune policy (AD-3).
drop policy if exists "waitlist: public can join" on public.waitlist;
create policy "waitlist: public can join"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- ⚠️  NE PAS ajouter de policy SELECT admin sur `waitlist` en « finissant » FR-8.
--     Le seul chemin de lecture admin est la vue agrégée ci-dessous (AD-4).

-- ─── Décompte de la waitlist (AD-4) ────────────────────────────────────────
-- Objectif AD-4 : l'admin voit un DÉCOMPTE par outil, jamais une seule adresse.
--
-- Tension technique : une vue `security_invoker` ne peut pas lire des lignes que
-- l'appelant n'a pas le droit de lire ; or l'admin n'a AUCUNE policy SELECT sur
-- `waitlist` (AD-3). On utilise donc une fonction `security definer` dont le corps
-- ne renvoie QUE l'agrégat — impossible d'en extraire un email — plutôt qu'une
-- policy SELECT large sur la table. C'est l'esprit d'AD-3/AD-4 (zéro accès brut
-- aux emails) mieux respecté que la lettre « vue security_invoker ».
create or replace function public.get_waitlist_counts()
returns table (tool_id text, signups int)
language sql
security definer
set search_path = public
as $$
  select tool_id, count(*)::int as signups
  from public.waitlist
  group by tool_id
$$;

revoke all on function public.get_waitlist_counts() from public, anon;
grant execute on function public.get_waitlist_counts() to authenticated;

-- services/supabase.js :
--   export async function getWaitlistCounts() {
--     const { data, error } = await supabase.rpc('get_waitlist_counts');
--     if (error) throw error;
--     return data; // [{ tool_id, signups }]
--   }

-- Index de tri (AD : order_index est le seul tri).
create index if not exists courses_order_idx on public.courses (order_index);
create index if not exists waitlist_tool_idx on public.waitlist (tool_id);
