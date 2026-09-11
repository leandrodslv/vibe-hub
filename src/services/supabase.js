import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../config/env.js';
import { logger, serializeError } from '../lib/logger.js';
import { safeJsonParse } from '../lib/validation.js';
import { parseOrThrow } from '../lib/schemas/parse.js';
import {
  courseSchema,
  courseArraySchema,
  courseInputSchema,
  courseUpdateSchema,
  notificationArraySchema,
  notificationPreferencesSchema,
  DEFAULT_PREFERENCES,
} from '../lib/schemas/index.js';

// Adaptateur unique vers Supabase (Architecture Spine AD-2) : aucun composant
// n'importe `@supabase/supabase-js` ni n'appelle `supabase.auth.*` directement.
//
// `createClient` lève SYNCHRONEMENT (`supabaseUrl is required.`) si l'URL est
// vide → sans garde, tout le bundle plante au chargement (page blanche) dès que
// l'env n'est pas renseigné (preview CI, fork sans secrets). On passe alors une
// URL sentinelle : le client existe, l'app démarre, et chaque appel réseau
// échoue proprement — les adaptateurs dégradent (cf. `isSupabaseConfigured`,
// `ModulesTab` : spinner → message d'erreur, jamais l'ErrorBoundary).
const FALLBACK_URL = 'https://unconfigured.supabase.invalid';
export const supabase = createClient(
  env.supabaseUrl || FALLBACK_URL,
  env.supabaseAnonKey || 'unconfigured-anon-key'
);

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

/** Inscription (gate progressif du Workspace — PVA-1). @returns {Promise<{ session?: import('@supabase/supabase-js').Session | null, error?: string }>} */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return { session: data.session };
}

/** @returns {Promise<import('@supabase/supabase-js').User | null>} l'utilisateur connecté, ou null. */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * L'utilisateur connecté a-t-il les droits admin ? Purement déclaratif côté
 * client (confort UX, AdminPage.jsx) — la vraie frontière est la RLS
 * Postgres (`is_admin()`, policies `courses`/`get_waitlist_counts`, AD-3) :
 * un faux positif ici ne donnerait aucun accès réel.
 * @returns {Promise<boolean>}
 */
export async function isAdmin() {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) rethrow('isAdmin', error);
  return Boolean(data);
}

/* ─── Notifications (Epic 7/8, PVA-1) ──────────────────────────────────────
 *
 * Deux modes :
 *  - Supabase configuré  → tables `notifications` / `notification_preferences`,
 *    portée par utilisateur via RLS (`auth.uid()`), création serveur uniquement (AD-8).
 *  - Supabase absent      → repli `localStorage` préfixé `notif_*` (AD-6) : le flux
 *    reste utilisable en dev/preview sans backend, avec des données de démo.
 *
 * Le cas « configuré mais non connecté » est géré en amont par le hook
 * `useNotifications` (il n'appelle pas ces wrappers tant que `authenticated` est faux).
 */

const NOTIF_LS_KEY = 'notif_items';
const PREFS_LS_KEY = 'notif_prefs';

const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-1',
    category: 'new_course',
    title: 'Nouvelle leçon disponible : Prompt Engineering pour Designers',
    body: null,
    link: '/app?tab=modules',
    read: false,
    dismissed: false,
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: 'demo-2',
    category: 'milestone',
    title: "Tu as complété Module 2 : Fondamentaux de l'IA ! 🎉",
    body: null,
    link: '/app?tab=modules',
    read: false,
    dismissed: false,
    created_at: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: 'demo-3',
    category: 'tool_beta',
    title: 'Nouveau tool en accès bêta : Code Auditor',
    body: null,
    link: '/app?tab=outils',
    read: true,
    dismissed: false,
    created_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
];

function lsReadNotifications() {
  if (typeof localStorage === 'undefined') return DEMO_NOTIFICATIONS;
  const stored = localStorage.getItem(NOTIF_LS_KEY);
  if (stored === null) {
    localStorage.setItem(NOTIF_LS_KEY, JSON.stringify(DEMO_NOTIFICATIONS));
    return DEMO_NOTIFICATIONS;
  }
  return safeJsonParse(stored, DEMO_NOTIFICATIONS);
}

function lsWriteNotifications(items) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(NOTIF_LS_KEY, JSON.stringify(items));
  }
}

/** @returns {Promise<import('../lib/schemas/notification.js').Notification[]>} flux de l'utilisateur, non archivé, plus récent d'abord. */
export async function getNotifications() {
  if (!isSupabaseConfigured()) {
    const items = lsReadNotifications()
      .filter((n) => !n.dismissed)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return parseOrThrow(notificationArraySchema, items, 'getNotifications:ls');
  }
  const { data, error } = await supabase
    .from('notifications')
    .select('id, category, title, body, link, read, dismissed, created_at')
    .eq('dismissed', false)
    .order('created_at', { ascending: false });

  if (error) rethrow('getNotifications', error);
  return parseOrThrow(notificationArraySchema, data, 'getNotifications');
}

