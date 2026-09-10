import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../config/env.js';
import { logger, serializeError } from '../lib/logger.js';
import { parseOrThrow } from '../lib/schemas/parse.js';
import {
  courseSchema,
  courseArraySchema,
  courseInputSchema,
  courseUpdateSchema,
} from '../lib/schemas/index.js';

// Adaptateur unique vers Supabase (Architecture Spine AD-2) : aucun composant
// n'importe `@supabase/supabase-js` ni n'appelle `supabase.auth.*` directement.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

/**
 * Loggue et relance : le contexte part dans l'observabilité, l'appelant garde la
 * main. Les erreurs PostgREST sont des objets nus (`{ message, code, ... }`) —
 * on les enveloppe dans une vraie `Error` pour garantir une stack et un type
 * uniforme aux appelants et à l'ErrorBoundary (invariant vérifié par la
 * simulation V4).
 */
function rethrow(op, error) {
  logger.error('supabase:error', { op, ...serializeError(error) });
  if (error instanceof Error) throw error;

  /** @type {Error & { code?: string }} */
  const wrapped = new Error(error?.message || `Échec Supabase (${op})`);
  wrapped.name = 'SupabaseError';
  wrapped.cause = error;
  if (error?.code) wrapped.code = error.code;
  throw wrapped;
}

/* ─── Auth (AD-2 : wrappers, jamais supabase.auth.* dans un composant) ─── */

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { session: data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) rethrow('signOut', error);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) rethrow('getSession', error);
  return data.session;
}

/**
 * @param {(session: import('@supabase/supabase-js').Session | null) => void} callback
 * @returns {() => void} désabonnement
 */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/* ─── Waitlist ─── */
export async function addToWaitlist(toolId, email) {
  if (!isSupabaseConfigured()) return { error: 'Service indisponible.' };
  const { error } = await supabase.from('waitlist').insert({ tool_id: toolId, email });

  if (!error) return { success: true };
  if (error.code === '23505') return { duplicate: true };
  logger.warn('supabase:addToWaitlist', { code: error.code });
  return { error: error.message };
}

/* ─── Courses ─── */
export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('order_index', { ascending: true });

  if (error) rethrow('getCourses', error);
  return parseOrThrow(courseArraySchema, data, 'getCourses');
}

export async function getAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) rethrow('getAllCourses', error);
  return parseOrThrow(courseArraySchema, data, 'getAllCourses');
}

export async function createCourse(course) {
  // Valide le payload AVANT l'aller-retour réseau : un champ oublié ou de trop
  // (dérive du formulaire) échoue ici, pas en base.
  const payload = parseOrThrow(courseInputSchema, course, 'createCourse:input');
  const { data, error } = await supabase.from('courses').insert(payload).select().single();

  if (error) rethrow('createCourse', error);
  return parseOrThrow(courseSchema, data, 'createCourse');
}

export async function updateCourse(id, updates) {
  const patch = parseOrThrow(courseUpdateSchema, updates, 'updateCourse:input');
  const { data, error } = await supabase
    .from('courses')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) rethrow('updateCourse', error);
  return parseOrThrow(courseSchema, data, 'updateCourse');
}

export async function deleteCourse(id) {
  const { error } = await supabase.from('courses').delete().eq('id', id);

  if (error) rethrow('deleteCourse', error);
}
