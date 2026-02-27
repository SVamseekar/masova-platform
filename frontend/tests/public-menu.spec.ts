import { test, expect } from '@playwright/test';

test.describe('Public Menu Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/menu');
    });

    test('should load the menu page', async ({ page }) => {
        await expect(page).toHaveURL('/menu');
    });

    test('should display page content', async ({ page }) => {
        // Wait for page to load — the menu is lazy-loaded
        await page.waitForLoadState('networkidle');
        // The page should have some visible content (not be blank)
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();
    });

    test('should be accessible from homepage navigation', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Browse Menu' }).first().click();
        await expect(page).toHaveURL('/menu');
    });
});
