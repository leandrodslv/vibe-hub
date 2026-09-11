-- ════════════════════════════════════════════════════════════════════════════
-- 0007 — Notification "Nouveau Cours" à la publication (Story 9.6a)
--
-- Fan-out à tous les utilisateurs ayant la catégorie activée : respecte les
-- préférences au moment de la génération (FR-15), comme demandé par l'AC.
--
-- ✅ APPLIQUÉ en production le 2026-09-11 (migration live : create_course_published_notify).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.handle_course_published_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and coalesce(old.published, false) = false and new.published = true)
     or (tg_op = 'INSERT' and new.published = true) then
    insert into public.notifications (user_id, category, title, link)
    select
      p.user_id,
      'new_course',
      'Nouvelle leçon disponible : ' || new.title,
      '/app?tab=modules'
    from public.notification_preferences p
    where p.cat_new_course = true;
  end if;
  return new;
end$$;

drop trigger if exists on_course_published_notify on public.courses;
create trigger on_course_published_notify
  after insert or update on public.courses
  for each row execute function public.handle_course_published_notify();

revoke execute on function public.handle_course_published_notify() from public, anon, authenticated;
