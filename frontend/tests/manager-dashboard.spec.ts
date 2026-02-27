import { test, expect } from '@playwright/test';
import { loginAsRole, DEMO_ACCOUNTS } from './helpers/auth';

/**
 * Manager Dashboard Tests
 * These tests require backend services to be running.
 * Skip with: npx playwright test --grep-invert "NEEDS BACKEND"
 */
test.describe('Manager Dashboard [NEEDS BACKEND]', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsRole(page, 'manager');
    });

    test('should load manager dashboard after login', async ({ page }) => {
        await expect(page).toHaveURL(/\/manager/);
    });

    test('should display dashboard content', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();
    });
});
