import { Page } from '@playwright/test';

/**
 * Demo account credentials for different user roles.
 * These match the staff login page demo accounts.
 */
/**
 * Berlin demo accounts (after scripts/reseed/reseed-all.js).
 * Password: Demo@1234 for all. Cashier POS PIN: 12345.
 */
export const DEMO_ACCOUNTS = {
    manager: {
        email: 'manager.berlin@gmail.com',
        password: 'Demo@1234',
        route: '/manager',
    },
    kitchenStaff: {
        email: 'kitchen.berlin@gmail.com',
        password: 'Demo@1234',
        route: '/kitchen',
    },
    driver: {
        email: 'driver.berlin@gmail.com',
        password: 'Demo@1234',
        route: '/driver',
    },
    cashier: {
        email: 'cashier.berlin@gmail.com',
        password: 'Demo@1234',
        route: '/pos',
    },
};

/**
 * Login as a staff user via the staff login page.
 * NOTE: Requires backend services to be running.
 */
export async function loginAsRole(page: Page, role: keyof typeof DEMO_ACCOUNTS) {
    const account = DEMO_ACCOUNTS[role];
    await page.goto('/staff-login');

    await page.getByPlaceholder('Enter your work email').fill(account.email);
    await page.getByPlaceholder('Enter your password').fill(account.password);
    await page.getByRole('button', { name: /Sign In to Store/ }).click();

    // Wait for navigation after login
    await page.waitForURL(account.route + '**', { timeout: 10000 });
}
