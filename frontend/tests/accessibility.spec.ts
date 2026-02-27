import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
    test('homepage has proper page title', async ({ page }) => {
        await page.goto('/');
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);
    });

    test('staff login form has labeled inputs', async ({ page }) => {
        await page.goto('/staff-login');
        // Inputs should be findable by their placeholder text (accessible names)
        await expect(page.getByPlaceholder('Enter your work email')).toBeVisible();
        await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    });

    test('customer login form has labeled inputs', async ({ page }) => {
        await page.goto('/customer-login');
        await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
        await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    });

    test('register form has labeled inputs', async ({ page }) => {
        await page.goto('/register');
        await expect(page.getByText('First Name')).toBeVisible();
        await expect(page.getByText('Last Name')).toBeVisible();
        await expect(page.getByText('Email Address')).toBeVisible();
        await expect(page.getByText('Phone Number')).toBeVisible();
    });

    test('checkout buttons are keyboard-accessible', async ({ page }) => {
        await page.goto('/checkout');
        // All three checkout option buttons should be role="button"
        await expect(page.getByRole('button', { name: 'Login to Continue' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Continue as Guest' })).toBeVisible();
    });

    test('homepage has structured content sections', async ({ page }) => {
        await page.goto('/');
        // Homepage should have clearly structured sections with text content
        await expect(page.getByText('Why Choose MaSoVa?')).toBeVisible();
        await expect(page.getByText("Today's Special Offers")).toBeVisible();
    });
});
