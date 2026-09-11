# Règles de sécurité — Vibe Hub

> Complément applicatif de `SECURITY.md` (politique) et `docs/secure-coding-guide.md` (guide).

## Menaces prioritaires (par ordre de gravité actuelle)

### 1. 🟠 Clé Gemini — AD-1 (résolu côté code, déploiement à finaliser)

**Côté code : réglé.** `services/ai.js` ne fait plus qu'un `fetch()` vers l'Edge Function
`gemini-proxy`, qui détient la clé côté serveur (`GEMINI_API_KEY`, jamais `VITE_`). Plus
aucun SDK Gemini ni clé dans le bundle ; `security:bundle` (V6) le vérifie. Le seul
paramètre client est `VITE_GEMINI_PROXY_URL`, publique par conception.

**Reste à faire (déploiement)** :

1. **Révoquer** l'ancienne clé `VITE_GEMINI_API_KEY` sur Google AI Studio /
   console.cloud.google.com — elle a été inlinée dans tous les builds locaux passés
   (et une 1ʳᵉ clé a fuité via `test-gemini.js`, commit `51f61c7`, toujours dans l'historique git).
2. `supabase secrets set GEMINI_API_KEY=<nouvelle clé serveur>` + `ALLOWED_ORIGINS=<domaine prod>,http://localhost:5173`.
3. `supabase functions deploy gemini-proxy --no-verify-jwt`.
4. Configurer `VITE_GEMINI_PROXY_URL` côté Vercel (Preview + Production) et en local (`.env`).
5. Différé (dans le proxy, cf. Spine) : rate limiting / plafond de coût, quota par IP.

### 2. 🟠 RLS Supabase non vérifiée — AD-3 / AD-4

Aucune migration n'existait dans le repo → les politiques réelles du projet Supabase sont
inconnues. `supabase/migrations/0001_rls_policies.sql` décrit **l'état cible** :

- `courses` : `SELECT` public seulement si `published = true` ; CRUD réservé à `authenticated`.
- `waitlist` : `INSERT` public, **aucun `SELECT`** (même pour l'admin).
- Décompte admin via `get_waitlist_counts()` (`SECURITY DEFINER`, ne renvoie QUE l'agrégat).

**Action** : auditer les policies live (`supabase db dump --data=false`), puis appliquer.
Le contrôle de session dans `AdminPage.jsx` est **UX only**, jamais la frontière.

### 3. 🟠 Clé anon Supabase = publique par conception

`VITE_SUPABASE_ANON_KEY` **doit** être dans le bundle (c'est son rôle). La sécurité repose
**entièrement** sur la RLS (point 2). Ne jamais mettre la clé `service_role` côté client
(gitleaks a une règle dédiée).

## Règles de codage sécurité (vérifiées automatiquement)

| Règle                                                                            | Outil                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Pas d'`eval` / `new Function`                                                    | ESLint `no-restricted-syntax`, Semgrep `no-eval-family`                         |
| Pas de `dangerouslySetInnerHTML` sans sanitizer + justification                  | Semgrep `no-dangerously-set-inner-html`                                         |
| `<iframe>` de contenu non maîtrisé → `sandbox` (AD-5)                            | Semgrep `iframe-without-sandbox`                                                |
| Lien `target="_blank"` → `rel="noopener noreferrer"` (constante `NOUVEL_ONGLET`) | Semgrep + `jsx-a11y`                                                            |
| Import SDK externe hors `services/` (AD-2)                                       | ESLint `no-restricted-imports`, Semgrep                                         |
| Secret derrière `VITE_*`                                                         | Semgrep `secret-behind-vite-prefix`                                             |
| Clé API en dur                                                                   | Semgrep `hardcoded-google-api-key`, gitleaks                                    |
| `JSON.parse` sans try/catch                                                      | Semgrep `json-parse-without-try-catch` (info)                                   |
| Secret / JWT `service_role` / source map dans le bundle livré                    | `npm run security:bundle` (job `build`, V6)                                     |
| En-têtes de prod affaiblis (CSP `unsafe-*`, directive retirée, HSTS…)            | `npm run security:headers` (job `build`, V6)                                    |
| OWASP Top 10 (patterns)                                                          | Semgrep `p/owasp-top-ten` (job `semgrep`, V6)                                   |
| Revue de sécurité du diff par un LLM                                             | `npm run pentest:review` (Claude, local) · `pentest:llm` (Gemini, CI si secret) |

## Validation des entrées

Tout ce qui vient d'un `<input>`, d'une URL, du `localStorage` ou du réseau passe par
`src/lib/validation.js` :

- `isValidEmail` — waitlist, login.
- `isSafeHttpUrl` — refuse `javascript:`, `data:`, `vbscript:`.
- `isAllowedVideoUrl` — **liste blanche** d'hôtes (YouTube, SharePoint/Stream) avant tout
  `<iframe src>` construit à partir de `course.video_url` (donnée admin non fiable) — cf.
  `CourseDetail.jsx`.
- `sanitizeText` — retire les caractères de contrôle, borne la longueur.
- `safeJsonParse` — ne lève jamais.

## En-têtes HTTP (production, `vercel.json`)

`Content-Security-Policy` stricte (`script-src 'self'`, `frame-ancestors 'none'`,
`object-src 'none'`, `connect-src` limité à Supabase + Gemini), `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `HSTS`.
Tester après tout changement d'origine externe (nouveau CDN, nouvel embed).

## OWASP Top 10 — statut

| Risque                        | Exposition Vibe Hub                        | Mitigation                                                       |
| ----------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| A01 Broken Access Control     | admin CRUD, waitlist                       | RLS (AD-3) — **à appliquer**                                     |
| A02 Cryptographic Failures    | clé Gemini                                 | proxy (AD-1) — **à faire**                                       |
| A03 Injection                 | XSS via markdown IA / embeds / code généré | react-markdown (échappe), liste blanche URL, CSP, sandbox (AD-5) |
| A04 Insecure Design           | —                                          | Architecture Spine (invariants explicites)                       |
| A05 Security Misconfiguration | en-têtes, `.env`                           | `vercel.json` headers, `.env.example`, gitleaks                  |
| A06 Vulnerable Components     | deps npm                                   | Dependabot + `npm audit` en CI                                   |
| A07 Auth Failures             | login admin                                | Supabase Auth (bcrypt, rate-limit géré)                          |
| A08 Integrity Failures        | supply chain                               | `package-lock.json` commité, `npm ci`, Dependabot groupé         |
| A09 Logging Failures          | —                                          | `logger.js` structuré + `observability.js`                       |
| A10 SSRF                      | embeds vidéo, (futur) proxy                | liste blanche d'hôtes ; le proxy ne relaie pas d'URL arbitraire  |

## Divulgation

Voir `SECURITY.md`. Ne jamais ouvrir d'issue publique pour une faille.
