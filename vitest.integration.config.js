import { defineConfig } from 'vitest/config';

// Config dédiée aux tests d'intégration (Postgres réel via Testcontainers).
// Séparée de la suite unitaire : environnement `node`, pas de jsdom, pas de
// couverture, timeouts longs, un seul conteneur partagé (globalSetup), fichiers
// exécutés en série pour ne pas se marcher dessus sur la même base.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/integration/**/*.test.js'],
    globalSetup: ['./src/test/integration/globalSetup.js'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000, // 1er `docker pull` éventuel
  },
});
