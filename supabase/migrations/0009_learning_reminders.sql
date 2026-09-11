-- ════════════════════════════════════════════════════════════════════════════
-- 0009 — Rappels d'apprentissage périodiques (Story 9.5, AD-8, NFR7)
--
-- Cadence lue depuis `notification_preferences.reminder_frequency`
-- (daily/weekly/never), déjà pilotable par l'utilisateur (Story 9.1).
--
-- ✅ APPLIQUÉ en production le 2026-09-11 (migration live : create_learning_reminders,
--    colonne + fonction seulement).
--
-- ⚠️  PLANIFICATION NON APPLIQUÉE. `cron.schedule(...)` a été refusé par le
--     classifieur d'auto-mode de cette session (créer un job récurrent qui
--     tourne indéfiniment sans validation humaine à chaque exécution est une
--     action jugée trop engageante pour être prise sans vous). À exécuter
--     manuellement, une fois, dans le SQL Editor du dashboard Supabase :
--
--   create extension if not exists pg_cron;
--
--   select cron.schedule(
--     'learning-reminders-hourly',
--     '0 * * * *',                                  -- toutes les heures ; la
--     $$select public.run_learning_reminders();$$    -- fonction ne crée un rappel
--   );                                               -- que si l'intervalle choisi
--                                                     -- est réellement écoulé.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.notification_preferences
  add column if not exists last_reminder_at timestamptz;

create or replace function public.run_learning_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Idempotent par construction : une ligne n'est éligible que si l'intervalle choisi
  -- est réellement écoulé depuis le dernier rappel (ou qu'elle n'en a jamais eu) — un
  -- run supplémentaire (retry, double déclenchement cron) ne recrée rien tant que
  -- l'intervalle n'est pas passé (AC "jamais plus d'un rappel par intervalle").
  with due as (
    select user_id
    from public.notification_preferences
    where reminder_frequency <> 'never'
      and (
        last_reminder_at is null
        or (reminder_frequency = 'daily' and last_reminder_at < now() - interval '1 day')
        or (reminder_frequency = 'weekly' and last_reminder_at < now() - interval '7 days')
      )
  ),
  inserted as (
    insert into public.notifications (user_id, category, title, link)
    select user_id, 'reminder', 'Envie de continuer où vous en étiez ?', '/app?tab=modules'
    from due
    returning user_id
  )
  update public.notification_preferences p
  set last_reminder_at = now()
  from inserted i
  where p.user_id = i.user_id;

  get diagnostics v_count = row_count;
  return v_count;
end$$;

revoke execute on function public.run_learning_reminders() from public, anon, authenticated;
