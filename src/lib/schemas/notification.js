// @ts-check
/**
 * Contrats de frontière — tables `notifications` et `notification_preferences`
 * (migration 0003, Architecture Spine PVA-1 / AD-7 / AD-10).
 *
 * Toute ligne qui entre dans l'app depuis Supabase OU depuis le repli
 * `localStorage` (story 7.3) passe par un de ces schémas via `parseOrThrow`.
 */

import { z } from 'zod';

/** Catégories reconnues par le flux et par les filtres de préférences (FR-15). */
export const NOTIFICATION_CATEGORIES = /** @type {const} */ ([
  'new_course',
  'milestone',
  'tool_beta',
  'reminder',
]);

export const notificationCategorySchema = z.enum(NOTIFICATION_CATEGORIES);

/** Une notification telle que stockée (Supabase) ou simulée (localStorage). */
export const notificationSchema = z
  .object({
    id: z.string(),
    category: notificationCategorySchema,
    title: z.string(),
    body: z.string().nullable().default(null),
    link: z.string().nullable().default(null),
    read: z.boolean(),
    dismissed: z.boolean().default(false),
    created_at: z.string(),
  })
  .strip(); // tolère user_id & co. renvoyés par PostgREST sans les exposer

export const notificationArraySchema = z.array(notificationSchema);

const REMINDER_FREQUENCIES = /** @type {const} */ (['daily', 'weekly', 'never']);

/** Une heure `HH:MM` (input type=time) ou null (heures silencieuses désactivées). */
const timeOrNull = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format attendu HH:MM')
  .nullable();

export const notificationPreferencesSchema = z
  .object({
    app_enabled: z.boolean().default(true),
    email_enabled: z.boolean().default(false),
    cat_new_course: z.boolean().default(true),
    cat_tool_beta: z.boolean().default(false),
    cat_milestone: z.boolean().default(true),
    quiet_from: timeOrNull.default(null),
    quiet_to: timeOrNull.default(null),
    reminder_frequency: z.enum(REMINDER_FREQUENCIES).default('weekly'),
  })
  .strip();

/** Défauts alignés sur la migration 0003 — utilisés par le repli localStorage. */
export const DEFAULT_PREFERENCES = notificationPreferencesSchema.parse({});

/** Mappe une catégorie de notif vers la clé de préférence qui la gouverne (FR-15). */
export const CATEGORY_PREF_KEY = /** @type {const} */ ({
  new_course: 'cat_new_course',
  tool_beta: 'cat_tool_beta',
  milestone: 'cat_milestone',
  reminder: 'cat_milestone', // les rappels suivent l'opt-in « Jalons & Progrès »
});

/** @typedef {z.infer<typeof notificationSchema>} Notification */
/** @typedef {z.infer<typeof notificationPreferencesSchema>} NotificationPreferences */
