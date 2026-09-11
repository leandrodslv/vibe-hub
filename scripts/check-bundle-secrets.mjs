#!/usr/bin/env node
// @ts-check
/**
 * Pentest — analyse statique du bundle livré (V6 de docs/ai/roadmap-automatisation.md).
 *
 * « Si le pentest de Claude ne détecte pas un truc, celui du voisin ne rentrera
 * pas non plus. » — ici on attrape ce qu'un attaquant verrait en premier :
 *  - un secret inliné dans le JS (clé API, JWT, clé privée) — AD-1 / AD-2 ;
 *  - une source map servie publiquement (divulgation du code source) ;
 *  - la clé `service_role` Supabase (jamais côté client).
 *
 *   npm run security:bundle        (après `npm run build`)
 *
 * Sortie : exit 1 + liste des findings. Faux positifs → `.security/allowlist.yml`.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

/**
 * Valeurs présentes dans les fichiers `.env*` LOCAUX (non commités). Un secret du
 * bundle qui vient de là = « ton .env dev inliné » → averti, pas bloquant (CI
 * n'a pas de .env → tout secret y est bloquant). Un secret ABSENT de .env =
 * codé en dur dans les sources → toujours bloquant.
 */
function localEnvValues() {
  const vals = new Set();
  for (const name of ['.env', '.env.local', '.env.development.local', '.env.production.local']) {
    if (!existsSync(name)) continue;
    for (const line of readFileSync(name, 'utf8').split('\n')) {
      const v = line
        .split('=')
        .slice(1)
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
      if (v.length >= 12) vals.add(v);
    }
  }
  return [...vals];
}
const ENV_VALUES = localEnvValues();
const fromLocalEnv = (match) =>
  ENV_VALUES.some((v) => v.includes(match) || match.includes(v.slice(0, 24)));

/** Motifs de secrets. `severity: high` fait échouer, `warn` informe. */
const PATTERNS = [
  { id: 'google-api-key', re: /AIza[0-9A-Za-z_-]{35}/g, severity: 'high' },
  { id: 'google-oauth-token', re: /ya29\.[0-9A-Za-z_-]{20,}/g, severity: 'high' },
  { id: 'gemini-key-aq', re: /\bAQ\.[A-Za-z0-9_-]{30,}/g, severity: 'high' },
  { id: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/g, severity: 'high' },
  {
    id: 'private-key-block',
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'high',
  },
  { id: 'supabase-service-role', re: /"?role"?\s*:\s*"?service_role/g, severity: 'high' },
  {
    id: 'generic-secret-assign',
    re: /(?:api[_-]?key|secret|password|token)["'`\s]*[:=]["'`\s]*[A-Za-z0-9_\-]{24,}/gi,
    severity: 'warn',
  },
];

/** Un JWT. On décode la charge utile : `role: anon` est public par conception
 * (clé anon Supabase, cf. docs/ai/security-rules.md §3), `role: service_role`
 * est une fuite critique, tout autre JWT est suspect. */
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;

/** @param {string} b64url */
function decodeJwtRole(b64url) {
  try {
    const json = Buffer.from(b64url.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf8'
    );
    return JSON.parse(json).role ?? null;
  } catch {
    return null;
  }
}

/** Charge l'allowlist (findings justifiés). */
function loadAllowlist() {
  const path = join('.security', 'allowlist.yml');
  if (!existsSync(path)) return [];
  // Mini-parseur : lignes `- pattern: <id>` / `  match: <substr>` (pas de dep YAML).
  const entries = [];
  let cur = null;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.replace(/#.*$/, '').trimEnd();
    if (/^\s*-\s+pattern:/.test(line)) {
      cur = { pattern: line.split('pattern:')[1].trim(), match: '' };
      entries.push(cur);
    } else if (cur && /^\s+match:/.test(line)) {
      cur.match = line
        .split('match:')[1]
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
  return entries;
}

function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error(`\`${DIST}/\` absent. Lance d'abord \`npm run build\`.`);
  process.exit(1);
}

const allowlist = loadAllowlist();
const isAllowed = (patternId, snippet) =>
  allowlist.some((e) => e.pattern === patternId && snippet.includes(e.match));

const files = walk(DIST);
/** @type {{severity: string, file: string, pattern: string, snippet: string}[]} */
const findings = [];

// 1. Source maps DÉCOUVRABLES : un `.js` livré qui référence son `.map` via
//    `//# sourceMappingURL` (avec `sourcemap: 'hidden'` il n'y en a plus).
for (const f of files) {
  if (!f.endsWith('.js')) continue;
  const m = readFileSync(f, 'utf8').match(/\/\/# sourceMappingURL=(\S+)/);
  if (m && !isAllowed('sourcemap', f)) {
    findings.push({
      severity: 'warn',
      file: f,
      pattern: 'sourcemap-referenced',
      snippet: `référence ${m[1]} → code source récupérable (utiliser sourcemap: 'hidden')`,
    });
  }
}

// 2. Secrets dans le texte
for (const f of files) {
  if (!/\.(js|css|html|json|txt)$/.test(f)) continue;
  const content = readFileSync(f, 'utf8');

  for (const { id, re, severity } of PATTERNS) {
    for (const m of content.matchAll(re)) {
      if (isAllowed(id, m[0])) continue;
      const local = fromLocalEnv(m[0]);
      findings.push({
        severity: local ? 'warn' : severity,
        file: f,
        pattern: id,
        snippet:
          m[0].slice(0, 12) +
          '…' +
          (local ? ' (vient de ton .env local — AD-1 : ne déploie jamais avec)' : ''),
      });
    }
  }

  // JWT : verdict selon le rôle décodé.
  for (const m of content.matchAll(JWT_RE)) {
    const role = decodeJwtRole(m[1]);
    if (role === 'anon') continue; // clé anon Supabase — publique par conception
    findings.push({
      severity: role === 'service_role' ? 'high' : 'warn',
      file: f,
      pattern: role === 'service_role' ? 'supabase-service-role-jwt' : 'unknown-jwt',
      snippet: `JWT role=${role ?? 'inconnu'} — ${m[0].slice(0, 16)}…`,
    });
  }
}

const high = findings.filter((f) => f.severity === 'high');
const warn = findings.filter((f) => f.severity === 'warn');

if (findings.length === 0) {
  console.log('✅ Bundle : aucun secret ni source map exposés.');
  process.exit(0);
}

for (const f of [...high, ...warn]) {
  const icon = f.severity === 'high' ? '❌' : '⚠️ ';
  console.log(`${icon} [${f.pattern}] ${f.file}\n   ${f.snippet}`);
}

if (high.length > 0) {
  console.error(
    `\n${high.length} finding(s) bloquant(s). Justifier dans .security/allowlist.yml ou corriger.`
  );
  process.exit(1);
}
console.log(`\n${warn.length} avertissement(s) non bloquant(s).`);
