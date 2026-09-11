import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, isAiConfigured } from '../config/env.js';
import { logger, serializeError } from '../lib/logger.js';
import { parseOrThrow } from '../lib/schemas/parse.js';
import { geminiTextSchema } from '../lib/schemas/index.js';

// ⚠️ DETTE ARCHITECTURALE — Architecture Spine AD-1.
// Cet adaptateur appelle Gemini DEPUIS LE NAVIGATEUR : la clé (`VITE_GEMINI_API_KEY`)
// est inlinée dans le bundle et extractible par n'importe quel visiteur du site
// déployé — vecteur d'abus / de coût.
// Cible : une Edge Function Supabase `gemini-proxy` détenant la clé côté serveur ;
// ce fichier ne fera plus qu'un `fetch()` HTTPS vers ce proxy.
// Cf. docs/ai/security-rules.md § « Clé Gemini » et docs/ai/architecture.md.
const apiKey = env.geminiApiKey;

// Initialisation de l'instance Gemini
const genAI = new GoogleGenerativeAI(apiKey);

// Le modèle par défaut
const DEFAULT_INSTRUCTION =
  "Tu es un assistant IA expert en design UI/UX. Ton rôle est d'aider l'utilisateur à concevoir des interfaces ou rédiger de bons prompts pour générer des UI. Quand ta réponse contient un prompt final destiné à être envoyé au Générateur UI, place ce prompt et uniquement ce prompt dans un unique bloc de code Markdown (```), sans language tag ; toute explication ou conseil complémentaire doit rester en dehors de ce bloc.";

/**
 * Fonction pour envoyer une conversation à l'IA et obtenir une réponse
 * @param {Array<{role: string, text: string}>} history - L'historique complet de la conversation
 * @param {string|null} customInstruction - Instructions personnalisées du projet (optionnel)
 * @returns {Promise<string>} - La réponse générée par l'IA
 */
export const generateAIResponse = async (history, customInstruction = null) => {
  if (!isAiConfigured()) {
    logger.warn('ai:not-configured');
    return "⚠️ Erreur : La clé API Gemini n'est pas configurée. Veuillez ajouter votre clé dans le fichier `.env` à la racine du projet (`VITE_GEMINI_API_KEY=votre_cle`).";
  }

  // Si on est dans un projet avec des instructions personnalisées, on les utilise. Sinon, on prend celles par défaut.
  const systemInstructionToUse = customInstruction || DEFAULT_INSTRUCTION;

  // On instancie le modèle spécifiquement pour cet appel avec les bonnes instructions
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: systemInstructionToUse,
  });

  try {
    // 1. On sépare les anciens messages du tout dernier message
    const previousMessages = history.slice(0, -1).map((msg) => {
      const parts = [{ text: msg.text }];
      if (msg.image) {
        const [meta, data] = msg.image.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        parts.push({
          inlineData: { data, mimeType },
        });
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    // Gemini EXIGE que le premier message de l'historique vienne de l'utilisateur ('user').
    // Si notre historique local commence par le message d'accueil de l'IA ('model'), on l'ignore pour l'API.
    while (previousMessages.length > 0 && previousMessages[0].role === 'model') {
      previousMessages.shift();
    }

    const lastMessageRaw = history[history.length - 1];
    const lastMessageParts = [{ text: lastMessageRaw.text }];
    if (lastMessageRaw.image) {
      const [meta, data] = lastMessageRaw.image.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];
      lastMessageParts.push({
        inlineData: { data, mimeType },
      });
    }

    // 2. On démarre une session de chat avec l'historique nettoyé
    const chat = model.startChat({
      history: previousMessages,
    });

    // 3. On envoie le dernier message et on attend la réponse
    const result = await chat.sendMessage(lastMessageParts);
    const response = await result.response;
    // Une complétion vide / non-textuelle est une défaillance du modèle : on la
    // traite comme telle (trace + message d'erreur) plutôt que de renvoyer '' .
    return parseOrThrow(geminiTextSchema, response.text(), 'gemini:generateAIResponse');
  } catch (error) {
    logger.error('ai:gemini-call-failed', { status: error?.status, ...serializeError(error) });

    // Affiner le message d'erreur en fonction du retour de l'API
    if (error.status === 429) {
      return "⚠️ Vous avez atteint la limite d'utilisation de votre clé API (Quota dépassé). Veuillez vérifier votre forfait sur Google AI Studio.";
    }
    if (error.status === 503) {
      return "⚠️ Les serveurs de l'IA sont actuellement surchargés. Veuillez réessayer dans quelques instants.";
    }

    return "Désolé, une erreur s'est produite lors de la communication avec l'IA. Veuillez vérifier votre connexion ou votre clé API.";
  }
};
