#!/usr/bin/env node
// @ts-check
/**
 * Brouillon de cours généré depuis un fichier vidéo LOCAL — pour les vidéos
 * hors YouTube (TikTok, Facebook, Reels...) que l'Edge Function `course-draft`
 * ne prend pas en charge : aucune Edge Function ne doit jamais télécharger une
 * vidéo TikTok/Facebook elle-même — les CGU des deux plateformes l'interdisent
 * (cf. _bmad-output/planning-artifacts/epics-video-platforms.md, Story
 * 10.1/10.2/10.3). Ce script part donc d'un fichier que TOI as déjà
 * enregistré/exporté toi-même (ta propre action, pas un scraping automatisé),
 * jamais d'une URL.
 *
 * Deux modes :
 *
 *   1. Par défaut — Gemini « regarde » la vidéo entière (File API) et rédige
 *      le cours directement. Simple, mais la vidéo complète part vers Gemini.
 *
 *        GEMINI_API_KEY=<clé> npm run course-from-video -- video.mp4
 *
 *   2. --transcribe — l'audio est extrait localement (ffmpeg) et transcrit
 *      localement (Whisper via Transformers.js, 100% offline, aucun cloud,
 *      aucun coût par appel) ; SEUL le texte de la transcription part ensuite
 *      vers Gemini pour être structuré en cours. Moins cher, plus rapide, la
 *      vidéo elle-même ne quitte jamais la machine. La durée du cours est
 *      calculée directement depuis le fichier (ffprobe), pas devinée par Gemini.
 *
 *        GEMINI_API_KEY=<clé> npm run course-from-video -- video.mp4 --transcribe
 *
 * Dans les deux cas, le script n'écrit rien en base : il imprime le brouillon
 * JSON (title/description/duration/content) à relire et coller à la main dans
 * l'éditeur de cours (/admin) — rien n'est publié automatiquement.
 *
 * `GEMINI_API_KEY` est le même secret que celui posé pour `gemini-proxy` /
 * `course-draft` (voir .env.example) — ce script tourne en local, jamais dans
 * le navigateur.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, readFile, rm } from 'node:fs/promises';

const MODEL = 'gemini-2.5-flash-lite';
// Modèle Whisper multilingue (PAS le suffixe `.en`, le contenu est francophone).
// Écrasable via WHISPER_MODEL si besoin de plus rapide/léger ou plus précis
// (voir https://huggingface.co/models?library=transformers.js&search=whisper).
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'Xenova/whisper-small';

// Doit rester synchronisé avec supabase/functions/course-draft/index.ts — même
// schéma de sortie et même modèle Gemini, pour un brouillon cohérent quelle
// que soit la source (Edge Function YouTube, vidéo locale, ou transcription).
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

const PROMPT_FROM_VIDEO = `Regarde cette vidéo et rédige, à partir de son contenu réel, un cours pour un designer UI/UX francophone. Réponds STRICTEMENT au format JSON demandé, sans texte hors du JSON.

- title : titre court et concret (pas d'emoji, pas de ponctuation finale).
- description : 1 à 2 phrases factuelles résumant ce que le cours apprend (pas de superlatifs, pas de tournure publicitaire).
- duration : durée approximative de la vidéo au format mm:ss si tu peux l'estimer, sinon une chaîne vide.
- content : le support de cours complet en Markdown (titres avec #, listes, exemples concrets tirés de la vidéo) — un vrai contenu pédagogique que quelqu'un peut lire et comprendre SANS avoir vu la vidéo, pas un simple résumé de 3 lignes.`;

const promptFromTranscript = (transcript) => `Voici la transcription brute d'une vidéo (reconnaissance vocale automatique — peut contenir hésitations, répétitions ou petites erreurs). À partir de ce texte, rédige un cours pour un designer UI/UX francophone. Réponds STRICTEMENT au format JSON demandé, sans texte hors du JSON.

- title : titre court et concret (pas d'emoji, pas de ponctuation finale).
- description : 1 à 2 phrases factuelles résumant ce que le cours apprend (pas de superlatifs, pas de tournure publicitaire).
- duration : laisse une chaîne vide, elle sera renseignée séparément.
- content : le support de cours complet en Markdown (titres avec #, listes, exemples concrets tirés du texte) — un vrai contenu pédagogique nettoyé et structuré, pas un copier-coller brut de la transcription.

Transcription :
"""
${transcript}
"""`;

const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.m4v': 'video/x-m4v',
};

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

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

/** Gemini regarde la vidéo entière (mode par défaut). */
async function generateFromVideo(ai, filePath, mimeType) {
  console.log(`Envoi de ${basename(filePath)} à Gemini…`);
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const file = await waitUntilActive(ai, uploaded);

  console.log('Génération du brouillon…');
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ fileData: { fileUri: file.uri, mimeType } }, { text: PROMPT_FROM_VIDEO }],
      },
    ],
    config: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
  });
  return res.text ?? '';
}

