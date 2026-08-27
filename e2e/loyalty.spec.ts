import { test, expect } from '@playwright/test';

test.describe('Programme de fidélité', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('demo_user_role', 'client');
    });
  });

  test('Voir et échanger des points', async ({ page }) => {
    await page.goto('/dashboard/loyalty');
    await expect(page.locator('h1, h2, h3, div').filter({ hasText: 'Vos Points de Récompense' }).first()).toBeVisible();
  });
});
