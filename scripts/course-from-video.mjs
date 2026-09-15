#!/usr/bin/env node
// @ts-check
/**
 * Brouillon de cours généré par Gemini depuis un fichier vidéo LOCAL — pour les
 * vidéos hors YouTube (TikTok, Facebook, Reels...) que l'Edge Function
 * `course-draft` ne prend pas en charge : Gemini sait analyser un fichier vidéo
 * directement (File API), mais aucune Edge Function ne doit jamais télécharger
 * une vidéo TikTok/Facebook elle-même — les CGU des deux plateformes
 * l'interdisent (cf. _bmad-output/planning-artifacts/epics-video-platforms.md,
 * Story 10.1/10.2). Ce script part donc d'un fichier que TOI as déjà
 * enregistré/exporté toi-même (ta propre action, pas un scraping automatisé),
 * jamais d'une URL — le même principe que `addToWaitlist`/Gemini ailleurs dans
 * le projet : rien n'est téléchargé pour toi côté serveur.
 *
 * Usage :
 *   GEMINI_API_KEY=<clé> npm run course-from-video -- chemin/vers/video.mp4
 *
 * `GEMINI_API_KEY` est le même secret que celui posé pour `gemini-proxy` /
 * `course-draft` (voir .env.example) — jamais dans un fichier `.env` lu par
 * Vite (`VITE_*`), ce script tourne en local, pas dans le navigateur.
 *
 * Le script n'écrit rien en base : il imprime le brouillon JSON (title /
 * description / duration / content) à relire et coller à la main dans
 * l'éditeur de cours (/admin) — même contrat que le brouillon généré depuis
 * YouTube, rien n'est publié automatiquement.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { basename, extname } from 'node:path';

const MODEL = 'gemini-2.5-flash-lite';

// Doit rester synchronisé avec supabase/functions/course-draft/index.ts — même
// prompt, même schéma, même modèle, pour un brouillon cohérent quelle que soit
// la source vidéo (YouTube via l'Edge Function, ou un fichier local ici).
const PROMPT = `Regarde cette vidéo et rédige, à partir de son contenu réel, un cours pour un designer UI/UX francophone. Réponds STRICTEMENT au format JSON demandé, sans texte hors du JSON.

- title : titre court et concret (pas d'emoji, pas de ponctuation finale).
- description : 1 à 2 phrases factuelles résumant ce que le cours apprend (pas de superlatifs, pas de tournure publicitaire).
- duration : durée approximative de la vidéo au format mm:ss si tu peux l'estimer, sinon une chaîne vide.
- content : le support de cours complet en Markdown (titres avec #, listes, exemples concrets tirés de la vidéo) — un vrai contenu pédagogique que quelqu'un peut lire et comprendre SANS avoir vu la vidéo, pas un simple résumé de 3 lignes.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    duration: { type: Type.STRING },
    content: { type: Type.STRING },
  },
  required: ['title', 'description', 'duration', 'content'],
};

const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.m4v': 'video/x-m4v',
};

async function waitUntilActive(ai, file) {
  let current = file;
  while (current.state === 'PROCESSING') {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    current = await ai.files.get({ name: current.name });
    console.log(`  état du fichier : ${current.state}`);
  }
  if (current.state !== 'ACTIVE') {
    throw new Error(`Traitement Gemini du fichier échoué (état final : ${current.state}).`);
  }
  return current;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      'Usage : GEMINI_API_KEY=<clé> npm run course-from-video -- <chemin-vers-video.mp4>'
    );
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      'GEMINI_API_KEY manquante (même secret que gemini-proxy/course-draft — voir .env.example).'
    );
    process.exit(1);
  }

  const mimeType = MIME_BY_EXT[extname(filePath).toLowerCase()];
  if (!mimeType) {
    console.error(
      `Extension non reconnue (${extname(filePath)}). Formats supportés : ${Object.keys(MIME_BY_EXT).join(', ')}.`
    );
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`Envoi de ${basename(filePath)} à Gemini…`);
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const file = await waitUntilActive(ai, uploaded);

  console.log('Génération du brouillon…');
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ fileData: { fileUri: file.uri, mimeType } }, { text: PROMPT }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const raw = res.text ?? '';
  let draft;
  try {
    draft = JSON.parse(raw);
  } catch {
    console.error('Réponse du modèle illisible (JSON invalide) :\n' + raw);
    process.exit(1);
  }

  console.log('\n--- Brouillon généré (à relire, puis coller dans /admin) ---\n');
  console.log(JSON.stringify(draft, null, 2));
}

main().catch((err) => {
  console.error('Échec de génération :', err?.message || err);
  process.exit(1);
});
