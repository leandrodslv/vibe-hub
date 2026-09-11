#!/usr/bin/env node
// @ts-check
/**
 * Audit de perf comparatif — V8 de docs/ai/roadmap-automatisation.md.
 *
 * « Teste juste pour voir, implémente A→Z, et donne-moi un audit de perf. »
 * Mesure le coût réel d'un spike : poids du bundle (gzip, par groupe), temps de
 * build, nombre de dépendances de prod, nombre de chunks.
 *
 *   node scripts/perf-diff.mjs --save     # enregistre la référence (point de départ)
 *   node scripts/perf-diff.mjs            # build + compare à la référence → reports/perf-diff.md
 */

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';

const BASELINE = 'reports/perf-baseline.json';
const save = process.argv.includes('--save');

// `npm`/`npx` : via le shell (sur Windows ce sont des `.cmd`). Commande fixe,
// pas d'entrée externe → `execSync` d'une chaîne littérale est sans risque ici.
const runShell = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', ...opts });

/** @returns {{ build_ms: number, deps: number, chunks: number, dist_gzip: number, sizes: Record<string, number> }} */
function measure() {
  const t0 = Date.now();
  runShell('npm run build', { stdio: 'ignore' });
  const build_ms = Date.now() - t0;

  const sl = JSON.parse(runShell('npx size-limit --json'));
  /** @type {Record<string, number>} */
  const sizes = {};
  for (const e of sl) sizes[e.name] = e.size;

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const deps = Object.keys(pkg.dependencies ?? {}).length;

  const jsFiles = readdirSync('dist/assets').filter((f) => f.endsWith('.js'));
  const dist_gzip = jsFiles.reduce((n, f) => {
    const gz = execFileSync('node', [
      '-e',
      `process.stdout.write(String(require('zlib').gzipSync(require('fs').readFileSync('dist/assets/${f}')).length))`,
    ]);
    return n + Number(gz);
  }, 0);

  return { build_ms, deps, chunks: jsFiles.length, dist_gzip, sizes };
}

const current = measure();
mkdirSync('reports', { recursive: true });

if (save || !existsSync(BASELINE)) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2));
  console.log(`Référence perf enregistrée : ${BASELINE}`);
  if (!save) console.log('(relance sans --save après ta modif pour comparer)');
  process.exit(0);
}

const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
const kb = (n) => (n / 1024).toFixed(1) + ' kB';
const delta = (b, c) => {
  const d = c - b;
  const pct = b ? ((d / b) * 100).toFixed(1) : '—';
  const sign = d > 0 ? '+' : '';
  return `${sign}${d === 0 ? '0' : Math.abs(d) < 1024 && Math.abs(d) > 0 ? d + ' o' : kb(d)} (${sign}${pct}%)`;
};

const s = (ms) => `${(ms / 1000).toFixed(1)} s`;
const rows = [
  [
    'Temps de build',
    s(base.build_ms),
    s(current.build_ms),
    `${current.build_ms - base.build_ms >= 0 ? '+' : ''}${((current.build_ms - base.build_ms) / 1000).toFixed(1)} s`,
  ],
  [
    'Dépendances (prod)',
    base.deps,
    current.deps,
    current.deps - base.deps === 0
      ? '0'
      : `${current.deps - base.deps > 0 ? '+' : ''}${current.deps - base.deps}`,
  ],
  [
    'Chunks JS',
    base.chunks,
    current.chunks,
    `${current.chunks - base.chunks >= 0 ? '+' : ''}${current.chunks - base.chunks}`,
  ],
  [
    'Total JS livré (gzip)',
    kb(base.dist_gzip),
    kb(current.dist_gzip),
    delta(base.dist_gzip, current.dist_gzip),
  ],
];
for (const name of new Set([...Object.keys(base.sizes), ...Object.keys(current.sizes)])) {
  rows.push([
    name,
    kb(base.sizes[name] ?? 0),
    kb(current.sizes[name] ?? 0),
    delta(base.sizes[name] ?? 0, current.sizes[name] ?? 0),
  ]);
}

const md = `# Audit de perf — spike

| Métrique | Référence | Après | Δ |
|---|---|---|---|
${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}

## Lecture

- **Total JS livré (gzip)** est la métrique reine : c'est ce que l'utilisateur télécharge.
- Un **+N dépendance** demande une justification (mainteneur, surface d'attaque, poids).
- Le **temps de build** compte pour le feedback CI/local, pas pour l'utilisateur.

## Reco (à compléter par l'agent / le reviewer)

- [ ] on garde — le gain justifie le coût
- [ ] à retravailler — l'idée est bonne mais le coût est trop élevé
- [ ] on jette — pas de gain net
`;

writeFileSync('reports/perf-diff.md', md, 'utf8');
console.log('Écrit : reports/perf-diff.md\n');
console.log(md);
