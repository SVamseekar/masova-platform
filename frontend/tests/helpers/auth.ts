import { Page } from '@playwright/test';

/**
 * Demo account credentials for different user roles.
 * These match the staff login page demo accounts.
 */
export const DEMO_ACCOUNTS = {
    manager: {
        email: 'suresh.manager@masova.com',
        password: 'manager123',
        route: '/manager',
    },
    kitchenStaff: {
        email: 'rahul.staff@masova.com',
        password: 'staff123',
        route: '/kitchen',
    },
    driver: {
        email: 'rajesh.driver@masova.com',
        password: 'driver123',
        route: '/driver',
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
