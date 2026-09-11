#!/usr/bin/env node
// @ts-check
/**
 * Pentest — 2ᵉ paire d'yeux : envoie le diff + la grille à Gemini (V6).
 *
 * Contrairement à `pentest:review` (qui prépare pour Claude Code / plan Pro),
 * celui-ci APPELLE le modèle — il faut donc une clé :
 *   GEMINI_API_KEY=…  npm run pentest:llm
 * En CI : secret `GEMINI_API_KEY` (le workflow `pentest` l'utilise s'il existe).
 *
 * Sortie : `reports/pentest-gemini.md`. Exit 1 si un finding critical/high.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { askGemini } from './lib/gemini.mjs';

if (!process.env.GEMINI_API_KEY) {
  console.log(
    'GEMINI_API_KEY absente — revue LLM ignorée (non bloquant).\n' +
      'Pour la revue Claude Code (plan Pro, sans clé) : `npm run pentest:review`.'
  );
  process.exit(0);
}

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
const base = process.argv[2] || 'origin/main';
try {
  sh('git', ['fetch', 'origin', 'main', '--quiet']);
} catch {
  /* offline */
}
let range = 'HEAD~1..HEAD';
try {
  range = `${sh('git', ['merge-base', base, 'HEAD'])}..HEAD`;
} catch {
  /* garde HEAD~1 */
}
const diff = sh('git', ['diff', '--unified=3', range, '--', 'src/', 'supabase/', 'vercel.json']);
if (!diff) {
  console.log('Aucun changement de code.');
  process.exit(0);
}

const prompt = `Tu es un pentester senior. Audit de SÉCURITÉ UNIQUEMENT du diff ci-dessous
(React/Vite/Supabase/Gemini). IGNORE l'accessibilité, le style, les choix d'architecture,
les suggestions de librairie — uniquement des failles exploitables.

Cherche : XSS (HTML non échappé depuis une entrée), injection (SQL/PostgREST par
concaténation, prompt, eval/new Function), secret en dur ou derrière VITE_*, service_role
côté client, SSRF dans l'edge function gemini-proxy, contrôle d'accès fait dans le React
au lieu de la RLS, CSRF, target="_blank" sans rel="noopener", CSP affaiblie dans
vercel.json, entrée non validée avant DOM/stockage.

Pour chaque finding RÉEL : une ligne JSON
{"severity":"critical|high|medium|low","file":"…","line":N,"issue":"…","fix":"…"}
Aucun finding => écris exactement "AUCUN FINDING".
Termine par: PENTEST_VERDICT: PASS  (aucun critical/high)  ou  FAIL: <résumé>.

\`\`\`diff
${diff}
\`\`\``;

const text = await askGemini(prompt, { maxChars: 64_000 });
if (text === null) {
  console.log('Revue Gemini indisponible (non bloquant).');
  process.exit(0);
}

mkdirSync('reports', { recursive: true });
writeFileSync(
  'reports/pentest-gemini.md',
  `# Revue de sécurité Gemini — \`${range}\`\n\n${text}\n`,
  'utf8'
);
console.log('Écrit : reports/pentest-gemini.md');

if (/"severity"\s*:\s*"(critical|high)"/i.test(text)) {
  console.error('❌ Gemini : finding critical/high — voir reports/pentest-gemini.md');
  process.exitCode = 1;
} else {
  console.log('✅ Gemini : pas de finding critical/high.');
}
