import { test, expect, type Page } from '@playwright/test';

/**
 * F2a exit: manager shell sections load without ErrorBoundary;
 * Quick Info heading visible and section label updates.
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

test.describe('Manager Quick Info [NEEDS BACKEND]', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await managerLogin(page);
  });

  const sections: { id: string; label: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'orders', label: 'Orders & Payments' },
    { id: 'inventory', label: 'Inventory & Supply' },
    { id: 'operations', label: 'Operations' },
    { id: 'people', label: 'People & Marketing' },
    { id: 'analytics', label: 'Analytics & Reports' },
    { id: 'ai', label: 'AI Agents' },
    { id: 'compliance', label: 'Fiscal Compliance' },
  ];

  for (const section of sections) {
    test(`section ${section.id}: loads + Quick Info`, async ({ page }) => {
      await page.goto(`/manager?section=${section.id}`);
      await page.waitForLoadState('domcontentloaded');
      await dismissCookieBanner(page);

      await assertNoErrorBoundary(page);

      const quickInfo = page.getByTestId('manager-quick-info');
      await expect(quickInfo).toBeVisible({ timeout: 15000 });
      await expect(quickInfo.getByRole('heading', { name: 'Quick Info' })).toBeVisible();
      await expect(page.getByTestId('quick-info-section-label')).toHaveText(section.label);

      if (section.id === 'inventory') {
        await expect(quickInfo.getByText('Low stock items')).toBeVisible({ timeout: 15000 });
        await expect(quickInfo.getByText('POs pending approval')).toBeVisible();
      }

      if (section.id === 'ai') {
        await expect(quickInfo.getByText('Live / wired')).toBeVisible();
        await expect(quickInfo.getByText('Coming soon')).toBeVisible();
      }

      if (section.id === 'dashboard') {
        await expect(page.getByTestId('manager-page-frame')).toBeVisible({ timeout: 15000 });
      }
    });
  }
});
