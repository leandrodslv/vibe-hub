import { test, expect } from '@playwright/test';

test.describe('Workspace (/app)', () => {
  test('ouvre l’onglet Assistant IA par défaut', async ({ page }) => {
    await page.goto('/app');
    await expect(
      page.getByRole('navigation', { name: /navigation workspace/i }).first()
    ).toBeVisible();
    // L'onglet IA est actif par défaut.
    const iaTab = page.getByRole('button', { name: 'IA', exact: true }).first();
    await expect(iaTab).toHaveAttribute('aria-current', 'page');
  });

  test('changer d’onglet reflète l’onglet dans l’URL', async ({ page }) => {
    await page.goto('/app');
    await page.getByRole('button', { name: 'Outils', exact: true }).first().click();
    await expect(page).toHaveURL(/\/app\?tab=outils/);

    await page.getByRole('button', { name: 'Cours', exact: true }).first().click();
    await expect(page).toHaveURL(/\/app\?tab=modules/);
  });

  test('l’onglet demandé dans l’URL est respecté au chargement', async ({ page }) => {
    await page.goto('/app?tab=outils');
    await expect(page.getByRole('heading', { name: /Boîte à/i })).toBeVisible();
  });

  test('l’assistant IA répond ou dégrade proprement, sans page blanche', async ({ page }) => {
    await page.goto('/app');
    const input = page.getByPlaceholder(/posez une question|demandez un prompt/i);
    await input.fill('Bonjour');
    await input.press('Enter');

    // Selon que le proxy IA est configuré (dev) ou non (CI), on obtient soit une
    // vraie réponse, soit le message d'erreur explicite — jamais un crash.
    // `.first()` : le message d'erreur est lui-même rendu dans un bloc `.prose`
    // (react-markdown) → sans ça, `.or()` matche 2 nœuds et viole le mode strict.
    const configError = page.getByText(/proxy IA n.est pas configuré/i);
    const anyAssistantReply = page.locator('.prose').first();
    await expect(configError.or(anyAssistantReply).first()).toBeVisible({ timeout: 20_000 });

    // L'ErrorBoundary ne s'est pas déclenchée.
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('Admin (/admin)', () => {
  test('affiche l’écran de connexion pour un visiteur non authentifié', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
    await expect(page.getByText(/mot de passe/i)).toBeVisible();
  });
});
