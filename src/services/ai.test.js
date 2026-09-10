import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setGeminiScenario, geminiRequests, GEMINI_PROXY_TEST_URL } from '../test/mocks';

// Seul l'accès env est mocké : `ai.js` fait un vrai `fetch()` vers le proxy, et
// c'est MSW (src/test/mocks/handlers/gemini.js) qui répond. On teste donc le
// VRAI code de mapping d'erreur d'ai.js, pas un double.
const h = vi.hoisted(() => ({ aiConfigured: true }));

vi.mock('../config/env.js', () => ({
  env: { geminiProxyUrl: 'https://proxy.test/gemini-proxy', mode: 'test', isProd: false },
  isAiConfigured: () => h.aiConfigured,
}));

const { generateAIResponse } = await import('./ai.js');

beforeEach(() => {
  h.aiConfigured = true;
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
