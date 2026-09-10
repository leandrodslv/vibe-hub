import { describe, it, expect, vi } from 'vitest';
import { setSupabaseScenario } from '../test/mocks';

// Contrairement à supabase.test.js (query-builder mocké à la main), ici le SDK
// Supabase fait de vraies requêtes HTTP, interceptées par MSW. On teste donc le
// chemin complet : SDK → PostgREST (mocké) → parsing → gardes Zod (V1).
vi.mock('../config/env.js', () => ({
  env: {
    supabaseUrl: 'https://mock.supabase.co',
    supabaseAnonKey: 'anon-key',
    mode: 'test',
    isProd: false,
  },
  isSupabaseConfigured: () => true,
  isAiConfigured: () => false,
}));

const svc = await import('./supabase.js');

describe('supabase (HTTP réel mocké)', () => {
  it('getCourses renvoie les cours publiés, validés par le schéma', async () => {
    const courses = await svc.getCourses();
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.published)).toBe(true);
    expect(courses[0]).toHaveProperty('title');
  });

  it('getAllCourses renvoie toutes les lignes', async () => {
    const all = await svc.getAllCourses();
    expect(all.length).toBe(3);
  });

  it('getCourses lève une SchemaError si PostgREST renvoie une ligne au mauvais format', async () => {
    setSupabaseScenario({ courses: 'malformedRow' });
    await expect(svc.getCourses()).rejects.toThrow(/Réponse inattendue \[getCourses\]/);
  });

  it('getCourses relaie une erreur serveur PostgREST', async () => {
    setSupabaseScenario({ courses: 'error' });
    await expect(svc.getCourses()).rejects.toThrow();
  });

  it('addToWaitlist renvoie { success } quand PostgREST accepte', async () => {
    await expect(svc.addToWaitlist('ui-builder', 'a@b.co')).resolves.toEqual({ success: true });
  });

  it('addToWaitlist renvoie { duplicate } sur conflit 23505', async () => {
    setSupabaseScenario({ waitlist: 'duplicate' });
    await expect(svc.addToWaitlist('ui-builder', 'a@b.co')).resolves.toEqual({ duplicate: true });
  });
});
