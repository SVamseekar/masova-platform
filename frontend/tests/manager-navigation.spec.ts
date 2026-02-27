import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers/auth';

/**
 * Manager Sub-page Navigation Tests
 * These tests require backend services to be running.
 * Skip with: npx playwright test --grep-invert "NEEDS BACKEND"
 */
test.describe('Manager Navigation [NEEDS BACKEND]', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsRole(page, 'manager');
    });

    const managerPages = [
        { path: '/manager/orders', name: 'Orders' },
        { path: '/manager/inventory', name: 'Inventory' },
        { path: '/manager/staff', name: 'Staff' },
        { path: '/manager/customers', name: 'Customers' },
        { path: '/manager/payments', name: 'Payments' },
        { path: '/manager/reviews', name: 'Reviews' },
        { path: '/manager/drivers', name: 'Drivers' },
        { path: '/manager/deliveries', name: 'Deliveries' },
        { path: '/manager/recipes', name: 'Recipes' },
        { path: '/manager/campaigns', name: 'Campaigns' },
    ];

    for (const managerPage of managerPages) {
        test(`should load ${managerPage.name} page`, async ({ page }) => {
            await page.goto(managerPage.path);
            await expect(page).toHaveURL(managerPage.path);
            await page.waitForLoadState('networkidle');
            const body = page.locator('body');
            await expect(body).not.toBeEmpty();
        });
    }
});
