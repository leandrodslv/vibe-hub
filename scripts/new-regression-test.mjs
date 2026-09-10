#!/usr/bin/env node
// @ts-check
/**
 * Échafaude un test de régression — « 1 bug corrigé = 1 test qui empêche son
 * retour » (docs/ai/testing-rules.md, V3 de la roadmap).
 *
 *   node scripts/new-regression-test.mjs "<slug>" [numero-issue]
 *   npm run test:regression:new -- "waitlist-double-submit" 123
 *
 * Crée src/test/regression/<slug>.test.js à partir d'un gabarit rouge-puis-vert.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , rawSlug, issue] = process.argv;

if (!rawSlug) {
  console.error('Usage : node scripts/new-regression-test.mjs "<slug>" [numero-issue]');
  process.exit(1);
}

const slug = rawSlug
  .normalize('NFKD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

if (!slug) {
  console.error(`Slug invalide : "${rawSlug}"`);
  process.exit(1);
}

const dir = join('src', 'test', 'regression');
const file = join(dir, `${slug}.test.js`);

const ref = issue ? `#${issue}` : slug;
const link = issue ? `\n * @see https://github.com/OWNER/vibe-hub/issues/${issue}` : '';

const template = `import { describe, it, expect } from 'vitest';

/**
 * Régression ${ref}.${link}
 *
 * Symptôme : <décris le comportement observé côté utilisateur>
 * Cause    : <la cause racine, une fois identifiée>
 *
 * Ce test DOIT échouer sur le code buggé (le vérifier avant le fix) et passer
 * après. Il reste ensuite comme garde-fou permanent.
 */
describe('régression ${ref}', () => {
  it('<le comportement correct attendu>', () => {
    // Arrange : reproduis l'état qui déclenchait le bug
    // Act
    // Assert
    expect(true).toBe(true); // TODO: remplacer par la vraie assertion
  });
});
`;

mkdirSync(dir, { recursive: true });
try {
  // `wx` : création atomique — échoue si le fichier existe déjà (pas de
  // vérification séparée, donc pas de course TOCTOU).
  writeFileSync(file, template, { encoding: 'utf8', flag: 'wx' });
} catch (err) {
  if (err && /** @type {NodeJS.ErrnoException} */ (err).code === 'EEXIST') {
    console.error(`Existe déjà : ${file}`);
    process.exit(1);
  }
  throw err;
}

console.log(`✅ Créé : ${file}

Étapes :
  1. Écris l'assertion qui reproduit le bug.
  2. npx vitest run ${file}   → il doit ÉCHOUER sur le code actuel.
  3. Corrige le bug. Le test passe.
  4. Commit 'fix: …' incluant ce fichier.`);
