-- ════════════════════════════════════════════════════════════════════════════
-- 0006 — course_progress : complétion de cours trackée serveur (Story 9.6b)
--
-- Extension d'AD-6/PVA-1 : la complétion (binaire) devient partiellement
-- serveur — la progression fine (%) reste locale/éphémère (ModulesTab.jsx),
-- seule la complétion promue, parce que c'est le seul événement qui doit
-- déclencher une notification server-side (AD-8).
--
-- ✅ APPLIQUÉ en production le 2026-09-11 (migration live : create_course_progress).
--
-- Note : `courses.id` est `uuid` en production (le fichier repo
-- 0001_rls_policies.sql documentait un état cible obsolète en `bigint
-- identity` — audité via `list_tables` avant d'appliquer cette migration).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.course_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.course_progress enable row level security;

drop policy if exists "course_progress: owner reads own" on public.course_progress;
create policy "course_progress: owner reads own"
  on public.course_progress for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Auto-déclaré par l'utilisateur (pas d'anti-triche en v1) : l'écriture cliente
-- porte sur SA PROPRE complétion, jamais sur la notification elle-même (AD-8 —
-- l'insert dans `notifications` se fait uniquement via le trigger ci-dessous).
drop policy if exists "course_progress: owner records own completion" on public.course_progress;
create policy "course_progress: owner records own completion"
  on public.course_progress for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create or replace function public.handle_course_progress_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  select title into v_title from public.courses where id = new.course_id;
  insert into public.notifications (user_id, category, title, link)
  values (
    new.user_id,
    'milestone',
    'Vous avez terminé ' || coalesce(v_title, 'un cours') || '.',
    '/app?tab=modules'
  );
  return new;
end$$;

-- Déclenché uniquement sur un INSERT effectif : le client upsert avec
-- `on conflict do nothing` (services/supabase.js:recordCourseCompletion), donc
-- une re-complétion (clic répété, retry réseau) ne relance pas la fonction —
-- idempotence naturelle par la clé primaire.
drop trigger if exists on_course_progress_insert on public.course_progress;
create trigger on_course_progress_insert
  after insert on public.course_progress
  for each row execute function public.handle_course_progress_notify();

revoke execute on function public.handle_course_progress_notify() from public, anon, authenticated;
