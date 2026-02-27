import { test, expect } from '@playwright/test';

test.describe('Staff Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/staff-login');
    });

    test('should display the login form heading', async ({ page }) => {
        // Use getByRole to avoid ambiguity with the "Sign In" button
        await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
        await expect(page.getByText('Access your MaSoVa management account')).toBeVisible();
    });

    test('should display MaSoVa branding', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'MaSoVa' })).toBeVisible();
        await expect(page.getByText('Restaurant Management')).toBeVisible();
    });

    test('should display demo account buttons', async ({ page }) => {
        await expect(page.getByText('Quick Demo Access')).toBeVisible();
        await expect(page.getByText('Kitchen Staff')).toBeVisible();
    });

    test('should display system features list', async ({ page }) => {
        await expect(page.getByText('System Features')).toBeVisible();
        await expect(page.getByText('Real-time Store Analytics')).toBeVisible();
    });

    test('should have email and password inputs', async ({ page }) => {
        await expect(page.getByPlaceholder('Enter your work email')).toBeVisible();
        await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    });

    test('should show error for empty form submission', async ({ page }) => {
        await page.getByRole('button', { name: /Sign In to Store/ }).click();
        await expect(page.getByText('Please fill in all fields')).toBeVisible();
    });

    test('should show error for short password', async ({ page }) => {
        await page.getByPlaceholder('Enter your work email').fill('test@example.com');
        await page.getByPlaceholder('Enter your password').fill('12345');
        await page.getByRole('button', { name: /Sign In to Store/ }).click();
        await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
    });
});
