# Guide de codage sécurisé — Vibe Hub

Guide pratique, orienté « quoi faire / quoi éviter ». La politique est dans `SECURITY.md`,
les règles applicatives dans `docs/ai/security-rules.md`.

## 1. Secrets & configuration

✅ **À faire**

- Lire l'env uniquement via `src/config/env.js`.
- Mettre les vrais secrets côté serveur (Edge Function `supabase secrets set`, GitHub Actions
  secrets).
- Documenter chaque nouvelle variable dans `.env.example`.

❌ **À éviter**

- `import.meta.env.VITE_MON_SECRET` — inliné dans le bundle, public.
- Une clé en dur, même « temporaire », même dans un script (`test-*.js`).
- Committer `.env`.

## 2. XSS / injection HTML

✅

- Laisser React échapper le texte (JSX `{value}`).
- Markdown IA → `react-markdown` (échappe par défaut, ne pas activer `rehype-raw`).
- Besoin réel de HTML → `DOMPurify.sanitize()` + commentaire justifiant + `// nosemgrep`.

❌

- `dangerouslySetInnerHTML` sans sanitizer.
- `element.innerHTML = userInput`.
- `eval`, `new Function`, `setTimeout("code string")`.

## 3. URLs & iframes (SSRF / clickjacking / XSS)

✅

- Valider toute URL affichée dans un `href`/`src` avec `isSafeHttpUrl`.
- `<iframe src>` construit depuis une donnée : **liste blanche d'hôtes** (`isAllowedVideoUrl`)
  - `sandbox` si le contenu n'est pas de confiance (AD-5).
- Liens externes : `rel="noopener noreferrer"` (constante `NOUVEL_ONGLET`).

❌

- Interpoler `course.video_url` directement dans `src` sans vérifier l'hôte.
- Un `<iframe>` sans `sandbox` pour du contenu généré / utilisateur.

## 4. Accès aux données (autorisation)

✅

- Considérer que **le client ment**. La vraie autorisation = RLS Postgres (AD-3).
- Passer par `src/services/supabase.js` ; laisser les fonctions **lever** en cas d'erreur.
- Lire la demande waitlist via `get_waitlist_counts()` (agrégat), jamais les lignes.

❌

- Se reposer sur `if (session)` dans un composant pour « protéger » une écriture.
- Ajouter une policy `SELECT` sur `waitlist` pour « finir » une feature.
- Exposer la clé `service_role`.

## 5. Entrées utilisateur

✅

- `isValidEmail`, `sanitizeText`, `safeJsonParse` (`src/lib/validation.js`) systématiquement
  sur ce qui vient d'un input, d'une URL, du `localStorage` ou du réseau.
- Borner les tailles (longueur de texte, taille d'image uploadée en base64).

❌

- `JSON.parse(localStorage.getItem(...))` nu.
- Faire confiance à un champ `role`/`isAdmin` venant du client.

## 6. Dépendances

✅

- `npm ci` (respecte le lock), Dependabot activé, merger vite les PR `security-patches`.
- Vérifier `npm run security:audit` avant un gros ajout de dépendance.
- Préférer 0 dépendance quand c'est 20 lignes (cf. `logger.js`).

❌

- `npm install` en CI, lockfile non commité.
- Ajouter une lib non maintenue (cf. Spine § Deferred sur Sandpack/react-live).

## 7. Logs

✅

- `logger.info/warn/error` (JSON structuré, caviarde les clés sensibles).
- Logger les erreurs de service avec `serializeError(e)`.

❌

- `console.log(user)` (peut contenir un email / token).
- Logger une réponse d'API brute sans filtrer.

## 8. Avant de merger — checklist sécurité

- [ ] `npm run lint` + `npm run security:semgrep` verts.
- [ ] Aucune nouvelle variable `VITE_*` sensible.
- [ ] Toute URL affichée est validée.
- [ ] Tout nouvel `<iframe>` a une raison claire + `sandbox` ou liste blanche.
- [ ] Les nouvelles écritures DB sont couvertes par une policy RLS (pas seulement l'UI).
- [ ] `.env.example` à jour.
