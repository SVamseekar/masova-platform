import { test, expect } from '@playwright/test';

test.describe('Promotions Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/promotions');
    });

    test('should load the promotions page', async ({ page }) => {
        await expect(page).toHaveURL('/promotions');
    });

    test('should display page content', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();
    });

    test('should be accessible from homepage', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'View All Offers' }).click();
        await expect(page).toHaveURL('/promotions');
    });
});
