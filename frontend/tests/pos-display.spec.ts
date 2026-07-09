import { test, expect } from '@playwright/test';

/**
 * POS smoke — F2e redesign (Toast/Square-class cashier board).
 * Auth-gated routes may redirect to login without a staff session;
 * assertions tolerate either the board chrome or the login redirect.
 */
test.describe('POS Display (F2e)', () => {
  test('should load /pos without crash', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test('should show POS board chrome after staff path or redirect cleanly', async ({
    page,
  }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');

    const posRoot = page.getByTestId('pos-root');
    const loginHint = page.getByText(/staff login|sign in|log in/i).first();

    const onPos = await posRoot.isVisible().catch(() => false);
    if (onPos) {
      await expect(page.getByTestId('pos-header')).toBeVisible();
      await expect(page.getByTestId('pos-tab-bar')).toBeVisible();
      await expect(page.getByTestId('pos-orders-board')).toBeVisible();
      await expect(page.getByTestId('pos-menu-column')).toBeVisible();
      await expect(page.getByTestId('pos-cart-column')).toBeVisible();
      await expect(page.getByTestId('pos-pay-column')).toBeVisible();
      // EU methods only — no UPI on DE demo board
      await expect(page.getByRole('button', { name: /^UPI$/i })).toHaveCount(0);
    } else {
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(loginHint.or(page.locator('input[type="password"]'))).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test('should expose history and reports tabs when board is mounted', async ({
    page,
  }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    if (!(await page.getByTestId('pos-root').isVisible().catch(() => false))) {
      test.skip(true, 'Requires cashier/staff session');
      return;
    }
    await expect(page.getByTestId('pos-tab-history')).toBeVisible();
    await expect(page.getByTestId('pos-tab-reports')).toBeVisible();
    await page.getByTestId('pos-tab-history').click();
    await expect(page.getByTestId('pos-history-panel')).toBeVisible();
    await page.getByTestId('pos-tab-reports').click();
    await expect(page.getByTestId('pos-reports-panel')).toBeVisible();
  });
});
