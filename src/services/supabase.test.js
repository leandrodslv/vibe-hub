import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock du SDK Supabase ────────────────────────────────────────────────────
// Un "query builder" chaînable et thenable : toute méthode renvoie le builder,
// et `await builder` résout le résultat configuré par le test courant.
// `vi.hoisted` : ces objets doivent exister avant le hoisting de `vi.mock`.
const h = vi.hoisted(() => {
  const state = { nextResult: { data: null, error: null } };
  const auth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  };
  const makeBuilder = () => {
    const builder = { then: (resolve) => resolve(state.nextResult) };
    for (const m of ['select', 'eq', 'order', 'limit', 'insert', 'update', 'delete', 'single']) {
      builder[m] = vi.fn(() => builder);
    }
    return builder;
  };
  const from = vi.fn(() => makeBuilder());
  const rpc = vi.fn(async () => ({ data: null, error: null }));
  const storageUpload = vi.fn(async () => ({ data: { path: 'x' }, error: null }));
  const storage = { from: vi.fn(() => ({ upload: storageUpload })) };
  return { state, auth, from, rpc, storage, storageUpload };
});

const { auth, from, rpc, storage, storageUpload } = h;
const setResult = (r) => {
  h.state.nextResult = r;
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: h.from, auth: h.auth, rpc: h.rpc, storage: h.storage }),
}));

vi.mock('../config/env.js', () => ({
  env: {
    supabaseUrl: 'https://x.supabase.co',
    supabaseAnonKey: 'anon',
    mode: 'test',
    isProd: false,
  },
  isSupabaseConfigured: () => true,
  isAiConfigured: () => false,
}));

const svc = await import('./supabase.js');

/** Ligne `courses` réaliste (respecte le schéma Zod courseSchema). */
const makeCourse = (over = {}) => ({
  id: 1,
  title: 'Cours',
  module_name: 'MODULE 1',
  description: null,
  duration: null,
  image_url: null,
  video_url: null,
  published: true,
  order_index: 0,
  created_at: '2026-01-01T00:00:00Z',
  ...over,
});

/** Payload d'entrée valide pour createCourse. */
const makeCourseInput = (over = {}) => ({
  title: 'Cours',
  module_name: 'MODULE 1',
  description: null,
  duration: null,
  image_url: null,
  video_url: null,
  published: true,
  order_index: 1,
  ...over,
});

beforeEach(() => {
  setResult({ data: null, error: null });
  vi.clearAllMocks();
});

describe('addToWaitlist', () => {
  it('renvoie { success } quand l’insert passe', async () => {
    setResult({ error: null });
    await expect(svc.addToWaitlist('ui-builder', 'a@b.co')).resolves.toEqual({ success: true });
    expect(from).toHaveBeenCalledWith('waitlist');
  });

  it('renvoie { duplicate } sur violation d’unicité (23505)', async () => {
    setResult({ error: { code: '23505', message: 'dup' } });
    await expect(svc.addToWaitlist('ui-builder', 'a@b.co')).resolves.toEqual({ duplicate: true });
  });

  it('renvoie { error } sur toute autre erreur', async () => {
    setResult({ error: { code: '500', message: 'boom' } });
    await expect(svc.addToWaitlist('ui-builder', 'a@b.co')).resolves.toEqual({ error: 'boom' });
  });
});

describe('getWaitlistCounts', () => {
  it('renvoie les agrégats validés en cas de succès', async () => {
    const rows = [
      { tool_id: 'code-auditor', signups: 3 },
      { tool_id: 'vision-lens', signups: 0 },
    ];
    rpc.mockResolvedValueOnce({ data: rows, error: null });
    await expect(svc.getWaitlistCounts()).resolves.toEqual(rows);
    expect(rpc).toHaveBeenCalledWith('get_waitlist_counts');
  });

  it('lève quand la RPC renvoie une erreur (ex. anon sans droits admin)', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });
    await expect(svc.getWaitlistCounts()).rejects.toThrow(/permission denied/);
  });

  it('lève une SchemaError si une ligne exposait un email (fuite AD-4)', async () => {
    rpc.mockResolvedValueOnce({
      data: [{ tool_id: 'code-auditor', signups: 1, email: 'leak@x.co' }],
      error: null,
    });
    await expect(svc.getWaitlistCounts()).rejects.toThrow(
      /Réponse inattendue \[getWaitlistCounts\]/
    );
  });
});

