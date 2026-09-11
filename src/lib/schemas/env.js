// @ts-check
/**
 * Forme attendue des variables d'environnement.
 *
 * ⚠️ Ce module n'importe QUE `zod` — pas le logger, pas `config/env.js` — pour
 * rester en dehors de tout cycle d'import (`config/env` → `schemas/env`).
 * La validation elle-même (et le message d'erreur) vit dans `src/config/env.js`.
 */

import { z } from 'zod';

/**
 * Valeur « renseignée » : ni vide, ni un placeholder `<...>` / `your_api_key_here`.
 * @param {unknown} v
 */
const isFilled = (v) =>
  typeof v === 'string' &&
  v.trim() !== '' &&
  !v.trim().startsWith('<') &&
  v.trim() !== 'your_api_key_here';

/** URL Supabase : http(s) valide quand elle est renseignée. */
export const supabaseUrlSchema = z
  .string()
  .refine((v) => !isFilled(v) || /^https?:\/\/.+/.test(v.trim()), {
    message: 'doit être une URL http(s)',
  });

/**
 * Schéma indicatif de l'environnement complet. Utilisé en `safeParse` par
 * `config/env.js` : une variable manquante n'empêche pas le boot (dégradation
 * gracieuse), elle produit un avertissement.
 */
export const envSchema = z.object({
  VITE_SUPABASE_URL: supabaseUrlSchema.optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_GEMINI_API_KEY: z.string().optional(),
});

export { isFilled };
