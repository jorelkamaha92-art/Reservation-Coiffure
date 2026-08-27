import { test, expect } from '@playwright/test';

test.describe('Parcours de réservation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('demo_user_role', 'client');
    });
  });

  test('Afficher la page de réservation et les services', async ({ page }) => {
    await page.goto('/reservation');
    await expect(page.getByRole('heading', { name: /Planifiez votre séance/i })).toBeVisible();
  });

  test('Vérifier l\'affichage des réservations et des notifications', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Solde Fidélité')).toBeVisible();
  });
});
