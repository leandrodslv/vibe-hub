#!/usr/bin/env node
// @ts-check
/**
 * Triage local des issues `ai-fix` — V5 de docs/ai/roadmap-automatisation.md.
 *
 * La CI / la simulation ouvrent des issues `ai-fix` (échec + rapport). Ce script
 * prépare le terrain pour que TU lances Claude Code dessus en local (plan Pro,
 * pas de clé API en CI) :
 *
 *   npm run ai-fix            → liste les issues ai-fix ouvertes
 *   npm run ai-fix <numéro>   → branche `ai-fix/<n>` + AI_FIX_CONTEXT.md, puis
 *                               "lance `claude` et demande-lui de le résoudre"
 *
 * Nécessite `gh` (authentifié) et `git`.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

function requireTool(cmd) {
  try {
    sh(cmd, ['--version']);
  } catch {
    console.error(`\`${cmd}\` est requis et introuvable.`);
    process.exit(1);
  }
}

function list() {
  const raw = sh('gh', [
    'issue',
    'list',
    '--state',
    'open',
    '--label',
    'ai-fix',
    '--json',
    'number,title,createdAt',
    '--jq',
    '.[] | "#\\(.number)\\t\\(.createdAt[0:10])\\t\\(.title)"',
  ]);
  if (!raw) {
    console.log('Aucune issue `ai-fix` ouverte. 🎉');
    return;
  }
  console.log('Issues ai-fix ouvertes :\n');
  console.log(raw);
  console.log('\n→ `npm run ai-fix <numéro>` pour en préparer une.');
}

function prepare(arg) {
  // Accepte un numéro d'issue OU un short-sha présent dans un titre.
  let number = arg.replace(/^#/, '');
  if (!/^\d+$/.test(number)) {
    number = sh('gh', [
      'issue',
      'list',
      '--state',
      'open',
      '--label',
      'ai-fix',
      '--search',
      arg,
      '--json',
      'number',
      '--jq',
      '.[0].number // empty',
    ]);
    if (!number) {
      console.error(`Aucune issue ai-fix ouverte ne correspond à "${arg}".`);
      process.exit(1);
    }
  }

  const issue = JSON.parse(sh('gh', ['issue', 'view', number, '--json', 'number,title,body,url']));

  const branch = `ai-fix/${number}`;
  const current = sh('git', ['branch', '--show-current']);
  const exists = sh('git', ['branch', '--list', branch]);
  if (exists) {
    sh('git', ['checkout', branch]);
  } else {
    sh('git', ['checkout', '-b', branch]);
  }
  console.log(`Branche : ${branch} (depuis ${current})`);

  const context = `# Contexte de correction — issue #${issue.number}

> ${issue.title}
> ${issue.url}

## Rapport de l'issue

${issue.body}

---

## Ta mission (Claude Code)

1. Reproduire le problème (la commande de repro est dans le rapport ci-dessus —
   souvent \`SIM_SEEDS=<n> npm run test:simulation\` ou un job CI précis).
2. Corriger la cause racine, en respectant les invariants d'architecture
   (\`docs/ai/architecture.md\`, \`docs/ai/coding-rules.md\`).
3. Ajouter un test qui échoue avant / passe après :
   \`npm run test:regression:new -- "issue-${issue.number}"\`.
4. \`npm run validate\` doit être vert.
5. Commit \`fix: …\` (référence \`#${issue.number}\`), puis ouvrir une **PR draft**
   liée à l'issue (\`gh pr create --draft --fill\`). Pas de merge auto.

Contraintes : ne touche pas \`supabase/migrations/\`, \`src/config/\`, \`.github/\`
sans le signaler explicitement dans la PR.
`;

  writeFileSync('AI_FIX_CONTEXT.md', context, 'utf8');
  console.log(`\nÉcrit : AI_FIX_CONTEXT.md`);
  console.log(`\nLance maintenant :\n  claude\n`);
  console.log('puis : « Résous AI_FIX_CONTEXT.md »');
}

requireTool('gh');
requireTool('git');

const arg = process.argv[2];
if (!arg) list();
else prepare(arg);
