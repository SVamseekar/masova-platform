import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display the MaSoVa branding', async ({ page }) => {
        // The actual homepage is from apps/PublicWebsite/HomePage.tsx
        // It has a "Why Choose MaSoVa?" section and a footer with "MaSoVa Restaurant"
        await expect(page.getByText('Why Choose MaSoVa?')).toBeVisible();
    });

    test('should display feature cards', async ({ page }) => {
        await expect(page.getByText('Multi-Cuisine Menu')).toBeVisible();
        await expect(page.getByText('Fast Delivery')).toBeVisible();
        await expect(page.getByText('Great Offers')).toBeVisible();
        await expect(page.getByText('Dine-In & Takeaway')).toBeVisible();
    });

    test('should display promotions section', async ({ page }) => {
        await expect(page.getByText("Today's Special Offers")).toBeVisible();
        await expect(page.getByText('Weekend Special')).toBeVisible();
        await expect(page.getByText('Family Combo')).toBeVisible();
    });

    test('should display call-to-action section', async ({ page }) => {
        await expect(page.getByText("Hungry? Let's Order!")).toBeVisible();
    });

    test('should display footer with contact info', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'MaSoVa Restaurant' })).toBeVisible();
        await expect(page.getByText('info@masova.com')).toBeVisible();
    });

    test('should navigate to menu via Browse Menu button', async ({ page }) => {
        // Use the footer "Browse Menu" link (more reliable)
        await page.getByRole('button', { name: 'Browse Menu' }).first().click();
        await expect(page).toHaveURL('/menu');
    });
});
