// ════════════════════════════════════════════════════════════════════════════
// Helper partagé — Epic 11 (epics-ai-ops.md), AD-12.
//
// Un seul appel : logAiUsage(endpoint, model, res.usageMetadata). Best-effort,
// jamais bloquant :
//   - si usageMetadata est absent (SDK différent, forme inattendue), l'appel
//     est un no-op silencieux — pas de ligne de nulls ;
//   - l'écriture réelle tourne via EdgeRuntime.waitUntil() quand disponible
//     (Deno Deploy / Supabase Edge Runtime), donc APRÈS que la réponse HTTP
//     soit déjà partie — aucune latence ajoutée pour l'appelant ; à défaut,
//     elle tourne en fire-and-forget (jamais awaited par le caller) ;
//   - toute erreur d'écriture est attrapée et seulement loguée en console —
//     ne remonte jamais à l'appelant, ne change jamais la réponse déjà
//     calculée (même esprit que le `finally` de suppression de fichier dans
//     course-draft : le chemin nominal ne doit jamais dépendre du ménage).
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export function logAiUsage(
  endpoint: 'gemini-proxy' | 'course-draft',
  model: string,
  usage: GeminiUsageMetadata | undefined
): void {
  if (!usage || typeof usage.totalTokenCount !== 'number') return;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const write = async () => {
    try {
      const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error } = await serviceClient.from('ai_usage_log').insert({
        endpoint,
        model,
        prompt_tokens: usage.promptTokenCount ?? 0,
        candidates_tokens: usage.candidatesTokenCount ?? 0,
        total_tokens: usage.totalTokenCount ?? 0,
      });
      if (error) throw error;
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'error',
          at: 'ai-usage-log',
          endpoint,
          message: err instanceof Error ? err.message : String(err),
        })
      );
    }
  };

  const promise = write();
  if (typeof EdgeRuntime !== 'undefined') {
    EdgeRuntime.waitUntil(promise);
  }
}
