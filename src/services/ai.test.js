import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setGeminiScenario, geminiRequests } from '../test/mocks';

// Seul l'accès env est mocké : le SDK Gemini tourne pour de vrai et ses appels
// réseau sont interceptés par MSW (src/test/mocks/handlers/gemini.js). On teste
// donc le VRAI code de mapping d'erreur d'ai.js, pas un double du SDK.
const h = vi.hoisted(() => ({ aiConfigured: true }));

vi.mock('../config/env.js', () => ({
  env: { geminiApiKey: 'AQ.test-key', mode: 'test', isProd: false },
  isAiConfigured: () => h.aiConfigured,
}));

const { generateAIResponse } = await import('./ai.js');

beforeEach(() => {
  h.aiConfigured = true;
});

describe('generateAIResponse', () => {
  it("renvoie un message d'erreur explicite si l'IA n'est pas configurée", async () => {
    h.aiConfigured = false;
    const out = await generateAIResponse([{ role: 'user', text: 'salut' }]);
    expect(out).toMatch(/clé API Gemini/i);
    expect(geminiRequests).toHaveLength(0);
  });

  it('renvoie le texte généré en cas de succès', async () => {
    const out = await generateAIResponse([
      { role: 'assistant', text: 'Bonjour' },
      { role: 'user', text: 'Fais-moi un bouton' },
    ]);
    expect(out).toBe('Voici une piste de design pour ton interface.');
  });

  it("ignore les messages 'model' en tête d'historique (contrainte Gemini)", async () => {
    await generateAIResponse([
      { role: 'assistant', text: 'accueil' },
      { role: 'user', text: 'q1' },
      { role: 'assistant', text: 'r1' },
      { role: 'user', text: 'q2' },
    ]);
    const { contents } = geminiRequests[0];
    expect(contents[0].role).toBe('user');
    expect(contents.map((c) => c.parts[0].text)).toEqual(['q1', 'r1', 'q2']);
  });

  it('mappe une erreur 429 sur un message de quota', async () => {
    setGeminiScenario('quotaExceeded');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/limite d.utilisation|Quota/i);
  });

  it('mappe une erreur 503 sur un message de surcharge', async () => {
    setGeminiScenario('overloaded');
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/surchargé/i);
  });

  it('renvoie un message générique sur erreur serveur inconnue (500)', async () => {
    setGeminiScenario('serverError');
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
    // C'est bien une string rendue telle quelle — aucune exécution.
    expect(out).toContain('<script>alert(1)</script>');
    expect(typeof out).toBe('string');
  });
});
