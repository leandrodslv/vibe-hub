// @ts-check
/**
 * Schémas de frontière (Zod) — V1 de docs/ai/roadmap-automatisation.md.
 *
 * Toute donnée qui entre dans l'app depuis l'extérieur (Supabase, Gemini, env,
 * localStorage) passe par un de ces schémas via `parseOrThrow` / `parseOrWarn`.
 */

export { parseOrThrow, parseOrWarn, SchemaError } from './parse.js';
export { envSchema, supabaseUrlSchema, isFilled } from './env.js';
export {
  courseSchema,
  courseArraySchema,
  courseInputSchema,
  courseUpdateSchema,
} from './course.js';
export { waitlistCountSchema, waitlistCountArraySchema } from './waitlist.js';
export {
  geminiTextSchema,
  geminiProxyResponseSchema,
  geminiProxySuccessSchema,
  geminiProxyErrorSchema,
} from './gemini.js';
