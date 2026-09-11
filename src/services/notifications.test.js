import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock du SDK Supabase (dédié : besoin de maybeSingle/upsert/channel en
// plus des méthodes déjà mockées dans supabase.test.js) ────────────────────
const h = vi.hoisted(() => {
  const state = { nextResult: { data: null, error: null }, configured: true };
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
  };
  const channelHandle = {
    on: vi.fn(function () {
      return this;
    }),
    subscribe: vi.fn(function () {
      return this;
    }),
  };
  const makeBuilder = () => {
    const builder = { then: (resolve) => resolve(state.nextResult) };
    for (const m of [
      'select',
      'eq',
      'order',
      'insert',
      'update',
      'delete',
      'single',
      'maybeSingle',
      'upsert',
    ]) {
      builder[m] = vi.fn(() => builder);
    }
    return builder;
  };
  const from = vi.fn(() => makeBuilder());
  const channel = vi.fn(() => channelHandle);
  const removeChannel = vi.fn();
  return { state, auth, from, channel, removeChannel, channelHandle };
});

const setResult = (r) => {
  h.state.nextResult = r;
};
const setConfigured = (v) => {
  h.state.configured = v;
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: h.from,
    auth: h.auth,
    channel: h.channel,
    removeChannel: h.removeChannel,
  }),
}));

vi.mock('../config/env.js', () => ({
  env: {
    supabaseUrl: 'https://x.supabase.co',
    supabaseAnonKey: 'anon',
    mode: 'test',
    isProd: false,
  },
  isSupabaseConfigured: () => h.state.configured,
  isAiConfigured: () => false,
}));

const svc = await import('./supabase.js');

const makeNotif = (over = {}) => ({
  id: 'n1',
  category: 'new_course',
  title: 'Titre',
  body: null,
  link: '/app?tab=modules',
  read: false,
  dismissed: false,
  created_at: '2026-09-11T10:00:00.000Z',
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  setConfigured(true);
  setResult({ data: null, error: null });
});

describe('notifications — repli localStorage (Supabase non configuré)', () => {
  beforeEach(() => setConfigured(false));

  it("matérialise des notifications de démo au premier accès et n'expose pas les archivées", async () => {
    const items = await svc.getNotifications();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((n) => n.dismissed === false)).toBe(true);
    // Persisté : un deuxième appel relit la même chose.
    const again = await svc.getNotifications();
    expect(again).toEqual(items);
  });

  it('marque une notification comme lue', async () => {
    const [first] = await svc.getNotifications();
    await svc.markNotificationRead(first.id);
    const after = await svc.getNotifications();
    expect(after.find((n) => n.id === first.id).read).toBe(true);
  });

  it('marque toutes les notifications comme lues', async () => {
    await svc.markAllNotificationsRead();
    const after = await svc.getNotifications();
    expect(after.every((n) => n.read)).toBe(true);
  });

  it('archive une notification (elle disparaît du flux)', async () => {
    const [first] = await svc.getNotifications();
    await svc.dismissNotification(first.id);
    const after = await svc.getNotifications();
    expect(after.find((n) => n.id === first.id)).toBeUndefined();
  });

  it('renvoie les préférences par défaut tant que rien n’est enregistré', async () => {
    const prefs = await svc.getNotificationPreferences();
    expect(prefs.app_enabled).toBe(true);
    expect(prefs.reminder_frequency).toBe('weekly');
  });

  it('persiste un patch de préférences et le relit', async () => {
    await svc.updateNotificationPreferences({ app_enabled: false, cat_tool_beta: true });
    const prefs = await svc.getNotificationPreferences();
    expect(prefs.app_enabled).toBe(false);
    expect(prefs.cat_tool_beta).toBe(true);
    expect(prefs.cat_new_course).toBe(true); // non touché par le patch
  });

  it('onNotificationsChange est un no-op silencieux (le hook fait du polling)', () => {
    const unsub = svc.onNotificationsChange(vi.fn());
    expect(() => unsub()).not.toThrow();
  });

  it('recordCourseCompletion est un no-op silencieux sans backend', async () => {
    await expect(svc.recordCourseCompletion('c1')).resolves.toBeUndefined();
    expect(h.from).not.toHaveBeenCalledWith('course_progress');
  });

  it('isAdmin renvoie false sans backend (AdminPage.jsx)', async () => {
    await expect(svc.isAdmin()).resolves.toBe(false);
  });
});

