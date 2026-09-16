import { test, expect } from '@playwright/test';

/**
 * KDS smoke — F2d redesign.
 * Auth-gated routes may redirect to login without a staff session;
 * assertions tolerate either the board chrome or the login redirect.
 */
test.describe('Kitchen Display Page (F2d)', () => {
  test('should load kitchen route without crash', async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    // No React ErrorBoundary crash
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test('should show KDS board chrome after staff path or redirect cleanly', async ({ page }) => {
    await page.goto('/kitchen/DOM001');
    await page.waitForLoadState('networkidle');

    const kdsRoot = page.getByTestId('kds-root');
    const loginHint = page.getByText(/staff login|sign in|log in/i).first();

    const onKds = await kdsRoot.isVisible().catch(() => false);
    if (onKds) {
      await expect(page.getByTestId('kds-summary')).toBeVisible();
      await expect(page.getByText('New Orders')).toBeVisible();
      await expect(page.getByText('Preparing')).toBeVisible();
      await expect(page.getByText('In Oven')).toBeVisible();
      await expect(page.getByText('Ready')).toBeVisible();
      await expect(page.getByTestId('kds-connection')).toBeVisible();
    } else {
      // Unauthenticated: must not blank-crash
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(loginHint.or(page.locator('input[type="password"]'))).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test('should expose cook-path columns when board is mounted', async ({ page }) => {
    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');
    if (!(await page.getByTestId('kds-root').isVisible().catch(() => false))) {
      test.skip(true, 'Requires kitchen staff session');
      return;
    }
    await expect(page.getByTestId('kds-column-RECEIVED')).toBeVisible();
    await expect(page.getByTestId('kds-column-PREPARING')).toBeVisible();
    await expect(page.getByTestId('kds-column-OVEN')).toBeVisible();
    await expect(page.getByTestId('kds-column-BAKED')).toBeVisible();
    await expect(page.getByTestId('kds-column-READY')).toBeVisible();
  });
});
