// @ts-check
/**
 * Contrat de la table `public.courses` (cf. supabase/migrations/0001_rls_policies.sql).
 *
 * Ce que le schéma attrape :
 *  - une colonne rencommée côté DB (`title` → `name`) → échoue au `select('*')` ;
 *  - une ligne `null` / un objet d'erreur Supabase passé pour de la donnée ;
 *  - un mauvais type (`published` en `"true"` string, `order_index` en texte).
 *
 * Ce qu'il ne fait PAS : imposer des règles métier. Une `description` vide ou une
 * `image_url` absente est une donnée valide — les composants dégradent déjà
 * (`course.image_url || course.image || ''`).
 */

import { z } from 'zod';

/** bigint identity : nombre dans la plage sûre, string au-delà. */
const id = z.union([z.number(), z.string()]);

/** Ligne telle que renvoyée par Supabase (`select('*')`). */
export const courseSchema = z
  .object({
    id,
    title: z.string(),
    module_name: z.string().nullish(),
    description: z.string().nullish(),
    duration: z.string().nullish(),
    image_url: z.string().nullish(),
    video_url: z.string().nullish(),
    published: z.boolean(),
    order_index: z.number(),
    created_at: z.string().nullish(),
  })
  // tolère des colonnes ajoutées côté DB sans casser le front
  .passthrough();

/** @typedef {z.infer<typeof courseSchema>} Course */

export const courseArraySchema = z.array(courseSchema);

/**
 * Payload accepté par `createCourse` / `updateCourse` (jamais `id` ni `created_at`,
 * gérés par Postgres). `order_index` est ajouté par l'appelant à la création.
 */
export const courseInputSchema = z
  .object({
    title: z.string().min(1, 'titre requis'),
    module_name: z.string().min(1, 'module requis'),
    description: z.string().nullish(),
    duration: z.string().nullish(),
    image_url: z.string().nullish(),
    video_url: z.string().nullish(),
    published: z.boolean(),
    order_index: z.number().int(),
  })
  .strict();

/** Mise à jour partielle : `updateCourse(id, { published: true })` doit passer. */
export const courseUpdateSchema = courseInputSchema.partial();
