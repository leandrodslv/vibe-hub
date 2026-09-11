// @ts-check
/**
 * Catalogues de cours déterministes servis par le mock PostgREST
 * (`src/test/mocks/handlers/supabase.js`). Forme = colonnes de la table
 * `public.courses` (cf. supabase/migrations/0001_rls_policies.sql).
 */

/** Une ligne `courses` valide, surchargeable. */
export const makeCourseRow = (over = {}) => ({
  id: 1,
  module_name: 'MODULE 1',
  title: 'Introduction',
  description: null,
  duration: '12:45',
  image_url: null,
  video_url: null,
  published: true,
  order_index: 1,
  created_at: '2026-01-01T00:00:00Z',
  ...over,
});

export const courseScenarios = {
  /** Catalogue nominal, 3 cours publiés. */
  nominal: [
    makeCourseRow({ id: 1, title: 'Introduction', order_index: 1 }),
    makeCourseRow({ id: 2, title: 'Midjourney v6', module_name: 'MODULE 2', order_index: 2 }),
    makeCourseRow({ id: 3, title: 'Design systems & IA', module_name: 'MODULE 3', order_index: 3 }),
  ],

  /** Catalogue vide. */
  empty: [],

  /**
   * Ligne au mauvais format : `title` absent (colonne renommée côté DB).
   * Doit déclencher une `SchemaError` dans `getCourses` (V1).
   */
  malformedRow: [{ id: 9, module_name: 'X', published: true, order_index: 1 }],
};
