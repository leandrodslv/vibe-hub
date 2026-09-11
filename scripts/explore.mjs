#!/usr/bin/env node
// @ts-check
/**
 * Spike exploratoire — V8 de docs/ai/roadmap-automatisation.md.
 *
 * « Teste juste pour voir. » Prépare une branche isolée + le contexte pour que
 * Claude Code implémente l'idée A→Z, avec une référence de perf figée au point
 * de départ. Le résultat part en PR `spike` — jamais mergée telle quelle.
 *
 *   npm run explore -- "remplacer react-markdown par marked"
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim();

const objective = process.argv.slice(2).join(' ').trim();
if (!objective) {
  console.error('Usage : npm run explore -- "<objectif du spike>"');
  process.exit(1);
}

const slug = objective
  .normalize('NFKD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 40);

const branch = `explore/${slug}`;
const startPoint = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

if (sh('git', ['status', '--porcelain'])) {
  console.error('Working tree non propre — commit ou stash avant un spike.');
  process.exit(1);
}

sh('git', ['branch', '--list', branch])
  ? sh('git', ['checkout', branch])
  : sh('git', ['checkout', '-b', branch]);
console.log(`Branche : ${branch} (depuis ${startPoint})`);

console.log('Capture de la référence de perf (build)…');
sh('node', ['scripts/perf-diff.mjs', '--save'], { stdio: 'inherit' });

const context = `# Spike — ${objective}

Branche : \`${branch}\` (depuis \`${startPoint}\`)

## Ta mission (Claude Code)

1. Implémente l'idée **de bout en bout** : ${objective}
   - code, tests adaptés, docs \`docs/ai/*\` si un invariant bouge.
2. \`npm run validate\` doit passer (ou documenter précisément ce qui casse et pourquoi).
3. \`node scripts/perf-diff.mjs\` → compare à la référence (reports/perf-baseline.json,
   figée au point de départ) → \`reports/perf-diff.md\`.
4. Dans la description de PR : colle \`reports/perf-diff.md\` + une reco claire
   **on garde / à retravailler / on jette**, avec le raisonnement.
5. \`gh pr create --draft --label spike --title "spike: ${objective}"\` — **jamais**
   de merge tel quel : un spike sert à décider, pas à livrer.

Contraintes d'archi : respecte l'Architecture Spine (\`docs/ai/architecture.md\`).
Ne touche pas \`supabase/migrations/\`, \`src/config/\`, \`.github/\` sans le signaler.
`;

writeFileSync('EXPLORE_CONTEXT.md', context, 'utf8');
console.log('\nÉcrit : EXPLORE_CONTEXT.md');
console.log('\nLance :  claude\npuis :  « Réalise le spike décrit dans EXPLORE_CONTEXT.md »');
