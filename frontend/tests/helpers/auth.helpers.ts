import { Page } from '@playwright/test';

/**
 * Test credentials for different user roles.
 * These should match demo accounts available in the running backend.
 */
/** Berlin demo accounts — align with reseed (Phase E/F). */
export const TEST_ACCOUNTS = {
  customer: {
    email: 'anna.mueller@gmail.com',
    password: 'Demo@1234',
    expectedRoute: '/menu',
  },
  manager: {
    email: 'manager.berlin@gmail.com',
    password: 'Demo@1234',
    expectedRoute: '/manager',
  },
  driver: {
    email: 'driver.berlin@gmail.com',
    password: 'Demo@1234',
    expectedRoute: '/driver',
  },
  kitchenStaff: {
    email: 'kitchen.berlin@gmail.com',
    password: 'Demo@1234',
    expectedRoute: '/kitchen',
  },
};

export async function loginAsCustomer(page: Page): Promise<void> {
  const account = TEST_ACCOUNTS.customer;
  await page.goto('/login');
  await page.fill('[data-testid="email-input"], input[type="email"]', account.email);
  await page.fill('[data-testid="password-input"], input[type="password"]', account.password);
  await page.click('[data-testid="login-button"], button[type="submit"]');
  await page.waitForURL('**/menu**', { timeout: 10000 });
}

export async function loginAsManager(page: Page): Promise<void> {
  const account = TEST_ACCOUNTS.manager;
  await page.goto('/login');
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/manager/**', { timeout: 10000 });
}

export async function loginAsDriver(page: Page): Promise<void> {
  const account = TEST_ACCOUNTS.driver;
  await page.goto('/login');
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/driver/**', { timeout: 10000 });
}

export async function loginAsKitchenStaff(page: Page): Promise<void> {
  const account = TEST_ACCOUNTS.kitchenStaff;
  await page.goto('/staff-login');
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/kitchen**', { timeout: 10000 });
}

export async function logout(page: Page): Promise<void> {
  // Try the common logout button patterns
  const logoutButton = page.locator(
    '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")',
  );

  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click();
  } else {
    // Fallback: navigate to logout route directly
    await page.goto('/logout');
  }

  await page.waitForURL('**/', { timeout: 10000 });
}
