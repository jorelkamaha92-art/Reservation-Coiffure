import { test, expect } from '@playwright/test';

test.describe('En-têtes de sécurité', () => {
  test('CSP est configuré', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
  });

  test('HSTS est activé', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['strict-transport-security']).toContain('max-age=');
  });

  test('X-Frame-Options est configuré', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    expect(headers['x-frame-options']).toBe('DENY');
  });
});
