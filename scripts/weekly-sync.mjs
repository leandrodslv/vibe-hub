#!/usr/bin/env node
// @ts-check
/**
 * « Tâche inhumaine » — revue de synchro hebdo (V7 de docs/ai/roadmap-automatisation.md).
 *
 * L'agent de la vidéo « lit toutes les branches, les résultats de tests, les
 * commentaires de PR/issues » et sort un doc de préparation de réunion qui ne
 * pointe QUE les vrais sujets. Ici :
 *
 *  1. `weekly-sync.mjs` agrège (gh + git) → `reports/weekly-sync-data.md` (brut)
 *     + `WEEKLY_SYNC_CONTEXT.md` (données + consigne de synthèse pour Claude Code).
 *  2. Si `GEMINI_API_KEY` : synthèse automatique → `reports/weekly-sync-<date>.md`.
 *  3. Sinon : `npm run weekly-sync` puis `claude` sur `WEEKLY_SYNC_CONTEXT.md`.
 *
 *   npm run weekly-sync
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { askGemini } from './lib/gemini.mjs';

/** exécute une commande, renvoie '' en cas d'échec (jamais de throw). */
const tryRun = (cmd, args) => {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};
const json = (s, fallback) => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

const today = new Date().toISOString().slice(0, 10);
const weekAgo = Date.now() - 7 * 864e5;

// ─── Branches distantes vs main ──────────────────────────────────────────────
tryRun('git', ['fetch', 'origin', '--prune', '--quiet']);
const branches = tryRun('git', [
  'for-each-ref',
  '--format=%(refname:short)|%(committerdate:iso8601)|%(authorname)',
  'refs/remotes/origin',
])
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    const [name, date, author] = l.split('|');
    if (['origin', 'origin/HEAD', 'origin/main'].includes(name)) return null;
    const counts = tryRun('git', ['rev-list', '--left-right', '--count', `origin/main...${name}`]);
    const [behind, ahead] = counts.split(/\s+/).map(Number);
    return {
      name: name.replace('origin/', ''),
      date,
      author,
      ahead: ahead || 0,
      behind: behind || 0,
    };
  })
  .filter(Boolean);

// ─── PRs ouvertes ───────────────────────────────────────────────────────────
const prs = json(
  tryRun('gh', [
    'pr',
    'list',
    '--state',
    'open',
    '--json',
    'number,title,isDraft,reviewDecision,mergeable,createdAt,headRefName,comments,labels',
  ]),
  []
).map((p) => ({
  number: p.number,
  title: p.title,
  draft: p.isDraft,
  review: p.reviewDecision || '—',
  mergeable: p.mergeable,
  comments: (p.comments ?? []).length,
  ageDays: Math.round((Date.now() - Date.parse(p.createdAt)) / 864e5),
  labels: (p.labels ?? []).map((l) => l.name),
}));

// ─── Issues ouvertes ────────────────────────────────────────────────────────
const issues = json(
  tryRun('gh', [
    'issue',
    'list',
    '--state',
    'open',
    '--json',
    'number,title,labels,createdAt,comments',
  ]),
  []
).map((i) => ({
  number: i.number,
  title: i.title,
  labels: (i.labels ?? []).map((l) => l.name),
  comments: (i.comments ?? []).length,
  ageDays: Math.round((Date.now() - Date.parse(i.createdAt)) / 864e5),
}));
const aiFix = issues.filter((i) => i.labels.includes('ai-fix'));

// ─── CI sur main — échecs des 7 derniers jours ──────────────────────────────
const runs = json(
  tryRun('gh', [
    'run',
    'list',
    '--branch',
    'main',
    '--limit',
    '30',
    '--json',
    'conclusion,createdAt,displayTitle,url,workflowName',
  ]),
  []
).filter((r) => Date.parse(r.createdAt) > weekAgo);
const failedRuns = runs.filter((r) => r.conclusion === 'failure');

// ─── npm audit ──────────────────────────────────────────────────────────────
const audit = json(tryRun('npm', ['audit', '--json', '--omit=dev']), {});
const vuln = audit?.metadata?.vulnerabilities ?? {};

// ─── Couverture (instantané) ────────────────────────────────────────────────
let coverage = null;
if (existsSync('coverage/coverage-summary.json')) {
  const t = json(readFileSync('coverage/coverage-summary.json', 'utf8'), {})?.total;
  if (t) coverage = { lines: t.lines?.pct, branches: t.branches?.pct, functions: t.functions?.pct };
}

