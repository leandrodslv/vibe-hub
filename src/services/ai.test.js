import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  const state = {
    aiConfigured: true,
    sendMessage: vi.fn(),
    lastStartChatArg: null,
  };
  return { state };
});

vi.mock('../config/env.js', () => ({
  env: { geminiApiKey: 'AQ.test-key', mode: 'test', isProd: false },
  isAiConfigured: () => h.state.aiConfigured,
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        startChat: (arg) => {
          h.state.lastStartChatArg = arg;
          return { sendMessage: h.state.sendMessage };
        },
      };
    }
  },
}));

const { generateAIResponse } = await import('./ai.js');

beforeEach(() => {
  h.state.aiConfigured = true;
  h.state.sendMessage.mockReset();
  h.state.lastStartChatArg = null;
});

const ok = (text) => ({ response: Promise.resolve({ text: () => text }) });

describe('generateAIResponse', () => {
  it('renvoie un message d’erreur explicite si l’IA n’est pas configurée', async () => {
    h.state.aiConfigured = false;
    const out = await generateAIResponse([{ role: 'user', text: 'salut' }]);
    expect(out).toMatch(/clé API Gemini/i);
    expect(h.state.sendMessage).not.toHaveBeenCalled();
  });

  it('renvoie le texte généré en cas de succès', async () => {
    h.state.sendMessage.mockResolvedValue(ok('Voici ta réponse'));
    const out = await generateAIResponse([
      { role: 'assistant', text: 'Bonjour' },
      { role: 'user', text: 'Fais-moi un bouton' },
    ]);
    expect(out).toBe('Voici ta réponse');
  });

  it('ignore les messages "model" en tête d’historique (contrainte Gemini)', async () => {
    h.state.sendMessage.mockResolvedValue(ok('x'));
    await generateAIResponse([
      { role: 'assistant', text: 'accueil' },
      { role: 'user', text: 'q1' },
      { role: 'assistant', text: 'r1' },
      { role: 'user', text: 'q2' },
    ]);
    const history = h.state.lastStartChatArg.history;
    expect(history[0].role).toBe('user');
    expect(history).toHaveLength(2); // q1, r1 — q2 est le message courant, envoyé à part
  });

  it('mappe une erreur 429 sur un message de quota', async () => {
    h.state.sendMessage.mockRejectedValue(Object.assign(new Error('quota'), { status: 429 }));
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/limite d.utilisation|Quota/i);
  });

  it('mappe une erreur 503 sur un message de surcharge', async () => {
    h.state.sendMessage.mockRejectedValue(Object.assign(new Error('down'), { status: 503 }));
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/surchargé/i);
  });

  it('renvoie un message générique sur erreur inconnue', async () => {
    h.state.sendMessage.mockRejectedValue(new Error('???'));
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/une erreur s.est produite/i);
  });

  it('traite une complétion vide comme une défaillance (pas de "" silencieux)', async () => {
    h.state.sendMessage.mockResolvedValue(ok(''));
    const out = await generateAIResponse([{ role: 'user', text: 'x' }]);
    expect(out).toMatch(/une erreur s.est produite/i);
  });
});