/** Marque une notification lue. */
export async function markNotificationRead(id) {
  if (!isSupabaseConfigured()) {
    lsWriteNotifications(
      lsReadNotifications().map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    return;
  }
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) rethrow('markNotificationRead', error);
}

/** Marque toutes les notifications non lues comme lues. */
export async function markAllNotificationsRead() {
  if (!isSupabaseConfigured()) {
    lsWriteNotifications(lsReadNotifications().map((n) => ({ ...n, read: true })));
    return;
  }
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
    .eq('dismissed', false);
  if (error) rethrow('markAllNotificationsRead', error);
}

/** Archive une notification (elle ne revient pas au rechargement). */
export async function dismissNotification(id) {
  if (!isSupabaseConfigured()) {
    lsWriteNotifications(
      lsReadNotifications().map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );
    return;
  }
  const { error } = await supabase.from('notifications').update({ dismissed: true }).eq('id', id);
  if (error) rethrow('dismissNotification', error);
}

/** @returns {Promise<import('../lib/schemas/notification.js').NotificationPreferences>} */
export async function getNotificationPreferences() {
  if (!isSupabaseConfigured()) {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(PREFS_LS_KEY) : null;
    const raw = stored ? safeJsonParse(stored, {}) : {};
    return parseOrThrow(notificationPreferencesSchema, raw, 'getNotificationPreferences:ls');
  }
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(
      'app_enabled, email_enabled, cat_new_course, cat_tool_beta, cat_milestone, quiet_from, quiet_to, reminder_frequency'
    )
    .maybeSingle();

  if (error) rethrow('getNotificationPreferences', error);
  // Le trigger `on_auth_user_created_notif_prefs` matérialise la ligne ; ce repli
  // couvre un compte créé avant la migration.
  return parseOrThrow(
    notificationPreferencesSchema,
    data ?? DEFAULT_PREFERENCES,
    'getNotificationPreferences'
  );
}

/**
 * Applique un patch partiel de préférences. Renvoie l'état complet à jour.
 * @param {Partial<import('../lib/schemas/notification.js').NotificationPreferences>} patch
 */
export async function updateNotificationPreferences(patch) {
  if (!isSupabaseConfigured()) {
    const current = await getNotificationPreferences();
    const next = parseOrThrow(
      notificationPreferencesSchema,
      { ...current, ...patch },
      'updateNotificationPreferences:ls'
    );
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREFS_LS_KEY, JSON.stringify(next));
    }
    return next;
  }
  const user = await getCurrentUser();
  if (!user) rethrow('updateNotificationPreferences', { message: 'Non authentifié' });

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() })
    .select(
      'app_enabled, email_enabled, cat_new_course, cat_tool_beta, cat_milestone, quiet_from, quiet_to, reminder_frequency'
    )
    .single();

  if (error) rethrow('updateNotificationPreferences', error);
  return parseOrThrow(notificationPreferencesSchema, data, 'updateNotificationPreferences');
}

/**
 * S'abonne aux changements des notifications de l'utilisateur connecté (AD-9).
 * Repli silencieux (no-op) si Supabase n'est pas configuré — le hook fait alors
 * du polling.
 * @param {() => void} onChange
 * @returns {() => void} désabonnement
 */
export function onNotificationsChange(onChange) {
  if (!isSupabaseConfigured()) return () => {};
  // Topic unique par abonnement : `useNotifications()` est monté plusieurs fois en
  // parallèle sur la même page (Sidebar, Navbar landing, NotificationsTab — voir le
  // commentaire du hook), et React StrictMode (dev) double-invoque chaque effet de
  // montage. Un topic fixe ('notifications:self') faisait retomber ces appels
  // concurrents sur le même objet channel déjà `subscribe()`, et Supabase rejette
  // tout `.on(...)` ajouté après coup avec une exception synchrone — non rattrapée,
  // elle remontait jusqu'à l'ErrorBoundary racine et cassait toute la page.
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(`notifications:self:${suffix}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () =>
      onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Enregistre la complétion d'un cours par l'utilisateur connecté (Story 9.6b) :
 * déclenche server-side une notification « Succès » via le trigger Postgres
 * `on_course_progress_insert` (AD-8 — le client n'insère jamais dans `notifications`
 * lui-même). Upsert idempotent : un clic répété ou un retry réseau ne recrée pas
 * la notification (`on conflict do nothing` sur la clé `(user_id, course_id)`).
 *
 * No-op silencieux si Supabase n'est pas configuré ou si personne n'est connecté —
 * la progression reste alors purement locale/éphémère (AD-6), comme aujourd'hui.
 * @param {string} courseId
 */
export async function recordCourseCompletion(courseId) {
  if (!isSupabaseConfigured()) return;
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from('course_progress')
    .upsert(
      { user_id: user.id, course_id: courseId },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    );
  if (error) rethrow('recordCourseCompletion', error);
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