// ─── Rapports de simulation en attente ──────────────────────────────────────
const simReports = existsSync('reports')
  ? tryRun('node', [
      '-e',
      "process.stdout.write(require('fs').readdirSync('reports').filter(f=>f.startsWith('simulation-')).join('\\n'))",
    ])
      .split('\n')
      .filter(Boolean)
  : [];

// ─── Assemblage du brut ─────────────────────────────────────────────────────
const md = `# Données de synchro — ${today}

## Branches ouvertes (vs main)

${
  branches.length === 0
    ? '_aucune_'
    : branches
        .sort((a, b) => b.ahead - a.ahead)
        .map(
          (b) =>
            `- \`${b.name}\` — +${b.ahead}/-${b.behind}, ${b.author}, MAJ ${b.date.slice(0, 10)}`
        )
        .join('\n')
}

## Pull requests ouvertes

${
  prs.length === 0
    ? '_aucune_'
    : prs
        .map(
          (p) =>
            `- #${p.number} ${p.draft ? '(draft) ' : ''}« ${p.title} » — review ${p.review}, mergeable ${p.mergeable}, ${p.comments} commentaires, ${p.ageDays} j${p.labels.length ? ` [${p.labels.join(', ')}]` : ''}`
        )
        .join('\n')
}

## Issues ouvertes (${issues.length}) — dont ai-fix (${aiFix.length})

${aiFix.length ? aiFix.map((i) => `- #${i.number} « ${i.title} » — ${i.ageDays} j, ${i.comments} commentaires`).join('\n') : '_aucune issue ai-fix_'}

Autres issues chaudes (≥ 3 commentaires) :
${
  issues
    .filter((i) => !i.labels.includes('ai-fix') && i.comments >= 3)
    .map((i) => `- #${i.number} « ${i.title} » — ${i.comments} commentaires`)
    .join('\n') || '_aucune_'
}

## CI sur main (7 j) — ${runs.length} runs, ${failedRuns.length} échecs

${failedRuns.map((r) => `- ❌ ${r.workflowName} « ${r.displayTitle} » — ${r.createdAt.slice(0, 10)} — ${r.url}`).join('\n') || '_aucun échec_'}

## Dépendances (npm audit --omit=dev)

critical: ${vuln.critical ?? 0} · high: ${vuln.high ?? 0} · moderate: ${vuln.moderate ?? 0} · low: ${vuln.low ?? 0}

## Couverture (instantané local)

${coverage ? `lignes ${coverage.lines}% · branches ${coverage.branches}% · fonctions ${coverage.functions}%` : '_coverage/coverage-summary.json absent (lancer npm run test:cov)_'}

## Rapports de simulation en attente

${simReports.length ? simReports.map((f) => `- reports/${f}`).join('\n') : '_aucun_'}
`;

mkdirSync('reports', { recursive: true });
writeFileSync('reports/weekly-sync-data.md', md, 'utf8');
console.log('Écrit : reports/weekly-sync-data.md');

const SYNTHESIS_PROMPT = `Tu prépares la réunion de synchro hebdo d'une petite équipe. À partir des
données brutes ci-dessous, écris **une page maximum** en Markdown, structurée ainsi :

## À discuter en réunion
- Points de tension (PR qui traînent, review en conflit, désaccord visible dans les commentaires)
- Décisions d'architecture à trancher
- Tests / CI qui régressent et bloquent

## Déjà réglé / pour info
- ce qui avance bien, ce qui s'est résolu tout seul

## Quick wins (< 30 min)
- corrections évidentes à faire tout de suite

Ne recopie pas les données. Priorise : ce qui coûte du temps à l'équipe, ce qui bloque
quelqu'un, ce qui est risqué. Si une section est vide, écris « rien cette semaine ».`;

// ─── Synthèse : Gemini si clé, sinon contexte pour Claude ───────────────────
const combined = `${SYNTHESIS_PROMPT}\n\n---\n\n${md}`;
const synth = await askGemini(combined, { maxChars: 60_000 });

if (synth) {
  const out = `# Synchro hebdo — ${today}\n\n${synth}\n\n<sub>Généré depuis reports/weekly-sync-data.md</sub>\n`;
  writeFileSync(`reports/weekly-sync-${today}.md`, out, 'utf8');
  console.log(`Écrit : reports/weekly-sync-${today}.md`);
} else {
  writeFileSync('WEEKLY_SYNC_CONTEXT.md', combined, 'utf8');
  console.log('Écrit : WEEKLY_SYNC_CONTEXT.md');
  console.log('\nLance :  claude\npuis :  « Rédige la synthèse hebdo de WEEKLY_SYNC_CONTEXT.md »');
}
