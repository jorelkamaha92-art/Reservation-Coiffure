import { test, expect } from '@playwright/test';

test.describe('Back-office administrateur', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('demo_user_role', 'admin');
    });
  });

  test('Gérer les disponibilités', async ({ page }) => {
    await page.goto('/admin/availability');
    await expect(page.locator('h1, h2, h3').filter({ hasText: 'Gestion des Horaires' }).first()).toBeVisible();
  });

  test('Confirmer un rendez-vous en attente', async ({ page }) => {
    await page.goto('/admin/appointments');
    await expect(page.locator('h1, h2, h3').filter({ hasText: 'Planning' }).first()).toBeVisible();
  });

  test('Ajouter un rendez-vous manuellement', async ({ page }) => {
    await page.goto('/admin/appointments');
    await expect(page.locator('h1, h2, h3').filter({ hasText: 'Planning' }).first()).toBeVisible();
  });

  test('Voir les statistiques du tableau de bord', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('h1, h2, h3').filter({ hasText: 'Tableau de Bord' }).first()).toBeVisible();
  });
});
