# Règles de sécurité — Vibe Hub

> Complément applicatif de `SECURITY.md` (politique) et `docs/secure-coding-guide.md` (guide).

## Menaces prioritaires (par ordre de gravité actuelle)

### 1. 🔴 Clé Gemini exposée dans le bundle — AD-1

`services/ai.js` appelle Gemini **depuis le navigateur** avec `VITE_GEMINI_API_KEY`. Vite
**inline** cette valeur dans le JS livré → **n'importe quel visiteur du site déployé peut
l'extraire** (devtools → onglet Sources) et consommer le quota / générer du coût.

**Historique** : une 1ʳᵉ clé a déjà fuité via `test-gemini.js` (commit `51f61c7`) et reste
dans l'historique git. La clé actuelle est d'un autre format mais **structurellement publique**.

**Correctif** :

1. **Révoquer** la clé actuelle sur Google AI Studio / console.cloud.google.com.
2. Déployer `supabase/functions/gemini-proxy` (fournie) : `supabase secrets set GEMINI_API_KEY=…`
   puis `supabase functions deploy gemini-proxy`.
3. Réécrire `services/ai.js` en un `fetch()` vers le proxy. Supprimer `VITE_GEMINI_API_KEY`.
4. En transition : clé à **quota strictement plafonné** + restriction par referrer HTTP.

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

| Règle                                                                            | Outil                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Pas d'`eval` / `new Function`                                                    | ESLint `no-restricted-syntax`, Semgrep `no-eval-family` |
| Pas de `dangerouslySetInnerHTML` sans sanitizer + justification                  | Semgrep `no-dangerously-set-inner-html`                 |
| `<iframe>` de contenu non maîtrisé → `sandbox` (AD-5)                            | Semgrep `iframe-without-sandbox`                        |
| Lien `target="_blank"` → `rel="noopener noreferrer"` (constante `NOUVEL_ONGLET`) | Semgrep + `jsx-a11y`                                    |
| Import SDK externe hors `services/` (AD-2)                                       | ESLint `no-restricted-imports`, Semgrep                 |
| Secret derrière `VITE_*`                                                         | Semgrep `secret-behind-vite-prefix`                     |
| Clé API en dur                                                                   | Semgrep `hardcoded-google-api-key`, gitleaks            |
| `JSON.parse` sans try/catch                                                      | Semgrep `json-parse-without-try-catch` (info)           |

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
