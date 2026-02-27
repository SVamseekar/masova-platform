import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/checkout');
    });

    test('should display Checkout heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
        await expect(page.getByText("Choose how you'd like to continue")).toBeVisible();
    });

    test('should display three checkout options', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Guest Checkout' })).toBeVisible();
    });

    test('should display Order Summary sidebar', async ({ page }) => {
        await expect(page.getByText('Order Summary')).toBeVisible();
        await expect(page.getByText('Total Amount')).toBeVisible();
    });

    test('should navigate to customer login when clicking Login to Continue', async ({ page }) => {
        await page.getByRole('button', { name: 'Login to Continue' }).click();
        await expect(page).toHaveURL('/customer-login');
    });

    test('should navigate to register when clicking Create Account', async ({ page }) => {
        await page.getByRole('button', { name: 'Create Account' }).click();
        await expect(page).toHaveURL('/register');
    });

    test('should navigate to guest checkout when clicking Continue as Guest', async ({ page }) => {
        await page.getByRole('button', { name: 'Continue as Guest' }).click();
        await expect(page).toHaveURL('/guest-checkout');
    });

    test('should have Back button that goes to menu', async ({ page }) => {
        await page.getByText('← Back').click();
        await expect(page).toHaveURL('/menu');
    });

    test('should display checkout option benefits', async ({ page }) => {
        await expect(page.getByText('Access your saved addresses')).toBeVisible();
        await expect(page.getByText('No registration required')).toBeVisible();
    });
});

test.describe('Payment Result Pages', () => {
    test('payment success page loads', async ({ page }) => {
        await page.goto('/payment/success');
        await expect(page).toHaveURL('/payment/success');
    });

    test('payment failed page loads', async ({ page }) => {
        await page.goto('/payment/failed');
        await expect(page).toHaveURL('/payment/failed');
    });
});
