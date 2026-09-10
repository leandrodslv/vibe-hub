import { test, expect } from '@playwright/test';

test.describe('Landing page (/)', () => {
  test('se charge avec un titre et un lien d’évitement', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vibe Hub/i);

    // RGAA : lien d'évitement présent (peut être visuellement masqué jusqu'au focus).
    const skip = page.getByRole('link', { name: /aller au contenu|contenu principal|skip/i });
    await expect(skip.first()).toBeAttached();
  });

  test('le CTA principal pointe vers /app dans un nouvel onglet sécurisé', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /découvrir vibe hub/i }).first();
    await expect(cta).toHaveAttribute('href', /\/app/);
    await expect(cta).toHaveAttribute('target', '_blank');
    await expect(cta).toHaveAttribute('rel', /noopener/);
  });

  test('un seul h1 sur la page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
  });
});

test.describe('Routage', () => {
  test('une URL inconnue rend la page 404 (pas de crash)', async ({ page }) => {
    await page.goto('/cette-route-nexiste-pas');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/perdu|404/i);
    await expect(page.getByRole('link', { name: /retour à l.accueil/i })).toBeVisible();
  });
});
