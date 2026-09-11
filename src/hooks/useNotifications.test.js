import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { isQuietHour, useNotifications } from './useNotifications.js';

const h = vi.hoisted(() => ({ configured: true }));

vi.mock('../config/env.js', () => ({
  env: { isProd: false, mode: 'test' },
  isSupabaseConfigured: () => h.configured,
}));

vi.mock('../services/supabase.js', () => ({
  getSession: vi.fn(async () => null),
  onAuthChange: vi.fn(() => () => {}),
  getNotifications: vi.fn(async () => []),
  getNotificationPreferences: vi.fn(async () => ({
    app_enabled: true,
    email_enabled: false,
    cat_new_course: true,
    cat_tool_beta: true,
    cat_milestone: true,
    quiet_from: null,
    quiet_to: null,
    reminder_frequency: 'weekly',
  })),
  onNotificationsChange: vi.fn(() => () => {}),
  markNotificationRead: vi.fn(async () => {}),
  markAllNotificationsRead: vi.fn(async () => {}),
  dismissNotification: vi.fn(async () => {}),
  updateNotificationPreferences: vi.fn(async (patch) => ({
    app_enabled: true,
    email_enabled: false,
    cat_new_course: true,
    cat_tool_beta: true,
    cat_milestone: true,
    quiet_from: null,
    quiet_to: null,
    reminder_frequency: 'weekly',
    ...patch,
  })),
}));

const svc = await import('../services/supabase.js');

const notif = (over = {}) => ({
  id: 'n1',
  category: 'new_course',
  title: 'T',
  body: null,
  link: null,
  read: false,
  dismissed: false,
  created_at: new Date().toISOString(),
  ...over,
});

describe('isQuietHour', () => {
  it('renvoie false quand from/to sont absents ou identiques', () => {
    expect(isQuietHour(null, null)).toBe(false);
    expect(isQuietHour('22:00', '22:00')).toBe(false);
  });

  it('détecte une plage normale (dans la même journée)', () => {
    const at = (h_, m) => new Date(2026, 0, 1, h_, m);
    expect(isQuietHour('08:00', '18:00', at(12, 0))).toBe(true);
    expect(isQuietHour('08:00', '18:00', at(19, 0))).toBe(false);
  });

  it('détecte une plage qui passe minuit', () => {
    const at = (h_, m) => new Date(2026, 0, 1, h_, m);
    expect(isQuietHour('22:00', '08:00', at(23, 30))).toBe(true);
    expect(isQuietHour('22:00', '08:00', at(3, 0))).toBe(true);
    expect(isQuietHour('22:00', '08:00', at(12, 0))).toBe(false);
  });
});

describe('useNotifications', () => {
  beforeEach(() => {
    h.configured = true;
    vi.clearAllMocks();
    svc.getSession.mockResolvedValue(null);
    svc.onAuthChange.mockReturnValue(() => {});
    svc.getNotifications.mockResolvedValue([]);
    svc.getNotificationPreferences.mockResolvedValue({
      app_enabled: true,
      email_enabled: false,
      cat_new_course: true,
      cat_tool_beta: true,
      cat_milestone: true,
      quiet_from: null,
      quiet_to: null,
      reminder_frequency: 'weekly',
    });
    svc.onNotificationsChange.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gate progressif : Supabase configuré + pas de session → authenticated=false, pas de fetch', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.authResolved).toBe(true));
    expect(result.current.authenticated).toBe(false);
    expect(result.current.notifications).toEqual([]);
    expect(svc.getNotifications).not.toHaveBeenCalled();
  });

  it('Supabase non configuré → authenticated=true immédiatement, charge le flux', async () => {
    h.configured = false;
    svc.getNotifications.mockResolvedValue([notif()]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(true);
    expect(result.current.notifications).toHaveLength(1);
  });

  it('session présente → charge le flux et calcule unreadCount', async () => {
    svc.getSession.mockResolvedValue(/** @type {any} */ ({ user: { id: 'u1' } }));
    svc.getNotifications.mockResolvedValue([
      notif({ id: 'a', read: false }),
      notif({ id: 'b', read: true }),
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.authenticated).toBe(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('filtre les notifications dont la catégorie est désactivée (FR-15)', async () => {
    svc.getSession.mockResolvedValue(/** @type {any} */ ({ user: { id: 'u1' } }));
    svc.getNotifications.mockResolvedValue([
      notif({ id: 'a', category: 'new_course' }),
      notif({ id: 'b', category: 'tool_beta' }),
    ]);
    svc.getNotificationPreferences.mockResolvedValue({
      app_enabled: true,
      email_enabled: false,
      cat_new_course: true,
      cat_tool_beta: false, // désactivé
      cat_milestone: true,
      quiet_from: null,
      quiet_to: null,
      reminder_frequency: 'weekly',
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications.map((n) => n.id)).toEqual(['a']);
  });

  it('badgeCount est suppressé quand "app_enabled" est faux, mais unreadCount reste réel', async () => {
    svc.getSession.mockResolvedValue(/** @type {any} */ ({ user: { id: 'u1' } }));
    svc.getNotifications.mockResolvedValue([notif({ read: false })]);
    svc.getNotificationPreferences.mockResolvedValue({
      app_enabled: false,
      email_enabled: false,
      cat_new_course: true,
      cat_tool_beta: true,
      cat_milestone: true,
      quiet_from: null,
      quiet_to: null,
      reminder_frequency: 'weekly',
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.badgeCount).toBe(0);
  });

  it('markRead : mise à jour optimiste, puis confirmée par le service', async () => {
    svc.getSession.mockResolvedValue(/** @type {any} */ ({ user: { id: 'u1' } }));
    svc.getNotifications.mockResolvedValue([notif({ id: 'a', read: false })]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markRead('a');
    });

    expect(svc.markNotificationRead).toHaveBeenCalledWith('a');
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('markRead : rollback si le service échoue', async () => {
    svc.getSession.mockResolvedValue(/** @type {any} */ ({ user: { id: 'u1' } }));
    svc.getNotifications.mockResolvedValue([notif({ id: 'a', read: false })]);
    svc.markNotificationRead.mockRejectedValue(new Error('réseau'));

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markRead('a');
    });

    expect(result.current.notifications[0].read).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('dismiss retire la notification de la liste', async () => {
    svc.getSession.mockResolvedValue(/** @type {any} */ ({ user: { id: 'u1' } }));
    svc.getNotifications.mockResolvedValue([notif({ id: 'a' })]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.dismiss('a');
    });

    expect(svc.dismissNotification).toHaveBeenCalledWith('a');
    expect(result.current.notifications).toHaveLength(0);
  });

  it('updatePreferences applique le patch et retombe en arrière en cas d’échec', async () => {
    svc.getSession.mockResolvedValue(/** @type {any} */ ({ user: { id: 'u1' } }));
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePreferences({ app_enabled: false });
    });
    expect(result.current.preferences.app_enabled).toBe(false);

    svc.updateNotificationPreferences.mockRejectedValueOnce(new Error('échec'));
    await act(async () => {
      await expect(result.current.updatePreferences({ app_enabled: true })).rejects.toThrow();
    });
    // Rollback : reste à la dernière valeur confirmée (false), pas au patch optimiste (true).
    expect(result.current.preferences.app_enabled).toBe(false);
  });
});
