// ════════════════════════════════════════════════════════════════════════════
// Edge Function `notifications-digest` — Story 9.4 (Epic 9, AD-8)
//
// Résumé email quotidien : liste les notifications non lues de chaque
// utilisateur ayant activé « Notifications par email » (`email_enabled`),
// depuis son dernier digest, et envoie un email via Resend. Jamais côté
// client (AD-8) : appelée uniquement par `pg_cron` (server-side), jamais par
// le navigateur.
//
// Les destinataires et le contenu viennent de `public.get_digest_candidates()`
// (migration `create_digest_candidates`, `security definer`, révoquée pour
// anon/authenticated) — la fonction ne fait ELLE-MÊME aucune requête SQL
// directe sur `auth.users`, tout le filtrage/jointure vit en base.
//
// Rate-bound (NFR7) : `get_digest_candidates()` n'inclut que les lignes dont
// `last_digest_sent_at` est absent ou vieux d'au moins un jour — au plus un
// digest par utilisateur par jour, quelle que soit la fréquence des runs.
// `mark_digest_sent()` n'est appelé qu'après un envoi Resend réussi : un échec
// d'envoi laisse l'utilisateur éligible au prochain run planifié (retry borné
// par la cadence du cron, jamais de fan-out).
//
// Déploiement (⚠️ PAS ENCORE FAIT — refusé par le classifieur auto-mode de la
// session qui l'a écrite ; à lancer manuellement) :
//   supabase functions deploy notifications-digest
// Secrets requis (à poser manuellement, jamais en VITE_*, AD-1) :
//   supabase secrets set RESEND_API_KEY=...        # clé API Resend (compte à créer)
//   supabase secrets set SITE_URL=https://...       # optionnel, défaut ci-dessous
//   supabase secrets set DIGEST_FROM_EMAIL=...      # optionnel, expéditeur vérifié Resend
// Planification (à faire manuellement dans le SQL Editor du dashboard — la
// création d'un job pg_cron n'est pas automatisable depuis cette session) :
//   voir supabase/migrations/0010_notifications_digest.sql, section « à exécuter manuellement ».
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://vibe-hub.vercel.app';
const DIGEST_FROM_EMAIL =
  Deno.env.get('DIGEST_FROM_EMAIL') ?? 'Vibe Hub <notifications@vibehub.app>';

type DigestNotification = { title: string; link: string | null; category: string };
type DigestCandidate = { user_id: string; email: string; notifications: DigestNotification[] };

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return s.replace(/[&<>"']/g, (c) => map[c] ?? c);
}

async function sendDigestEmail(email: string, notifications: DigestNotification[]): Promise<void> {
  const items = notifications.map((n) => `<li>${escapeHtml(n.title)}</li>`).join('');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: DIGEST_FROM_EMAIL,
      to: email,
      subject: `Vibe Hub — ${notifications.length} notification${notifications.length > 1 ? 's' : ''} à consulter`,
      html: `<p>Voici ce que vous avez manqué :</p><ul>${items}</ul><p><a href="${SITE_URL}/app?tab=notifications">Voir dans l'app</a></p>`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  if (!RESEND_API_KEY) {
    console.error(
      JSON.stringify({
        level: 'error',
        at: 'notifications-digest',
        reason: 'RESEND_API_KEY manquant',
      })
    );
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY manquant' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase.rpc('get_digest_candidates');
  if (error) {
    console.error(JSON.stringify({ level: 'error', at: 'notifications-digest', code: error.code }));
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const candidates = (data ?? []) as DigestCandidate[];
  let sent = 0;
  let failed = 0;

  for (const c of candidates) {
    try {
      await sendDigestEmail(c.email, c.notifications);
      const { error: markError } = await supabase.rpc('mark_digest_sent', { p_user_id: c.user_id });
      if (markError) throw markError;
      sent++;
    } catch (err) {
      failed++;
      // Pas de retry immédiat : l'utilisateur reste éligible (last_digest_sent_at
      // inchangé) pour le prochain run planifié — le retry est borné par la
      // cadence du cron elle-même (NFR7), jamais fanned out.
      console.error(
        JSON.stringify({
          level: 'error',
          at: 'notifications-digest',
          userId: c.user_id,
          message: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }

  return new Response(JSON.stringify({ candidates: candidates.length, sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