describe('getNotificationsOverview', () => {
  const overview = {
    total_users: 3,
    total_notifications: 12,
    unread_notifications: 4,
    email_enabled_count: 1,
    last_digest_sent_at: '2026-09-15T08:00:00Z',
  };

  it('renvoie l’agrégat validé en cas de succès', async () => {
    rpc.mockResolvedValueOnce({ data: [overview], error: null });
    await expect(svc.getNotificationsOverview()).resolves.toEqual(overview);
    expect(rpc).toHaveBeenCalledWith('get_notifications_overview');
  });

  it('renvoie null pour un appel non-admin (0 ligne)', async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(svc.getNotificationsOverview()).resolves.toBeNull();
  });

  it('lève quand la RPC renvoie une erreur', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });
    await expect(svc.getNotificationsOverview()).rejects.toThrow(/permission denied/);
  });
});

describe('uploadCourseDraftVideo', () => {
  const makeFile = (name = 'clip.mp4', type = 'video/mp4') => new File(['x'], name, { type });

  it('upload vers le bucket course-draft-uploads et renvoie le storagePath', async () => {
    const path = await svc.uploadCourseDraftVideo(makeFile());
    expect(storage.from).toHaveBeenCalledWith('course-draft-uploads');
    expect(path).toMatch(/^[0-9a-f-]{36}\/clip\.mp4$/);
    expect(storageUpload).toHaveBeenCalledWith(
      path,
      expect.anything(),
      expect.objectContaining({ contentType: 'video/mp4' })
    );
  });

  it('lève sur erreur de upload', async () => {
    storageUpload.mockResolvedValueOnce({ data: null, error: { message: 'quota' } });
    await expect(svc.uploadCourseDraftVideo(makeFile())).rejects.toThrow('quota');
  });
});

describe('getAiUsageSummary', () => {
  it('renvoie les agrégats validés en cas de succès', async () => {
    const rows = [
      {
        endpoint: 'gemini-proxy',
        window_days: 30,
        calls: 4,
        prompt_tokens: 100,
        candidates_tokens: 50,
        total_tokens: 150,
      },
    ];
    rpc.mockResolvedValueOnce({ data: rows, error: null });
    await expect(svc.getAiUsageSummary()).resolves.toEqual(rows);
    expect(rpc).toHaveBeenCalledWith('get_ai_usage_summary');
  });

  it('lève quand la RPC renvoie une erreur (ex. anon sans droits admin)', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });
    await expect(svc.getAiUsageSummary()).rejects.toThrow(/permission denied/);
  });
});

describe('getAiUsageDaily', () => {
  it('renvoie la série journalière validée, avec un défaut de 14 jours', async () => {
    const rows = [
      { day: '2026-09-14', endpoint: 'gemini-proxy', total_tokens: 0 },
      { day: '2026-09-15', endpoint: 'gemini-proxy', total_tokens: 120 },
    ];
    rpc.mockResolvedValueOnce({ data: rows, error: null });
    await expect(svc.getAiUsageDaily()).resolves.toEqual(rows);
    expect(rpc).toHaveBeenCalledWith('get_ai_usage_daily', { days: 14 });
  });

  it('transmet un nombre de jours personnalisé', async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await svc.getAiUsageDaily(30);
    expect(rpc).toHaveBeenCalledWith('get_ai_usage_daily', { days: 30 });
  });

  it('lève quand la RPC renvoie une erreur', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });
    await expect(svc.getAiUsageDaily()).rejects.toThrow(/permission denied/);
  });
});

describe('getLastKeyRotation', () => {
  it('renvoie la ligne la plus récente en cas de succès', async () => {
    const row = { id: 2, rotated_at: '2026-09-15T00:00:00Z', rotated_by: 'u1', note: 'ok' };
    setResult({ data: [row], error: null });
    await expect(svc.getLastKeyRotation()).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith('ai_key_rotations');
  });

  it('renvoie null si aucune rotation n’a jamais été enregistrée', async () => {
    setResult({ data: [], error: null });
    await expect(svc.getLastKeyRotation()).resolves.toBeNull();
  });

  it('lève quand Supabase renvoie une erreur', async () => {
    setResult({ data: null, error: new Error('rls') });
    await expect(svc.getLastKeyRotation()).rejects.toThrow('rls');
  });
});

describe('logKeyRotation', () => {
  it('enregistre la rotation avec l’auteur courant et une note optionnelle', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
      error: null,
    });
    const created = {
      id: 3,
      rotated_at: '2026-09-15T00:00:00Z',
      rotated_by: 'admin-1',
      note: 'rotée',
    };
    setResult({ data: created, error: null });
    await expect(svc.logKeyRotation('rotée')).resolves.toEqual(created);
  });

  it('lève sur erreur d’insertion', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
      error: null,
    });
    setResult({ data: null, error: new Error('rls') });
    await expect(svc.logKeyRotation()).rejects.toThrow('rls');
  });
});

