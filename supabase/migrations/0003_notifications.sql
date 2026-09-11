-- ════════════════════════════════════════════════════════════════════════════
-- 0003 — Notification Center : notifications + notification_preferences
--
-- Epics : epics-notifications.md (Epic 7, stories 7.2 / 7.3).
-- Spine : ARCHITECTURE-SPINE.md § Post-v1 Amendments (PVA-1), invariants
--         AD-7 (accès uniquement via services/supabase.js),
--         AD-8 (création serveur uniquement — le client n'a pas d'INSERT),
--         AD-10 (colonnes snake_case, id uuid, tri created_at DESC pour un flux).
--
-- NFR6 : isolation par utilisateur, appliquée par RLS — jamais par le React.
--
-- ✅ APPLIQUÉ en production le 2026-09-11 sur le projet Vibe Hub (schéma audité
--    au préalable : ni `notifications` ni `notification_preferences` n'existaient).
--    Migration live : 20260911134408_create_notifications. Durcissement RLS
--    complémentaire dans 0004_notifications_hardening.sql (advisor sécurité).
--
-- Dépend de : Supabase Auth actif sur le Workspace (Story 7.1, gate progressif).
--             `auth.uid()` doit résoudre l'utilisateur connecté.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Catégories ────────────────────────────────────────────────────────────
-- Valeurs reconnues par le flux ET par les filtres de préférences (FR-15).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_category') then
    create type public.notification_category as enum ('new_course', 'milestone', 'tool_beta', 'reminder');
  end if;
end$$;

-- ─── notifications ─────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category    public.notification_category not null,
  title       text not null,
  body        text,
  link        text,                                   -- deep-link interne (/app?tab=…) ou URL externe
  read        boolean not null default false,
  dismissed   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Lecture : chacun ne voit QUE ses lignes non archivées (NFR6).
drop policy if exists "notifications: owner reads own" on public.notifications;
create policy "notifications: owner reads own"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Écriture client : uniquement read / dismissed sur ses propres lignes.
-- (title/body/link/category ne sont jamais modifiables côté client.)
drop policy if exists "notifications: owner updates own status" on public.notifications;
create policy "notifications: owner updates own status"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- AD-8 : PAS de policy INSERT / DELETE pour anon ni authenticated. Les lignes
-- sont créées uniquement par les générateurs serveur (triggers / Edge Functions,
-- story 9.6) qui tournent en `service_role` et court-circuitent la RLS.

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc)
  where dismissed = false;

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read = false and dismissed = false;

-- ─── notification_preferences ─────────────────────────────────────────────
create table if not exists public.notification_preferences (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  app_enabled        boolean not null default true,
  email_enabled      boolean not null default false,
  cat_new_course     boolean not null default true,   -- « Nouvelles Leçons »
  cat_tool_beta      boolean not null default false,  -- « Mises à jour Outils »
  cat_milestone      boolean not null default true,   -- « Jalons & Progrès »
  quiet_from         time,                            -- null = heures silencieuses désactivées
  quiet_to           time,
  reminder_frequency text not null default 'weekly'
                     check (reminder_frequency in ('daily', 'weekly', 'never')),
  updated_at         timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "prefs: owner reads own" on public.notification_preferences;
create policy "prefs: owner reads own"
  on public.notification_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "prefs: owner upserts own" on public.notification_preferences;
create policy "prefs: owner upserts own"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "prefs: owner updates own" on public.notification_preferences;
create policy "prefs: owner updates own"
  on public.notification_preferences for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Matérialise une ligne de préférences par défaut à la création du compte, pour
-- que le chemin de lecture ne renvoie jamais un null (story 7.2 AC).
create or replace function public.handle_new_user_notification_prefs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created_notif_prefs on auth.users;
create trigger on_auth_user_created_notif_prefs
  after insert on auth.users
  for each row execute function public.handle_new_user_notification_prefs();

-- ─── Realtime (AD-9) ──────────────────────────────────────────────────────
-- Le badge « non lus » s'abonne aux changements des lignes de l'utilisateur.
alter publication supabase_realtime add table public.notifications;
