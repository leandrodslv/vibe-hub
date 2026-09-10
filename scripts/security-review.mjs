#!/usr/bin/env node
// @ts-check
/**
 * Pentest — prépare une revue de sécurité LLM du diff courant (V6).
 *
 * « Tout commit entrant se tape du pentest… puis tu lances Gemini, puis Grock,
 * puis tout le monde sur toi-même. » Ici : le diff + la grille de sécurité du
 * projet sont assemblés dans `PENTEST_REVIEW.md`, que tu donnes à Claude Code
 * (plan Pro, pas de clé API). Pour une 2ᵉ paire d'yeux : `npm run pentest:llm`
 * (Gemini, si `GEMINI_API_KEY` est configurée).
 *
 *   npm run pentest:review          # diff vs origin/main
 *   npm run pentest:review <ref>    # diff vs <ref>
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

const base = process.argv[2] || 'origin/main';
try {
  sh('git', ['fetch', 'origin', 'main', '--quiet']);
} catch {
  /* pas de remote / hors-ligne : on tente quand même le diff local */
}

let range;
try {
  const mergeBase = sh('git', ['merge-base', base, 'HEAD']);
  range = `${mergeBase}..HEAD`;
} catch {
  range = 'HEAD~1..HEAD';
  console.warn(`(base "${base}" introuvable — diff sur ${range})`);
}

const diff = sh('git', [
  'diff',
  '--unified=3',
  range,
  '--',
  'src/',
  'supabase/',
  'vercel.json',
  'e2e/',
]);
if (!diff) {
  console.log('Aucun changement de code à revoir.');
  process.exit(0);
}

const rules = existsSync('docs/ai/security-rules.md')
  ? readFileSync('docs/ai/security-rules.md', 'utf8')
  : '(docs/ai/security-rules.md absent)';

const GRILLE = `
SÉCURITÉ UNIQUEMENT. Ignore l'accessibilité, le style, les choix de librairie, les
opinions d'architecture — seulement des failles exploitables.

Passe le diff au crible de CHAQUE point ci-dessous. Pour chaque finding, produis une
ligne JSON : {"severity":"critical|high|medium|low","file":"…","line":N,"issue":"…","fix":"…"}

1. XSS — \`dangerouslySetInnerHTML\`, \`innerHTML\`, HTML rendu depuis une entrée
   (réponse IA, \`course.*\` admin) sans react-markdown / sanitizer.
2. Injection — SQL/PostgREST construit par concaténation ; injection de prompt non
   neutralisée ; \`eval\` / \`new Function\` / import dynamique d'une valeur.
3. Secrets — clé/token en dur ; secret derrière \`VITE_*\` (public) ; \`service_role\`.
4. SSRF — l'edge function \`gemini-proxy\` relaie-t-elle une URL/host fournis par
   l'appelant ? \`fetch()\` vers une URL non allowlistée.
5. Contrôle d'accès — logique d'autorisation dans le React au lieu de la RLS ;
   nouvelle route/table sans policy ; \`get_waitlist_counts\` qui exposerait un email.
6. CSRF — mutation d'état sur GET ; pas de vérif d'origine côté proxy.
7. Redirections / \`target="_blank"\` sans \`rel="noopener noreferrer"\`
   (utiliser la constante \`NOUVEL_ONGLET\`).
8. En-têtes / CSP — \`vercel.json\` : \`unsafe-eval\`/\`unsafe-inline\` ajoutés à
   \`script-src\`, \`connect-src\` élargi, directive retirée.
9. Validation d'entrée — donnée de \`<input>\` / URL / \`localStorage\` / réseau qui
   ne passe pas par \`src/lib/validation.js\` avant stockage/affichage/DOM.
10. Dépendance — nouveau paquet : mainteneur, popularité, script post-install ?

Si un point n'a AUCUN problème dans le diff, ne produis pas de ligne pour lui.
Termine par : PENTEST_VERDICT: PASS  (aucun critical/high) ou  FAIL: <résumé>.
`;

const out = `# Revue de sécurité — diff \`${range}\`

## Ta mission (Claude Code / LLM)

Tu es un pentester senior. Revois le diff ci-dessous.
${GRILLE}

Écris le résultat dans \`reports/pentest-review.md\`.

---

## Grille de référence du projet (docs/ai/security-rules.md)

${rules}

---

## Diff à auditer

\`\`\`diff
${diff}
\`\`\`
`;

writeFileSync('PENTEST_REVIEW.md', out, 'utf8');
console.log(`Écrit : PENTEST_REVIEW.md (${diff.split('\n').length} lignes de diff)`);
console.log('\nLance :  claude\npuis :  « Fais la revue de sécurité de PENTEST_REVIEW.md »');
