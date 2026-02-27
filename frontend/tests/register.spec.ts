import { test, expect } from '@playwright/test';

test.describe('Registration Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('should display Create Account heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
        await expect(page.getByText('Join MaSoVa and enjoy faster checkouts')).toBeVisible();
    });

    test('should display all form fields', async ({ page }) => {
        await expect(page.getByText('First Name')).toBeVisible();
        await expect(page.getByText('Last Name')).toBeVisible();
        await expect(page.getByText('Email Address')).toBeVisible();
        await expect(page.getByText('Phone Number')).toBeVisible();
        await expect(page.getByText('Password', { exact: true })).toBeVisible();
        await expect(page.getByText('Confirm Password')).toBeVisible();
    });

    test('should have Back button', async ({ page }) => {
        await expect(page.getByText('← Back')).toBeVisible();
    });

    test('should display Login here link', async ({ page }) => {
        await expect(page.getByText('Already have an account?')).toBeVisible();
        await expect(page.getByText('Login here')).toBeVisible();
    });

    test('should navigate to customer login when clicking Login here', async ({ page }) => {
        await page.getByText('Login here').click();
        await expect(page).toHaveURL('/customer-login');
    });

    test('should validate invalid phone number', async ({ page }) => {
        await page.getByRole('textbox', { name: 'First Name' }).fill('John');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
        await page.getByRole('textbox', { name: 'Email Address' }).fill('john@example.com');
        await page.getByRole('textbox', { name: 'Phone Number' }).fill('12345');
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('password123');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('password123');
        await page.getByRole('button', { name: 'Create Account' }).click();
        await expect(page.getByText('Enter valid 10-digit Indian mobile number')).toBeVisible();
    });

    test('should validate password mismatch', async ({ page }) => {
        await page.getByRole('textbox', { name: 'First Name' }).fill('John');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
        await page.getByRole('textbox', { name: 'Email Address' }).fill('john@example.com');
        await page.getByRole('textbox', { name: 'Phone Number' }).fill('9876543210');
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('password123');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('different456');
        await page.getByRole('button', { name: 'Create Account' }).click();
        await expect(page.getByText('Passwords do not match')).toBeVisible();
    });
});
