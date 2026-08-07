/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  // Tenu ici plutôt que dans un .eslintignore : une seule source de vérité,
  // et le fichier voyage avec la config.
  ignorePatterns: [
    'dist',
    'node_modules',
    'public',
    'docs',
    '_bmad',
    '_bmad-output',
    '.eslintrc.cjs',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // Le projet ne se sert pas de PropTypes (validation à l'exécution).
    // L'activer imposerait de déclarer chaque prop de chaque composant sans
    // rien apporter — c'est le rôle de TypeScript si tu y passes un jour.
    'react/prop-types': 'off',

    // Le contenu est en français : les apostrophes sont partout.
    // Les échapper en &apos; nuirait plus à la lisibilité qu'autre chose.
    'react/no-unescaped-entities': 'off',
  },
  overrides: [
    {
      // Scripts de config et utilitaires exécutés par Node, pas par le navigateur
      files: ['*.config.js', 'test-gemini.js'],
      env: { node: true, browser: false },
    },
  ],
};
