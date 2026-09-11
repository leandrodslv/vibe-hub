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
    for (const m of ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single']) {
      builder[m] = vi.fn(() => builder);
    }
    return builder;
  };
  const from = vi.fn(() => makeBuilder());
  const rpc = vi.fn(async () => ({ data: null, error: null }));
  return { state, auth, from, rpc };
});

const { auth, from, rpc } = h;
const setResult = (r) => {
  h.state.nextResult = r;
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: h.from, auth: h.auth, rpc: h.rpc }),
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
