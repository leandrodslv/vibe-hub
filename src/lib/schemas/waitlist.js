// @ts-check
/**
 * Contrat de la RPC `public.get_waitlist_counts()` (Architecture Spine AD-4).
 *
 * La fonction ne renvoie QUE des agrégats — jamais une adresse e-mail. Le schéma
 * verrouille cette garantie côté client : si un jour la RPC renvoyait une colonne
 * `email`, `.strict()` ferait échouer le parse au lieu de l'afficher.
 */

import { z } from 'zod';

/** Une ligne d'agrégat : { tool_id, signups }. */
export const waitlistCountSchema = z
  .object({
    tool_id: z.string(),
    signups: z.number().int().nonnegative(),
  })
  .strict();

export const waitlistCountArraySchema = z.array(waitlistCountSchema);

/** @typedef {z.infer<typeof waitlistCountSchema>} WaitlistCount */
