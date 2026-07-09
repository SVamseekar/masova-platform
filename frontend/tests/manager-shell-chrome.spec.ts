import { test, expect, type Page } from '@playwright/test';

/**
 * F2b: unified manager tab chrome + analytics redirect (K9).
 * Requires Dell gateway + seed (manager.berlin / Demo@1234).
 */

const DEMO = {
  email: 'manager.berlin@gmail.com',
  password: 'Demo@1234',
} as const;

async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole('button', { name: /accept|allow all|got it|agree/i }).first();
  if (await accept.isVisible({ timeout: 2000 }).catch(() => false)) {
    await accept.click().catch(() => undefined);
  }
}

async function managerLogin(page: Page) {
  await page.goto('/staff-login');
  await dismissCookieBanner(page);
  await page.getByPlaceholder(/work email|email/i).or(page.locator('input[type="email"]')).first().fill(DEMO.email);
  await page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first().fill(DEMO.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/manager/, { timeout: 25000 });
  await dismissCookieBanner(page);
}

async function assertNoErrorBoundary(page: Page) {
  await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  await expect(page.getByText(/ErrorBoundary/i)).toHaveCount(0);
  await expect(page.getByText(/Minified React error/i)).toHaveCount(0);
}

test.describe('Manager shell chrome F2b [NEEDS BACKEND]', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await managerLogin(page);
  });

  const tabbedSections: { id: string; firstTab: string; tabs: string[] }[] = [
    { id: 'orders', firstTab: 'orders', tabs: ['orders', 'payments', 'refunds'] },
    { id: 'inventory', firstTab: 'stock', tabs: ['stock', 'suppliers', 'purchase-orders', 'waste'] },
    { id: 'operations', firstTab: 'recipes', tabs: ['recipes', 'drivers', 'stores', 'kiosks'] },
    { id: 'people', firstTab: 'staff', tabs: ['staff', 'scheduling', 'customers'] },
    { id: 'analytics', firstTab: 'kitchen', tabs: ['kitchen', 'products', 'reports', 'equipment'] },
  ];

  for (const section of tabbedSections) {
    test(`section ${section.id}: frame + shared tab bar`, async ({ page }) => {
      await page.goto(`/manager?section=${section.id}&tab=${section.firstTab}`);
      await page.waitForLoadState('domcontentloaded');
      await dismissCookieBanner(page);
      await assertNoErrorBoundary(page);

      await expect(page.getByTestId('manager-page-frame')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('manager-tab-bar')).toBeVisible({ timeout: 15000 });

      for (const tabId of section.tabs) {
        const tab = page.getByTestId(`manager-tab-${tabId}`);
        await expect(tab).toBeVisible();
        await tab.click();
        await expect(tab).toHaveAttribute('data-active', 'true');
        await assertNoErrorBoundary(page);
      }
    });
  }

  test('K9: /manager/analytics redirects into shell analytics', async ({ page }) => {
    await page.goto('/manager/analytics');
    await page.waitForURL(/\/manager\?section=analytics/, { timeout: 15000 });
    await dismissCookieBanner(page);
    await assertNoErrorBoundary(page);
    await expect(page.getByTestId('manager-page-frame')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('manager-tab-bar')).toBeVisible();
    await expect(page.getByTestId('manager-tab-kitchen')).toHaveAttribute('data-active', 'true');
    // Standalone MUI title must not appear
    await expect(page.getByRole('heading', { name: /^Analytics Dashboard$/i })).toHaveCount(0);
  });
});
