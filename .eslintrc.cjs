/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    // Accessibilité : le projet vise la conformité RGAA (cf. docs/diagnostic-rgaa.md).
    // jsx-a11y attrape statiquement les régressions (label manquant, rôle invalide,
    // handler clavier absent…) avant la revue humaine.
    'plugin:jsx-a11y/recommended',
    // DOIT rester en dernier : désactive les règles de style qui entrent en conflit
    // avec Prettier (le formatage est délégué à Prettier, pas à ESLint).
    'prettier',
  ],
  // Tenu ici plutôt que dans un .eslintignore : une seule source de vérité,
  // et le fichier voyage avec la config.
  ignorePatterns: [
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'node_modules',
    'public',
    'docs',
    '_bmad',
    '_bmad-output',
    '.eslintrc.cjs',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  // Constante injectée à la compilation par Vite (`define`, cf. vite.config.js).
  globals: { __APP_RELEASE__: 'readonly' },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh', 'jsx-a11y'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // Le projet ne se sert pas de PropTypes (validation à l'exécution).
    // C'est le rôle de TypeScript (adoption incrémentale via `// @ts-check`).
    'react/prop-types': 'off',

    // Le contenu est en français : les apostrophes sont partout.
    'react/no-unescaped-entities': 'off',

    // jsx-a11y : le gros du jeu de règles est actif. Ces 4 règles-ci flaguent des
    // patterns hérités (labels stylés non liés, overlays cliquables) déjà suivis
    // dans le plan d'action RGAA (docs/diagnostic-rgaa.md). Remises en `warn` puis
    // `error` au fil des corrections — ne pas les réactiver sans traiter les cas.
    // TODO(a11y): réactiver progressivement.
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/media-has-caption': 'off',

    // Garde-fous anti-erreurs générées par IA (feedback statique immédiat) :
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    eqeqeq: ['error', 'smart'],
    'no-implicit-coercion': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-restricted-syntax': [
      'error',
      {
        // AD-1 / AD-5 (Architecture Spine) : jamais d'exécution de code arbitraire.
        selector: "CallExpression[callee.name='eval']",
        message: 'eval() est interdit (risque XSS/injection). Cf. docs/ai/security-rules.md.',
      },
      {
        selector: "NewExpression[callee.name='Function']",
        message: 'new Function() est interdit (équivalent eval). Cf. docs/ai/security-rules.md.',
      },
    ],
  },
  overrides: [
    {
      // AD-1 : aucun SDK Gemini dans `src/` — même `services/ai.js` fait un
      // `fetch()` vers l'Edge Function. Le SDK `@google/genai` ne vit QUE dans
      // supabase/functions/gemini-proxy (Deno). Cet override est REMPLACÉ (pas
      // fusionné) par le suivant pour components/pages — d'où la répétition là-bas.
      files: ['src/**/*.{js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@google/generative-ai',
                message: 'AD-1 : SDK Gemini retiré du client. ai.js fetch() le proxy gemini-proxy.',
              },
              {
                name: '@google/genai',
                message:
                  'AD-1 : le SDK Gemini ne vit que dans supabase/functions/gemini-proxy (Deno), jamais dans src/.',
              },
            ],
          },
        ],
      },
    },
    {
      // Adaptateurs de services : seule couche autorisée à importer un SDK externe
      // (Architecture Spine AD-2). Interdit l'import direct depuis les composants.
      files: ['src/components/**/*.{js,jsx}', 'src/pages/**/*.{js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@supabase/supabase-js',
                message:
                  'AD-2 : seuls les fichiers src/services/* importent un SDK externe. Utilise src/services/supabase.js.',
              },
              {
                name: '@google/generative-ai',
                message:
                  'AD-1/AD-2 : les appels Gemini passent par src/services/ai.js (qui fetch() le proxy gemini-proxy).',
              },
              {
                name: '@google/genai',
                message:
                  'AD-1/AD-2 : les appels Gemini passent par src/services/ai.js (qui fetch() le proxy gemini-proxy).',
              },
            ],
          },
        ],
      },
    },
    {
      // Scripts de config et utilitaires exécutés par Node, pas par le navigateur.
      files: ['*.config.js', '*.config.cjs', 'scripts/**/*.js', '.lighthouserc.cjs'],
      env: { node: true, browser: false },
    },
    {
      // Scénarios k6 : runtime goja, pas Node. Globals k6 + imports `k6/*`.
      files: ['scripts/perf/**/*.js'],
      env: { node: false, browser: false },
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Tests (unitaires, intégration, simulation) : Vitest tourne sous Node,
      // avec jsdom pour la suite unitaire → browser + node.
      files: ['src/**/*.{test,spec}.{js,jsx}', 'src/test/**/*.{js,jsx}'],
      env: { browser: true, node: true },
      globals: {
        vi: 'readonly',
        vitest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Tests end-to-end : environnement Node + Playwright.
      files: ['e2e/**/*.{js,ts}', 'playwright.config.js'],
      env: { node: true, browser: false },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
