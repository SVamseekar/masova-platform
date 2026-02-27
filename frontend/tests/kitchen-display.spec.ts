import { test, expect } from '@playwright/test';

test.describe('Kitchen Display Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/kitchen');
    });

    test('should load the kitchen display page', async ({ page }) => {
        await expect(page).toHaveURL('/kitchen');
    });

    test('should display kitchen display interface', async ({ page }) => {
        // The KitchenDisplayPage renders a kanban board with status columns
        await page.waitForLoadState('networkidle');
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();
    });

    test('should display status columns', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        // The kitchen display has 5 status columns
        await expect(page.getByText('New Orders')).toBeVisible();
        await expect(page.getByText('Preparing')).toBeVisible();
        await expect(page.getByText('In Oven')).toBeVisible();
        await expect(page.getByText('Ready')).toBeVisible();
        await expect(page.getByText('Completed')).toBeVisible();
    });
});
