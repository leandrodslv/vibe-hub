import { defineConfig } from 'vitest/config';

// Config dédiée aux tests de simulation (V4) : injection de pannes seedée via
// MSW. Réutilise le setup unitaire (jsdom + MSW). Hors `npm test` — lancé par
// `npm run test:simulation`, en matrice de graines en CI + run nocturne étendu.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/test/simulation/**/*.sim.test.js'],
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 20_000,
  },
});