/** Audio extrait + transcrit localement (Whisper), seul le texte part vers Gemini. */
async function generateFromTranscript(ai, filePath) {
  const ffmpegStatic = (await import('ffmpeg-static')).default;
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  ffmpeg.setFfmpegPath(ffmpegStatic);

  const tmpDir = await mkdtemp(join(tmpdir(), 'course-from-video-'));
  const wavPath = join(tmpDir, 'audio.wav');

  try {
    console.log("Extraction de l'audio (ffmpeg)…");
    const durationSeconds = await new Promise((resolve, reject) => {
      let duration = 0;
      ffmpeg(filePath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .on('codecData', (data) => {
          // ex. "00:01:23.45" → 83.45s — la seule source fiable de la durée
          // exacte, jamais devinée par le modèle.
          const [h, m, s] = data.duration.split(':').map(Number);
          duration = h * 3600 + m * 60 + s;
        })
        .on('error', reject)
        .on('end', () => resolve(duration))
        .save(wavPath);
    });

    console.log(
      `Chargement du modèle Whisper (${WHISPER_MODEL}) — téléchargé et mis en cache au premier lancement…`
    );
    const { pipeline } = await import('@huggingface/transformers');
    const wavefile = (await import('wavefile')).default;

    const transcriber = await pipeline('automatic-speech-recognition', WHISPER_MODEL);

    const buffer = await readFile(wavPath);
    const wav = new wavefile.WaveFile(buffer);
    wav.toBitDepth('32f');
    wav.toSampleRate(16000);
    let audioData = wav.getSamples();
    if (Array.isArray(audioData)) {
      audioData = audioData[0]; // mono déjà forcé par ffmpeg, un seul canal
    }

    console.log('Transcription en cours (peut prendre un moment selon la durée)…');
    const { text: transcript } = await transcriber(audioData, {
      language: 'french',
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    if (!transcript?.trim()) {
      throw new Error("Transcription vide — vérifie que la vidéo contient bien de l'audio parlé.");
    }

    console.log('Transcription terminée. Mise en forme du cours par Gemini…');
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: promptFromTranscript(transcript) }] }],
      config: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
    });

    return { raw: res.text ?? '', durationSeconds };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const transcribeMode = args.includes('--transcribe');
  const filePath = args.find((a) => !a.startsWith('--'));

  if (!filePath) {
    console.error(
      'Usage : GEMINI_API_KEY=<clé> npm run course-from-video -- <chemin-vers-video.mp4> [--transcribe]'
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

  let raw;
  let durationOverride;
  if (transcribeMode) {
    const result = await generateFromTranscript(ai, filePath);
    raw = result.raw;
    durationOverride = formatDuration(result.durationSeconds);
  } else {
    raw = await generateFromVideo(ai, filePath, mimeType);
  }

  let draft;
  try {
    draft = JSON.parse(raw);
  } catch {
    console.error('Réponse du modèle illisible (JSON invalide) :\n' + raw);
    process.exit(1);
  }

  if (durationOverride) draft.duration = durationOverride;

  console.log('\n--- Brouillon généré (à relire, puis coller dans /admin) ---\n');
  console.log(JSON.stringify(draft, null, 2));
}

main().catch((err) => {
  console.error('Échec de génération :', err?.message || err);
  process.exit(1);
});
