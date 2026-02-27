import { test, expect } from '@playwright/test';

test.describe('Public Route Navigation', () => {
    test('homepage loads at root URL', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL('/');
        await expect(page.getByText('Why Choose MaSoVa?')).toBeVisible();
    });

    test('menu page is accessible', async ({ page }) => {
        await page.goto('/menu');
        await expect(page).toHaveURL('/menu');
    });

    test('promotions page is accessible', async ({ page }) => {
        await page.goto('/promotions');
        await expect(page).toHaveURL('/promotions');
    });

    test('/login redirects to /customer-login', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveURL('/customer-login');
    });

    test('staff login page is accessible', async ({ page }) => {
        await page.goto('/staff-login');
        await expect(page).toHaveURL('/staff-login');
        await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    });

    test('register page is accessible', async ({ page }) => {
        await page.goto('/register');
        await expect(page).toHaveURL('/register');
    });

    test('unknown route redirects to homepage', async ({ page }) => {
        await page.goto('/totally-nonexistent-page');
        await expect(page).toHaveURL('/');
    });
});

test.describe('Protected Routes (unauthenticated)', () => {
    test('manager dashboard redirects when not logged in', async ({ page }) => {
        await page.goto('/manager');
        await expect(page).not.toHaveURL('/manager');
    });

    test('customer dashboard redirects when not logged in', async ({ page }) => {
        await page.goto('/customer-dashboard');
        await expect(page).not.toHaveURL('/customer-dashboard');
    });

    test('driver dashboard redirects when not logged in', async ({ page }) => {
        await page.goto('/driver');
        await expect(page).not.toHaveURL('/driver');
    });
});
