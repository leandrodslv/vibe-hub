// @ts-check
/**
 * Source unique du flux de notifications et du compteur « non lus », partagée
 * entre l'onglet Notifications et le badge de la cloche (Sidebar, TopBar mobile,
 * Navbar landing).
 *
 * Ce n'est PAS un store global (AD-6) : chaque consommateur monte sa propre
 * instance, tenue à jour par l'abonnement Realtime partagé (`onNotificationsChange`,
 * AD-9) avec repli polling. Primitive d'abonnement dans l'esprit de `onAuthChange`.
 *
 * Filtrage (FR-15) appliqué ici pour que le flux ET le badge voient la même chose :
 *  - catégorie désactivée      → notifications masquées + exclues du compteur
 *  - « Notifications dans l'app » OFF ou heures silencieuses actives
 *                              → `badgeCount` = 0 (le flux, lui, reste visible)
 *
 * @see _bmad-output/planning-artifacts/epics-notifications.md — stories 7.4, 8.x, 9.2, 9.3
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured } from '../config/env.js';
import { CATEGORY_PREF_KEY, DEFAULT_PREFERENCES } from '../lib/schemas/notification.js';
import { logger, serializeError } from '../lib/logger.js';
import {
  getNotifications,
  getNotificationPreferences,
  getSession,
  onAuthChange,
  onNotificationsChange,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  updateNotificationPreferences,
} from '../services/supabase.js';

const POLL_INTERVAL_MS = 60_000;

/** @typedef {import('../lib/schemas/notification.js').Notification} Notif */
/** @typedef {import('../lib/schemas/notification.js').NotificationPreferences} Prefs */

/**
 * @param {string | null} from  "HH:MM" ou null
 * @param {string | null} to    "HH:MM" ou null
 * @param {Date} [now]
 * @returns {boolean} true si l'instant courant est dans la plage silencieuse.
 */
export function isQuietHour(from, to, now = new Date()) {
  if (!from || !to || from === to) return false;
  const toMinutes = (/** @type {string} */ hhmm) => {
    const [h, m] = hhmm.split(':');
    return Number(h) * 60 + Number(m);
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(from);
  const end = toMinutes(to);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  // Plage qui passe minuit (ex. 22:00 → 08:00).
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}

export function useNotifications() {
  const supabaseOn = isSupabaseConfigured();

  const [authenticated, setAuthenticated] = useState(!supabaseOn);
  const [authResolved, setAuthResolved] = useState(!supabaseOn);
  const [raw, setRaw] = useState(
    /** @type {import('../lib/schemas/notification.js').Notification[]} */ ([])
  );
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  // Suit l'état d'auth (gate progressif — PVA-1).
  useEffect(() => {
    if (!supabaseOn) return;
    let alive = true;
    getSession()
      .then((s) => {
        if (!alive) return;
        setAuthenticated(Boolean(s));
        setAuthResolved(true);
      })
      .catch(() => alive && setAuthResolved(true));
    const off = onAuthChange((s) => {
      setAuthenticated(Boolean(s));
      setAuthResolved(true);
    });
    return () => {
      alive = false;
      off();
    };
  }, [supabaseOn]);

  const load = useCallback(async () => {
    if (supabaseOn && !authenticated) {
      setRaw([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [items, prefs] = await Promise.all([getNotifications(), getNotificationPreferences()]);
      setRaw(items);
      setPreferences(prefs);
    } catch (err) {
      logger.error('useNotifications:load', serializeError(err));
      setError(err instanceof Error ? err : new Error('Chargement impossible'));
    } finally {
      setLoading(false);
    }
  }, [supabaseOn, authenticated]);

  // Chargement initial + rechargement quand l'auth change.
  useEffect(() => {
    if (!authResolved) return;
    load();
  }, [authResolved, load]);

  // Realtime (AD-9) avec repli polling.
  const pollRef = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null));
  useEffect(() => {
    if (supabaseOn && !authenticated) return;
    const off = onNotificationsChange(() => load());
    if (!supabaseOn) {
      pollRef.current = setInterval(load, POLL_INTERVAL_MS);
    }
    return () => {
      off();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [supabaseOn, authenticated, load]);

  // ─── Dérivés : filtrage catégorie + suppression du badge (FR-15) ───
  const notifications = useMemo(
    () => raw.filter((n) => preferences[CATEGORY_PREF_KEY[n.category]] !== false),
    [raw, preferences]
  );
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const badgeSuppressed =
    !preferences.app_enabled || isQuietHour(preferences.quiet_from, preferences.quiet_to);
  const badgeCount = badgeSuppressed ? 0 : unreadCount;

  // ─── Actions (mises à jour optimistes, rollback sur échec) ───
  const withOptimism = useCallback(
    async (
      /** @type {(list: Notif[]) => Notif[]} */ mutateLocal,
      /** @type {() => Promise<unknown>} */ remote,
      /** @type {string} */ label
    ) => {
      const snapshot = raw;
      setRaw(mutateLocal(raw));
      try {
        await remote();
      } catch (err) {
        logger.error(`useNotifications:${label}`, serializeError(err));
        setRaw(snapshot);
        setError(err instanceof Error ? err : new Error(`Échec : ${label}`));
      }
    },
    [raw]
  );

  const markRead = useCallback(
    (/** @type {string} */ id) =>
      withOptimism(
        (list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)),
        () => markNotificationRead(id),
        'markRead'
      ),
    [withOptimism]
  );

  const markAllRead = useCallback(
    () =>
      withOptimism(
        (list) => list.map((n) => ({ ...n, read: true })),
        () => markAllNotificationsRead(),
        'markAllRead'
      ),
    [withOptimism]
  );

  const dismiss = useCallback(
    (/** @type {string} */ id) =>
      withOptimism(
        (list) => list.filter((n) => n.id !== id),
        () => dismissNotification(id),
        'dismiss'
      ),
    [withOptimism]
  );

  const updatePreferences = useCallback(
    async (/** @type {Partial<Prefs>} */ patch) => {
      const snapshot = preferences;
      setPreferences(/** @type {Prefs} */ ({ ...preferences, ...patch }));
      try {
        const next = await updateNotificationPreferences(patch);
        setPreferences(/** @type {Prefs} */ (next));
      } catch (err) {
        logger.error('useNotifications:updatePreferences', serializeError(err));
        setPreferences(snapshot);
        throw err;
      }
    },
    [preferences]
  );

  return {
    authenticated: supabaseOn ? authenticated : true,
    authResolved,
    loading,
    error,
    notifications,
    unreadCount,
    badgeCount,
    preferences,
    refetch: load,
    markRead,
    markAllRead,
    dismiss,
    updatePreferences,
  };
}
