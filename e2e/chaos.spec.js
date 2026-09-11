import { test, expect } from '@playwright/test';

// Chaos réseau (V4) : on coupe / casse les dépendances externes et on vérifie
// que le front DÉGRADE proprement — jamais de page blanche, jamais l'ErrorBoundary
// (`role="alert"`), l'interface reste navigable.

test.describe('Chaos réseau — dégradation gracieuse', () => {
  test('API cours injoignable → message d’erreur, pas de page blanche', async ({ page }) => {
    await page.route('**/rest/v1/courses*', (route) => route.abort('failed'));

    await page.goto('/app?tab=modules');

    await expect(page.getByText(/erreur de chargement/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/impossible de charger les cours/i)).toBeVisible();

    // L'ErrorBoundary ne s'est pas déclenchée et la nav reste là.
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: /navigation workspace/i }).first()
    ).toBeVisible();
  });

  test('API cours en erreur 500 → même dégradation', async ({ page }) => {
    await page.route('**/rest/v1/courses*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' })
    );

    await page.goto('/app?tab=modules');

    await expect(page.getByText(/impossible de charger les cours/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('Gemini en panne → l’assistant répond une erreur lisible, sans crash', async ({ page }) => {
    await page.route('**/generativelanguage.googleapis.com/**', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"error":{"code":503}}',
      })
    );

    await page.goto('/app');
    const input = page.getByPlaceholder(/posez une question|demandez un prompt/i);
    await input.fill('Bonjour');
    await input.press('Enter');

    // Soit le message "clé non configurée" (CI sans clé), soit un message d'erreur
    // de communication — jamais un crash.
    const graceful = page.getByText(
      /clé API Gemini n.est pas configurée|une erreur s.est produite|surchargé/i
    );
    await expect(graceful).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
