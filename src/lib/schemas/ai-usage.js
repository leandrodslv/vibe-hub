// @ts-check
/**
 * Contrats des RPC/tables Epic 11 (epics-ai-ops.md, AD-12/AD-13).
 *
 * `get_ai_usage_summary()` n'agrège QUE des compteurs de tokens — jamais le
 * contenu des prompts/réponses. `ai_key_rotations` ne contient QUE de la
 * metadata de rotation — jamais la clé elle-même. `.strict()` verrouille les
 * deux garanties côté client, même esprit que `waitlistCountSchema`.
 */

import { z } from 'zod';

export const aiUsageSummaryRowSchema = z
  .object({
    endpoint: z.enum(['gemini-proxy', 'course-draft']),
    window_days: z.number().int().positive(),
    calls: z.number().int().nonnegative(),
    prompt_tokens: z.number().int().nonnegative(),
    candidates_tokens: z.number().int().nonnegative(),
    total_tokens: z.number().int().nonnegative(),
  })
  .strict();

export const aiUsageSummaryArraySchema = z.array(aiUsageSummaryRowSchema);

export const keyRotationSchema = z
  .object({
    id: z.number().int(),
    rotated_at: z.string(),
    rotated_by: z.string().nullable(),
    note: z.string().nullable(),
  })
  .strict();

export const keyRotationArraySchema = z.array(keyRotationSchema);

/** @typedef {z.infer<typeof aiUsageSummaryRowSchema>} AiUsageSummaryRow */
/** @typedef {z.infer<typeof keyRotationSchema>} KeyRotation */
