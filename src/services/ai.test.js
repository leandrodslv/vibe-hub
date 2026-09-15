import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setGeminiScenario,
  geminiRequests,
  GEMINI_PROXY_TEST_URL,
  setCourseDraftScenario,
  courseDraftRequests,
  COURSE_DRAFT_TEST_URL,
} from '../test/mocks';

// Seul l'accès env est mocké : `ai.js` fait un vrai `fetch()` vers le proxy, et
// c'est MSW (src/test/mocks/handlers/gemini.js) qui répond. On teste donc le
// VRAI code de mapping d'erreur d'ai.js, pas un double.
const h = vi.hoisted(() => ({ aiConfigured: true, courseDraftConfigured: true, session: null }));

vi.mock('../config/env.js', () => ({
  env: {
    geminiProxyUrl: 'https://proxy.test/gemini-proxy',
    courseDraftUrl: 'https://proxy.test/course-draft',
    mode: 'test',
    isProd: false,
  },
  isAiConfigured: () => h.aiConfigured,
  isCourseDraftConfigured: () => h.courseDraftConfigured,
}));

// getSession() vient de services/supabase.js (AD-2 : ai.js n'importe jamais le
// SDK Supabase directement) — mocké ici plutôt que de faire tourner un vrai
// client Supabase dans ce test unitaire.
vi.mock('./supabase.js', () => ({
  getSession: () => Promise.resolve(h.session),
}));

const { generateAIResponse, generateCourseDraftFromVideo } = await import('./ai.js');

beforeEach(() => {
  h.aiConfigured = true;
  h.courseDraftConfigured = true;
  h.session = { access_token: 'fake-jwt-for-test' };
});

describe('generateAIResponse', () => {
  it("renvoie un message d'erreur explicite si le proxy n'est pas configuré", async () => {
    h.aiConfigured = false;
    const out = await generateAIResponse([{ role: 'user', text: 'salut' }]);
    expect(out).toMatch(/proxy IA n.est pas configuré/i);
    expect(geminiRequests).toHaveLength(0);
  });

  it('renvoie le texte généré en cas de succès', async () => {
    const out = await generateAIResponse([
      { role: 'assistant', text: 'Bonjour' },
      { role: 'user', text: 'Fais-moi un bouton' },
    ]);
    expect(out).toBe('Voici une piste de design pour ton interface.');
  });

  it("transmet l'historique brut et la systemInstruction au proxy", async () => {
    await generateAIResponse(
      [
        { role: 'assistant', text: 'accueil' },
        { role: 'user', text: 'q1' },
        { role: 'assistant', text: 'r1' },
        { role: 'user', text: 'q2' },
      ],
      'Sois concis.'
    );
    const body = geminiRequests[0];
    // Le mapping rôles / retrait du message d'accueil / images vit dans le proxy,
    // pas ici : ai.js transmet l'historique tel quel.
    expect(body.history.map((m) => m.role)).toEqual(['assistant', 'user', 'assistant', 'user']);
    expect(body.history.map((m) => m.text)).toEqual(['accueil', 'q1', 'r1', 'q2']);
    expect(body.systemInstruction).toBe('Sois concis.');
  });

  it('applique une instruction système par défaut quand aucune n’est fournie', async () => {
    await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(geminiRequests[0].systemInstruction).toMatch(/assistant IA expert en design/i);
  });

  it('poste vers l’URL du proxy configurée', async () => {
    await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(GEMINI_PROXY_TEST_URL).toBe('https://proxy.test/gemini-proxy');
    expect(geminiRequests).toHaveLength(1);
  });

  it('mappe une erreur 429 sur un message de quota', async () => {
    setGeminiScenario('quotaExceeded');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/limite d.utilisation|quota/i);
  });

  it('mappe une surcharge amont (502 + status 503) sur un message de surcharge', async () => {
    setGeminiScenario('overloaded');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/surchargé/i);
  });

  it('renvoie un message générique sur erreur serveur inconnue (502 + status 500)', async () => {
    setGeminiScenario('serverError');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/une erreur s.est produite/i);
  });

  it('renvoie un message générique si le proxy n’est pas configuré côté serveur (503)', async () => {
    setGeminiScenario('proxyNotConfigured');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/une erreur s.est produite/i);
  });

  it('traite une complétion vide comme une défaillance (pas de "" silencieux)', async () => {
    setGeminiScenario('empty');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/une erreur s.est produite/i);
  });

  it('ne casse pas sur du JSON tronqué renvoyé par le proxy', async () => {
    setGeminiScenario('malformedJson');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/une erreur s.est produite/i);
  });

  it("renvoie le texte d'une injection de prompt sans l'évaluer (texte inerte)", async () => {
    setGeminiScenario('promptInjectionInReply');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toContain('<script>alert(1)</script>');
    expect(typeof out).toBe('string');
  });
});

describe('generateCourseDraftFromVideo', () => {
  const YOUTUBE_URL = 'https://www.youtube.com/watch?v=abc123';

  it("renvoie une erreur explicite si le proxy n'est pas configuré", async () => {
    h.courseDraftConfigured = false;
    const out = await generateCourseDraftFromVideo(YOUTUBE_URL);
    expect(out).toEqual({
      success: false,
      error: expect.stringMatching(/pas configuré/i),
    });
    expect(courseDraftRequests).toHaveLength(0);
  });

  it("renvoie une erreur si aucune session n'est active", async () => {
    h.session = null;
    const out = await generateCourseDraftFromVideo(YOUTUBE_URL);
    expect(out).toEqual({ success: false, error: expect.stringMatching(/session/i) });
    expect(courseDraftRequests).toHaveLength(0);
  });

  it('renvoie le brouillon en cas de succès', async () => {
    const out = await generateCourseDraftFromVideo(YOUTUBE_URL);
    expect(out).toEqual({
      success: true,
      draft: {
        title: 'Prompts efficaces pour le design UI',
        description: 'Comprendre comment formuler un prompt qui produit un résultat exploitable.',
        duration: '08:30',
        content: '# Introduction\n\nCeci est le contenu généré depuis la vidéo.',
      },
    });
  });

  it("transmet l'URL vidéo et le JWT de session au proxy", async () => {
    await generateCourseDraftFromVideo(YOUTUBE_URL);
    expect(COURSE_DRAFT_TEST_URL).toBe('https://proxy.test/course-draft');
    expect(courseDraftRequests[0]).toEqual({
      videoUrl: YOUTUBE_URL,
      authorization: 'Bearer fake-jwt-for-test',
    });
  });

  it('mappe une erreur 429 sur un message de quota', async () => {
    setCourseDraftScenario('quotaExceeded');
    const out = await generateCourseDraftFromVideo(YOUTUBE_URL);
    expect(out.success).toBe(false);
    expect(out.error).toMatch(/limite d.utilisation|quota/i);
  });

  it('relaie le message du proxy sur une erreur serveur (JSON illisible côté modèle)', async () => {
    setCourseDraftScenario('malformedJson');
    const out = await generateCourseDraftFromVideo(YOUTUBE_URL);
    expect(out).toEqual({ success: false, error: 'Réponse du modèle illisible (JSON invalide).' });
  });

  it('renvoie une erreur générique si le proxy n’est pas configuré côté serveur (503)', async () => {
    setCourseDraftScenario('proxyNotConfigured');
    const out = await generateCourseDraftFromVideo(YOUTUBE_URL);
    expect(out.success).toBe(false);
    expect(out.error).toMatch(/proxy non configuré/i);
  });
});
