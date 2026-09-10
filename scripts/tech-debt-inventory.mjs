#!/usr/bin/env node
// @ts-check
/**
 * Inventaire de dette technique — V9 de docs/ai/roadmap-automatisation.md.
 *
 * « En 2026, on ne fait plus tourner que du code produit en 2026 — on a buté
 * tout le legacy. » Version Vibe Hub : plus d'invariant d'architecture (AD-*) en
 * dette, plus de `data/courses.js`, plus d'appel Gemini navigateur.
 *
 * Scanne les marqueurs (TODO/FIXME/@deprecated/LEGACY…), croise avec les
 * invariants de l'Architecture Spine, et sort `reports/tech-debt.md`.
 *
 *   npm run tech-debt
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const SCAN_DIRS = ['src', 'supabase', 'scripts'];
const SCAN_FILES = ['vite.config.js', 'vercel.json', 'tsconfig.json', 'package.json'];
const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.sql']);
const MARKER = /\b(TODO|FIXME|HACK|XXX|LEGACY|DEPRECATED|@deprecated|DETTE)\b/;
const SPINE =
  '_bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md';

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  if (!existsSync(dir)) return [];
  /** @type {string[]} */
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.name === 'node_modules' || e.name === 'dist') continue;
    if (e.isDirectory()) out.push(...walk(p));
    else if (CODE_EXT.has(extname(e.name))) out.push(p);
  }
  return out;
}

const files = [...SCAN_DIRS.flatMap(walk), ...SCAN_FILES.filter(existsSync)];

// ─── 1. Marqueurs de dette ──────────────────────────────────────────────────
/** @type {{file:string,line:number,marker:string,text:string,test:boolean}[]} */
const markers = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    const m = l.match(MARKER);
    if (m) {
      markers.push({
        file: f.replace(/\\/g, '/'),
        line: i + 1,
        marker: m[1].toUpperCase().replace('@', ''),
        text: l.trim().slice(0, 120),
        test: /\.(test|spec)\.|\/test\//.test(f),
      });
    }
  });
}

// ─── 2. Invariants d'architecture (AD-*) ────────────────────────────────────
/** @type {{id:string,title:string,inDebt:boolean,note:string}[]} */
const invariants = [];
if (existsSync(SPINE)) {
  const spine = readFileSync(SPINE, 'utf8');
  for (const m of spine.matchAll(/^### (AD-\d+) — (.+)$/gm)) {
    const [, id, title] = m;
    // « en dette » si un commentaire de code dit « dette AD-N » / « DETTE … AD-N »
    const debtHits = markers.filter(
      (mk) => new RegExp(`${id}\\b`).test(mk.text) && /DETTE|DEPRECATED|TODO|FIXME/.test(mk.marker)
    );
    invariants.push({
      id,
      title,
      inDebt: debtHits.length > 0,
      note: debtHits.map((h) => `${h.file}:${h.line}`).join(', '),
    });
  }
}

// ─── 3. Cibles connues (détectées) ─────────────────────────────────────────
/** @type {{item:string,evidence:string,severity:string}[]} */
const targets = [];

const aiSrc = existsSync('src/services/ai.js') ? readFileSync('src/services/ai.js', 'utf8') : '';
if (/@google\/generative-ai/.test(aiSrc) && /env\.geminiApiKey/.test(aiSrc)) {
  targets.push({
    item: 'AD-1 — appels Gemini depuis le navigateur, clé dans le bundle',
    evidence:
      'src/services/ai.js importe @google/generative-ai + utilise env.geminiApiKey ; edge function gemini-proxy fournie mais non branchée',
    severity: '🔴 critique',
  });
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.dependencies?.['@google/generative-ai']) {
  targets.push({
    item: '@google/generative-ai — déprécié par Google',
    evidence: `dependencies["@google/generative-ai"]=${pkg.dependencies['@google/generative-ai']} ; le Spine impose @google/genai pour le proxy`,
    severity: '🟠 moyen',
  });
}
if (existsSync('src/data/courses.js')) {
  targets.push({
    item: 'src/data/courses.js — catalogue en dur (LEGACY, remplacé par Supabase)',
    evidence: 'project-context.md : « ne pas ré-alimenter » — à supprimer une fois Supabase seul',
    severity: '🟡 bas',
  });
}
// AD-4 : le Spine impose une VUE security-invoker, la migration a fait une FONCTION security definer
const mig = existsSync('supabase/migrations/0001_rls_policies.sql')
  ? readFileSync('supabase/migrations/0001_rls_policies.sql', 'utf8')
  : '';
if (/security definer/i.test(mig) && /get_waitlist_counts/i.test(mig)) {
  targets.push({
    item: 'AD-4 — implémentation ≠ règle du Spine',
    evidence:
      'Spine : « vue security-invoker, PAS security definer » ; migration 0001 : fonction get_waitlist_counts() SECURITY DEFINER (déviation documentée dans la migration — à ratifier ou corriger)',
    severity: '🟡 bas',
  });
}

// ─── Rapport ───────────────────────────────────────────────────────────────
const byMarker = {};
for (const m of markers) byMarker[m.marker] = (byMarker[m.marker] ?? 0) + 1;

const md = `# Inventaire de dette technique — ${new Date().toISOString().slice(0, 10)}

## Résumé

- Marqueurs : ${markers.length} (${Object.entries(byMarker)
  .map(([k, v]) => `${k}: ${v}`)
  .join(' · ')})
  — dont ${markers.filter((m) => m.test).length} dans des tests.
- Invariants d'architecture en dette : ${invariants.filter((i) => i.inDebt).length} / ${invariants.length}.
- Cibles prioritaires détectées : ${targets.length}.

## Cibles prioritaires

${
  targets.length === 0
    ? '_aucune_'
    : targets.map((t) => `### ${t.severity} ${t.item}\n\n${t.evidence}\n`).join('\n')
}

## Invariants d'architecture (Spine)

| Invariant | En dette ? | Références |
|---|---|---|
${invariants.map((i) => `| ${i.id} — ${i.title} | ${i.inDebt ? '⚠️ oui' : '✅ non'} | ${i.note || '—'} |`).join('\n') || '| _spine introuvable_ | | |'}

## Marqueurs (hors tests)

${
  markers
    .filter((m) => !m.test)
    .map((m) => `- \`${m.file}:${m.line}\` **${m.marker}** — ${m.text}`)
    .join('\n') || '_aucun_'
}

## Marqueurs dans les tests

${
  markers
    .filter((m) => m.test)
    .map((m) => `- \`${m.file}:${m.line}\` **${m.marker}**`)
    .join('\n') || '_aucun_'
}

---

## Méthode (rappel)

Pour buter un item : **test de caractérisation d'abord** (fige le comportement actuel —
\`npm run test:regression:new -- "<slug>"\`), **puis** réécriture pilotée par agent
encadrée par ce test. Objectif : le nombre d'invariants AD en dette **décroît** à chaque sprint.
`;

mkdirSync('reports', { recursive: true });
writeFileSync('reports/tech-debt.md', md, 'utf8');
console.log('Écrit : reports/tech-debt.md\n');
console.log(md.split('\n').slice(0, 30).join('\n'));
