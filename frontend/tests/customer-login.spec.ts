import { test, expect } from '@playwright/test';

test.describe('Customer Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/customer-login');
    });

    test('should display Welcome Back heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
        await expect(page.getByText('Login to continue with your order')).toBeVisible();
    });

    test('should display login form with email and password fields', async ({ page }) => {
        await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
        await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    });

    test('should display Back to Checkout button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Back to Checkout/ })).toBeVisible();
    });

    test('should display Create Account link', async ({ page }) => {
        await expect(page.getByText('Create Account')).toBeVisible();
    });

    test('should navigate to register page when clicking Create Account', async ({ page }) => {
        await page.getByText('Create Account').click();
        await expect(page).toHaveURL('/register');
    });

    test('should show error for empty form submission', async ({ page }) => {
        await page.getByRole('button', { name: /Login & Continue/ }).click();
        await expect(page.getByText('Please fill in all fields')).toBeVisible();
    });

    test('should show error for short password', async ({ page }) => {
        await page.getByPlaceholder('Enter your email').fill('test@example.com');
        await page.getByPlaceholder('Enter your password').fill('123');
        await page.getByRole('button', { name: /Login & Continue/ }).click();
        await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
    });

    test('should navigate back to checkout when clicking Back to Checkout', async ({ page }) => {
        await page.getByRole('button', { name: /Back to Checkout/ }).click();
        await expect(page).toHaveURL('/checkout');
    });
});
