import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync('./package.json', 'utf8')).version;
// Release = version package.json + court SHA si dispo (Vercel expose VERCEL_GIT_COMMIT_SHA).
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 7);
const RELEASE = sha ? `${version}+${sha}` : version;

// Build + test config partagent le même fichier : une seule source de vérité pour
// les alias, l'environnement et la résolution des modules.
export default defineConfig({
  plugins: [react()],

  // Corrélation observabilité (V10) : chaque log/erreur porte la release.
  define: { __APP_RELEASE__: JSON.stringify(RELEASE) },

  build: {
    // Repart d'un dossier propre à chaque build : sinon les anciens chunks
    // (hash différent) s'accumulent et faussent les mesures de budget bundle.
    emptyOutDir: true,
    // Sourcemaps de prod en mode « hidden » : les fichiers `.map` sont générés
    // (Sentry / symbolisation des stack traces — cf. src/lib/observability) mais
    // AUCUN commentaire `//# sourceMappingURL` n'est écrit dans le JS livré → un
    // visiteur (ou un scanner) ne les découvre pas automatiquement.
    // Vérifié par `npm run security:bundle` (pentest V6).
    // TODO(V10) : uploader les `.map` vers Sentry en CI puis les exclure du déploiement.
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        // Sépare les grosses dépendances tierces du code applicatif : un changement
        // de composant n'invalide plus le cache navigateur du vendor bundle.
        manualChunks: {
          react: ['react', 'react-dom'],
          markdown: ['react-markdown', 'remark-gfm'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    restoreMocks: true,
    clearMocks: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    // Les tests d'intégration (Postgres réel) ont leur propre config +
    // globalSetup : `npm run test:integration`. Voir vitest.integration.config.js.
    exclude: [
      'e2e/**',
      'node_modules/**',
      'dist/**',
      'src/test/integration/**',
      'src/test/simulation/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      // La barre à 80 % s'applique au périmètre déjà couvert (logique métier pure,
      // adaptateurs de services, hooks, helpers). On élargit `include` à mesure que
      // les composants sont testés — le seuil ne descend jamais (stratégie ratchet,
      // cf. docs/ai/testing-rules.md).
      include: [
        'src/lib/**/*.{js,jsx}',
        'src/services/**/*.{js,jsx}',
        'src/hooks/**/*.{js,jsx}',
        'src/config/**/*.{js,jsx}',
      ],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/test/**',
        'src/**/index.{js,jsx}',
        // `observability.js` est réintégré au périmètre depuis V10 (endpoint de
        // collecte + tests `observability.test.js`).
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
