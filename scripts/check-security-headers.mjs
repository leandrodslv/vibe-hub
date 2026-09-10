#!/usr/bin/env node
// @ts-check
/**
 * Pentest — vérifie que les en-têtes de sécurité de production (`vercel.json`)
 * sont présents ET forts (V6). Un `vite preview` ne les applique pas : c'est la
 * config d'hébergement qu'on audite, pas un serveur local.
 *
 *   npm run security:headers
 *
 * Attrape : un `unsafe-eval` glissé dans la CSP par une IA, une directive
 * supprimée, un `X-Frame-Options` affaibli, un `connect-src` élargi sans revue.
 */

import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync('vercel.json', 'utf8'));
const rule = (cfg.headers ?? []).find((h) => h.source === '/(.*)');
const headers = Object.fromEntries(
  (rule?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value])
);

/** @type {string[]} */
const fail = [];
const need = (name, test, msg) => {
  if (!test(headers[name] ?? '')) fail.push(`${name}: ${msg}`);
};

need('content-security-policy', (v) => v.length > 0, 'CSP absente');
const csp = headers['content-security-policy'] ?? '';
if (csp) {
  if (/script-src[^;]*'unsafe-eval'/.test(csp)) fail.push("CSP: script-src contient 'unsafe-eval'");
  if (/script-src[^;]*'unsafe-inline'/.test(csp))
    fail.push("CSP: script-src contient 'unsafe-inline'");
  for (const d of ["object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) {
    if (!csp.includes(d)) fail.push(`CSP: directive manquante « ${d} »`);
  }
  if (!/default-src 'self'|default-src 'none'/.test(csp))
    fail.push("CSP: default-src doit être 'self' ou 'none'");
}

need('x-content-type-options', (v) => v === 'nosniff', "doit valoir 'nosniff'");
need('x-frame-options', (v) => /^DENY$|^SAMEORIGIN$/.test(v), "doit valoir 'DENY' ou 'SAMEORIGIN'");
need('referrer-policy', (v) => v.length > 0, 'absent');
need(
  'strict-transport-security',
  (v) => /max-age=\d{7,}/.test(v),
  'HSTS absent ou max-age trop court'
);
need('permissions-policy', (v) => v.length > 0, 'absent');

if (fail.length === 0) {
  console.log('✅ En-têtes de sécurité (vercel.json) : conformes.');
  process.exit(0);
}
console.error('❌ En-têtes de sécurité :');
for (const f of fail) console.error(`   - ${f}`);
process.exit(1);