describe('notifications — Supabase configuré', () => {
  it('getNotifications valide et renvoie les lignes triées côté serveur', async () => {
    setResult({ data: [makeNotif()], error: null });
    const items = await svc.getNotifications();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('n1');
  });

  it('getNotifications relance une erreur Postgres enveloppée', async () => {
    setResult({ data: null, error: { message: 'boom', code: 'XXXXX' } });
    await expect(svc.getNotifications()).rejects.toThrow(/boom/);
  });

  it('markNotificationRead relance sur erreur', async () => {
    setResult({ data: null, error: { message: 'échec update' } });
    await expect(svc.markNotificationRead('n1')).rejects.toThrow(/échec update/);
  });

  it('getNotificationPreferences retombe sur les défauts si aucune ligne', async () => {
    setResult({ data: null, error: null });
    const prefs = await svc.getNotificationPreferences();
    expect(prefs.app_enabled).toBe(true);
  });

  it('updateNotificationPreferences échoue sans utilisateur connecté', async () => {
    h.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    await expect(svc.updateNotificationPreferences({ app_enabled: false })).rejects.toThrow();
  });

  it('updateNotificationPreferences upsert avec le user_id courant', async () => {
    h.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    setResult({
      data: {
        app_enabled: false,
        email_enabled: false,
        cat_new_course: true,
        cat_tool_beta: false,
        cat_milestone: true,
        quiet_from: null,
        quiet_to: null,
        reminder_frequency: 'weekly',
      },
      error: null,
    });
    const next = await svc.updateNotificationPreferences({ app_enabled: false });
    expect(next.app_enabled).toBe(false);
    expect(h.from).toHaveBeenCalledWith('notification_preferences');
  });

  it('onNotificationsChange s’abonne et le désabonnement retire le channel', () => {
    const off = svc.onNotificationsChange(vi.fn());
    // Topic unique par abonnement (pas fixe) : voir le commentaire dans
    // supabase.js — évite la collision entre abonnements concurrents
    // (Sidebar + NotificationsTab montés simultanément, StrictMode).
    expect(h.channel).toHaveBeenCalledWith(expect.stringMatching(/^notifications:self:.+/));
    expect(h.channelHandle.on).toHaveBeenCalled();
    expect(h.channelHandle.subscribe).toHaveBeenCalled();
    off();
    expect(h.removeChannel).toHaveBeenCalled();
  });

  it('onNotificationsChange : deux abonnements concurrents utilisent des topics distincts', () => {
    svc.onNotificationsChange(vi.fn());
    svc.onNotificationsChange(vi.fn());
    const topics = h.channel.mock.calls.map((c) => c[0]);
    expect(new Set(topics).size).toBe(topics.length);
  });

  describe('recordCourseCompletion (Story 9.6b)', () => {
    it('ne fait rien si personne n’est connecté', async () => {
      h.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
      await svc.recordCourseCompletion('c1');
      expect(h.from).not.toHaveBeenCalledWith('course_progress');
    });

    it('upsert la complétion avec ignoreDuplicates (idempotence, retry réseau)', async () => {
      h.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'u1' } } },
        error: null,
      });
      setResult({ data: null, error: null });
      await svc.recordCourseCompletion('c1');
      expect(h.from).toHaveBeenCalledWith('course_progress');
    });

    it('relance sur erreur Postgres', async () => {
      h.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'u1' } } },
        error: null,
      });
      setResult({ data: null, error: { message: 'échec upsert' } });
      await expect(svc.recordCourseCompletion('c1')).rejects.toThrow(/échec upsert/);
    });
  });
});
