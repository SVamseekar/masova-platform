import { test, expect, type Page } from '@playwright/test';

/**
 * Phase F — True E2E platform smoke against Dell gateway + local Vite.
 *
 * Credentials match scripts/reseed (Berlin DE/EUR after reseed-all).
 * Run: npx playwright test tests/phase-f-platform-smoke.spec.ts --project=chromium
 */

const DEMO = {
  password: 'Demo@1234',
  manager: 'manager.berlin@gmail.com',
  customer: 'anna.mueller@gmail.com',
  kitchen: 'kitchen.berlin@gmail.com',
  cashier: 'cashier.berlin@gmail.com',
} as const;

async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole('button', { name: /accept|allow all|got it|agree/i }).first();
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await accept.click().catch(() => undefined);
  }
}

/** Wait until React Suspense spinner is gone and shell content exists. */
async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  // ManagerShell / app chunks finish loading
  await page
    .locator('[role="progressbar"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 20000 })
    .catch(() => undefined);
  await page.waitForTimeout(500);
}

async function staffLogin(page: Page, email: string, expectedUrl: RegExp) {
  await page.goto('/staff-login');
  await dismissCookieBanner(page);
  await waitForAppReady(page);
  const emailField = page.getByPlaceholder(/work email|email/i).or(page.locator('input[type="email"]')).first();
  const passwordField = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first();
  await emailField.fill(email);
  await passwordField.fill(DEMO.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(expectedUrl, { timeout: 25000 });
  await waitForAppReady(page);
}

async function customerLogin(page: Page) {
  await page.goto('/customer-login');
  await dismissCookieBanner(page);
  await waitForAppReady(page);
  await page.locator('input[type="email"]').first().fill(DEMO.customer);
  await page.locator('input[type="password"]').first().fill(DEMO.password);
  await page.getByRole('button', { name: /login|sign in|continue/i }).first().click();
  await page.waitForURL(/\/(customer-dashboard|menu|order|profile)/, { timeout: 25000 });
  await waitForAppReady(page);
}

async function assertNoErrorBoundary(page: Page) {
  await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  await expect(page.getByText(/ErrorBoundary/i)).toHaveCount(0);
}

test.describe('Phase F platform smoke [NEEDS BACKEND]', () => {
  // Independent tests so one failure does not skip the rest of the suite
  test.describe.configure({ mode: 'default' });

  test('landing ProductSite loads without crash', async ({ page }) => {
    await page.goto('/');
    await dismissCookieBanner(page);
    await waitForAppReady(page);
    await expect(page.locator('#product-site')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/MaSoVa/i).first()).toBeVisible();
    await assertNoErrorBoundary(page);
  });

  test('legal pages: privacy, terms, cookies, refunds', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/cookies', '/refunds']) {
      await page.goto(path);
      await dismissCookieBanner(page);
      await waitForAppReady(page);
      await expect(page.locator('#product-site')).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await assertNoErrorBoundary(page);
    }
  });

  test('manager login → dashboard shell', async ({ page }) => {
    await staffLogin(page, DEMO.manager, /\/manager/);
    await expect(page).toHaveURL(/\/manager/);
    await assertNoErrorBoundary(page);
    // Sidebar section labels from ManagerShell
    await expect(
      page.getByText(/Dashboard|Orders|Inventory|Analytics|Operations/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('manager → orders section', async ({ page }) => {
    await staffLogin(page, DEMO.manager, /\/manager/);
    // Prefer in-app nav click (keeps SPA state) then fall back to query URL
    const ordersNav = page.getByRole('button', { name: /^Orders$/i })
      .or(page.getByText(/^Orders$/i))
      .first();
    if (await ordersNav.isVisible({ timeout: 8000 }).catch(() => false)) {
      await ordersNav.click();
    } else {
      await page.goto('/manager?section=orders&tab=orders');
    }
    await waitForAppReady(page);
    await page.waitForTimeout(1500);
    await assertNoErrorBoundary(page);
    // Any of: section title, order rows, empty state, or filters
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    const ok =
      bodyText.includes('order') ||
      bodyText.includes('delivery') ||
      bodyText.includes('refund') ||
      bodyText.includes('payment');
    expect(ok).toBeTruthy();
  });

  test('manager → analytics section without ErrorBoundary', async ({ page }) => {
    await staffLogin(page, DEMO.manager, /\/manager/);
    const analyticsNav = page.getByRole('button', { name: /Analytics/i })
      .or(page.getByText(/^Analytics$/i))
      .first();
    if (await analyticsNav.isVisible({ timeout: 8000 }).catch(() => false)) {
      await analyticsNav.click();
    } else {
      await page.goto('/manager?section=analytics');
    }
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    await assertNoErrorBoundary(page);
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(
      bodyText.includes('analytics') ||
        bodyText.includes('kitchen') ||
        bodyText.includes('product') ||
        bodyText.includes('report') ||
        bodyText.includes('equipment') ||
        bodyText.includes('prep') ||
        bodyText.includes('sales')
    ).toBeTruthy();
  });

  test('manager → dashboard section (home metrics)', async ({ page }) => {
    await staffLogin(page, DEMO.manager, /\/manager/);
    await waitForAppReady(page);
    await page.waitForTimeout(1500);
    await assertNoErrorBoundary(page);
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(
      bodyText.includes('sales') ||
        bodyText.includes('order') ||
        bodyText.includes('staff') ||
        bodyText.includes('today') ||
        bodyText.includes('dashboard')
    ).toBeTruthy();
  });

  test('customer login → authenticated area', async ({ page }) => {
    await customerLogin(page);
    await assertNoErrorBoundary(page);
  });

  test('customer public menu loads (anonymous path)', async ({ page }) => {
    await page.goto('/menu');
    await dismissCookieBanner(page);
    await waitForAppReady(page);
    await page.waitForTimeout(1500);
    await assertNoErrorBoundary(page);
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(
      bodyText.includes('menu') ||
        bodyText.includes('store') ||
        bodyText.includes('cart') ||
        bodyText.includes('pizza') ||
        bodyText.includes('item') ||
        bodyText.includes('open') ||
        bodyText.includes('select')
    ).toBeTruthy();
  });

  test('customer order detail path from dashboard when orders exist', async ({ page }) => {
    await customerLogin(page);
    await page.goto('/customer-dashboard');
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    await assertNoErrorBoundary(page);

    const orderLink = page.locator('a[href*="/tracking/"], a[href*="order"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();
      await waitForAppReady(page);
      await assertNoErrorBoundary(page);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'No order detail link found; dashboard load OK',
      });
    }
  });

  test('KDS kitchen display loads for kitchen staff', async ({ page }) => {
    await staffLogin(page, DEMO.kitchen, /\/(kitchen|manager|pos)/);
    if (!page.url().includes('/kitchen')) {
      await page.goto('/kitchen');
    }
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    await assertNoErrorBoundary(page);
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('POS loads and shows EU payment methods (no UPI)', async ({ page }) => {
    await staffLogin(page, DEMO.cashier, /\/(pos|manager|kitchen)/);
    await page.goto('/pos');
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    await assertNoErrorBoundary(page);
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(
      bodyText.includes('pos') ||
        bodyText.includes('menu') ||
        bodyText.includes('payment') ||
        bodyText.includes('cash') ||
        bodyText.includes('card') ||
        bodyText.includes('pin') ||
        bodyText.includes('order')
    ).toBeTruthy();
    await expect(page.getByRole('button', { name: /^UPI$/i })).toHaveCount(0);
  });

  test('manager people/reviews path does not crash', async ({ page }) => {
    await staffLogin(page, DEMO.manager, /\/manager/);
    await page.goto('/manager?section=people&tab=reviews');
    await waitForAppReady(page);
    await page.waitForTimeout(1500);
    await assertNoErrorBoundary(page);
  });
});
