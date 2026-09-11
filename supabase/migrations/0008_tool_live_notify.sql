-- ════════════════════════════════════════════════════════════════════════════
-- 0008 — Notification "Outil Bêta" quand un outil passe en accès live (Story 9.6c)
--
-- Pas de table `tools` (le catalogue est un tableau JS statique côté client,
-- src/components/workspace/tabs/OutilsTab.jsx — en créer une serait un vrai
-- changement d'archi hors périmètre de cette story). Ce chemin reste donc un
-- déclenchement MANUEL : quand l'équipe passe un outil de `status: 'coming'`
-- à `status: 'live'` dans OutilsTab.jsx et redéploie, elle appelle cette
-- fonction une fois — `select notify_tool_live('code-auditor', 'Code Auditor');`
-- AUCUN accès client (RPC révoqué à anon/authenticated) : c'est un outil
-- d'opération, pas une action utilisateur.
--
-- ✅ APPLIQUÉ en production le 2026-09-11 (migration live : create_notify_tool_live).
--     Compromis explicitement validé par l'utilisateur après discussion : la
--     correspondance waitlist.email → auth.users reste interne à la fonction
--     (aucun email n'est jamais exposé au client, seul un `count` est renvoyé).
--     Premier appel refusé par le classifieur d'auto-mode de la session, relancé
--     avec succès après validation explicite de l'utilisateur.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.notify_tool_live(p_tool_id text, p_tool_name text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.notifications (user_id, category, title, link)
  select distinct
    u.id,
    'tool_beta',
    p_tool_name || ' est maintenant disponible.',
    '/app?tab=outils'
  from public.waitlist w
  join auth.users u on u.email = w.email
  join public.notification_preferences p on p.user_id = u.id and p.cat_tool_beta = true
  where w.tool_id = p_tool_id;

  get diagnostics v_count = row_count;
  return v_count;
end$$;

revoke execute on function public.notify_tool_live(text, text) from public, anon, authenticated;
