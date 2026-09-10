import { describe, it, expect, beforeEach, vi } from 'vitest';

// env.js fige `env` au chargement du module → on ré-importe à neuf pour chaque cas.
async function loadEnv() {
  vi.resetModules();
  return import('./env.js');
}

describe('config/env', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('expose le mode courant', async () => {
    const { env } = await loadEnv();
    expect(['development', 'production', 'test']).toContain(env.mode);
  });

  it('isSupabaseConfigured est faux sans variables', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const { isSupabaseConfigured } = await loadEnv();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('isSupabaseConfigured est vrai quand les deux variables sont là', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://ref.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon.key.value');
    const { isSupabaseConfigured, env } = await loadEnv();
    expect(isSupabaseConfigured()).toBe(true);
    expect(env.supabaseUrl).toBe('https://ref.supabase.co');
  });

  it('traite un placeholder <...> comme non renseigné', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '<project-ref>');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'x');
    const { isSupabaseConfigured } = await loadEnv();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('isAiConfigured suit VITE_GEMINI_API_KEY', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    let mod = await loadEnv();
    expect(mod.isAiConfigured()).toBe(false);

    vi.stubEnv('VITE_GEMINI_API_KEY', 'AQ.some-key');
    mod = await loadEnv();
    expect(mod.isAiConfigured()).toBe(true);
  });
});
