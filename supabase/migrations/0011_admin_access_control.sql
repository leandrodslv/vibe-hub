-- ════════════════════════════════════════════════════════════════════════════
-- 0011 — Vraie notion d'admin (corrige une régression de Story 7.1 / PVA-1)
--
-- Avant Story 7.1, seul l'admin avait un compte Supabase Auth : la policy
-- "courses: authenticated full access" (0001) et le grant EXECUTE
-- "to authenticated" sur get_waitlist_counts() (0001) supposaient donc, sans
-- le dire explicitement ailleurs que dans un commentaire, "authenticated ==
-- admin". Le commentaire de 0001 anticipait déjà la suite : « à restreindre
-- via un claim `role` ou une table `admins` quand l'auth multi-utilisateurs
-- arrivera ». C'est arrivé avec Story 7.1 (inscription ouverte à tout
-- visiteur) : n'importe quel compte nouvellement créé héritait du CRUD
-- complet sur `courses`.
--
-- ⚠️  Audit en appliquant cette migration : le schéma réel de `courses`
--     divergeait du fichier 0001_rls_policies.sql du repo — 3 policies non
--     documentées (`auth_insert`/`auth_update`/`auth_delete`, toutes
--     `to authenticated` avec `qual`/`with_check` = `true`) coexistaient avec
--     celles décrites dans 0001, et la policy SELECT publique (`public_select`)
--     ne couvrait QUE `anon`, pas `authenticated`. Sans le second correctif
--     ci-dessous, un utilisateur connecté non-admin (inscrit juste pour ses
--     notifications) n'aurait plus eu aucun accès en lecture aux cours publiés.
--
-- ✅ APPLIQUÉ en production le 2026-09-11 en 4 migrations live :
--    create_admins_and_restrict_admin_surface, fix_courses_rls_gap,
--    tighten_get_waitlist_counts_grant, fix_is_admin_anon_grant. Vérifié après
--    coup via pg_policies — seules restent "courses: admin full access"
--    (ALL, is_admin()) et "courses: anyone reads published" (SELECT,
--    published = true or is_admin()).
--
-- ⚠️  INCIDENT (corrigé le jour même) : la 1ʳᵉ version de cette migration
--     révoquait EXECUTE sur is_admin() pour `anon` — cassant getCourses()
--     pour TOUT visiteur anonyme de /app (« permission denied for function
--     is_admin »), détecté via un test Playwright manuel contre le build de
--     prod. Le fichier ci-dessous reflète déjà le correctif (grant à anon).
--
-- `public.metrics` (0002_metrics.sql) n'existe pas en production — cette
-- migration ne touche donc que `courses`/`waitlist`, le seul périmètre admin
-- réellement exposé.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- Pas de policy : lecture/écriture réservées à service_role / SQL direct —
-- l'app n'a pas besoin de lire cette table, seulement `is_admin()` ci-dessous
-- (même esprit que `metrics`, 0002 : RLS activée, zéro policy client).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- `is_admin()` DOIT rester exécutable par `anon` : la policy "courses: anyone
-- reads published" ci-dessous s'applique aussi à `anon` et appelle is_admin()
-- dans son USING. Une policy RLS s'exécute dans le contexte du rôle appelant
-- (pas en security definer, même si la fonction elle-même l'est) : sans ce
-- grant, CHAQUE lecture anonyme de `courses` échoue avec "permission denied
-- for function is_admin" — y compris pour un cours publié (l'OR ne dispense
-- pas du contrôle de privilège d'exécution). Sans risque : is_admin() renvoie
-- toujours false pour anon (auth.uid() est null), aucune donnée exposée.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ─── courses : CRUD réservé aux admins, lecture ouverte aux cours publiés ───
drop policy if exists "courses: authenticated full access" on public.courses;
drop policy if exists "auth_insert" on public.courses;
drop policy if exists "auth_update" on public.courses;
drop policy if exists "auth_delete" on public.courses;
drop policy if exists "public_select" on public.courses;
drop policy if exists "courses: public reads published" on public.courses;

drop policy if exists "courses: admin full access" on public.courses;
create policy "courses: admin full access"
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "courses: anyone reads published" on public.courses;
create policy "courses: anyone reads published"
  on public.courses for select
  to anon, authenticated
  using (published = true or public.is_admin());

-- ─── get_waitlist_counts : même garde, par un filtre interne (le GRANT
-- Postgres est binaire par rôle, il ne peut pas conditionner sur is_admin()) ─
create or replace function public.get_waitlist_counts()
returns table (tool_id text, signups int)
language sql
security definer
set search_path = public
as $$
  select tool_id, count(*)::int as signups
  from public.waitlist
  where public.is_admin()
  group by tool_id
$$;

revoke all on function public.get_waitlist_counts() from public, anon;
grant execute on function public.get_waitlist_counts() to authenticated;

-- ─── Amorçage : le premier admin ─────────────────────────────────────────────
-- Rejouable sans risque (on conflict do nothing). Pour ajouter un admin plus
-- tard : `insert into public.admins (user_id) select id from auth.users where
-- email = '...' on conflict (user_id) do nothing;` — pas d'UI pour ça encore.
insert into public.admins (user_id)
select id from auth.users where email = 'leandro45.cr7@gmail.com'
on conflict (user_id) do nothing;