describe('getCourses', () => {
  it('renvoie les données validées en cas de succès', async () => {
    const rows = [makeCourse({ id: 1 }), makeCourse({ id: 2, title: 'Autre' })];
    setResult({ data: rows, error: null });
    await expect(svc.getCourses()).resolves.toEqual(rows);
  });

  it('lève quand Supabase renvoie une erreur', async () => {
    setResult({ data: null, error: new Error('rls') });
    await expect(svc.getCourses()).rejects.toThrow('rls');
  });

  it('lève une SchemaError si une colonne attendue disparaît (ex. title renommé)', async () => {
    const { title: _title, ...withoutTitle } = makeCourse();
    setResult({ data: [withoutTitle], error: null });
    await expect(svc.getCourses()).rejects.toThrow(/Réponse inattendue \[getCourses\]/);
  });
});

describe('CRUD cours', () => {
  it('createCourse valide le payload puis relaie la ligne créée', async () => {
    const created = makeCourse({ id: 9, title: 'x' });
    setResult({ data: created, error: null });
    await expect(svc.createCourse(makeCourseInput({ title: 'x' }))).resolves.toEqual(created);
  });

  it('createCourse rejette un payload incomplet avant tout appel réseau', async () => {
    await expect(svc.createCourse({ title: 'x' })).rejects.toThrow(
      /Réponse inattendue \[createCourse:input\]/
    );
    expect(from).not.toHaveBeenCalledWith('courses');
  });

  it('updateCourse lève sur erreur', async () => {
    setResult({ data: null, error: new Error('nope') });
    await expect(svc.updateCourse(1, { published: false })).rejects.toThrow('nope');
  });

  it('deleteCourse résout sans valeur en cas de succès', async () => {
    setResult({ error: null });
    await expect(svc.deleteCourse(1)).resolves.toBeUndefined();
  });
});

describe('auth wrappers (AD-2)', () => {
  it('signIn renvoie { session } en cas de succès', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: { user: 'u' } }, error: null });
    await expect(svc.signIn('a@b.co', 'pw')).resolves.toEqual({ session: { user: 'u' } });
  });

  it('signIn renvoie { error } en cas d’échec', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'bad creds' } });
    await expect(svc.signIn('a@b.co', 'pw')).resolves.toEqual({ error: 'bad creds' });
  });

  it('getAllCourses renvoie toutes les lignes (publiées ou non)', async () => {
    setResult({
      data: [makeCourse({ id: 1, published: true }), makeCourse({ id: 2, published: false })],
      error: null,
    });
    await expect(svc.getAllCourses()).resolves.toHaveLength(2);
  });

  it('getSession relaie la session courante', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: 'me' } }, error: null });
    await expect(svc.getSession()).resolves.toEqual({ user: 'me' });
  });

  it('signOut lève si Supabase renvoie une erreur', async () => {
    auth.signOut.mockResolvedValue({ error: new Error('offline') });
    await expect(svc.signOut()).rejects.toThrow('offline');
  });

  it('onAuthChange renvoie une fonction de désabonnement', () => {
    const unsub = vi.fn();
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: unsub } } });
    const off = svc.onAuthChange(() => {});
    off();
    expect(unsub).toHaveBeenCalled();
  });

  it('signUp renvoie { session } quand la confirmation email est désactivée (PVA-1)', async () => {
    auth.signUp.mockResolvedValue({ data: { session: { user: 'new' } }, error: null });
    await expect(svc.signUp('a@b.co', 'pw123456')).resolves.toEqual({ session: { user: 'new' } });
  });

  it('signUp renvoie { session: null } quand la confirmation email est requise', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null, user: { id: 'u1' } }, error: null });
    await expect(svc.signUp('a@b.co', 'pw123456')).resolves.toEqual({ session: null });
  });

  it('signUp renvoie { error } en cas d’échec (ex. email déjà utilisé)', async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: { message: 'User already registered' } });
    await expect(svc.signUp('a@b.co', 'pw123456')).resolves.toEqual({
      error: 'User already registered',
    });
  });

  it('getCurrentUser renvoie l’utilisateur de la session courante', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'a@b.co' } } },
      error: null,
    });
    await expect(svc.getCurrentUser()).resolves.toEqual({ id: 'u1', email: 'a@b.co' });
  });

  it('getCurrentUser renvoie null en l’absence de session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(svc.getCurrentUser()).resolves.toBeNull();
  });

  it('isAdmin relaie true/false depuis la RPC is_admin', async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(svc.isAdmin()).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith('is_admin');

    rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(svc.isAdmin()).resolves.toBe(false);
  });

  it('isAdmin relance sur erreur RPC', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(svc.isAdmin()).rejects.toThrow(/boom/);
  });
});
