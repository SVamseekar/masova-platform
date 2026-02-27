import { Page } from '@playwright/test';

export async function navigateToMenu(page: Page): Promise<void> {
  await page.goto('/menu');
}

export async function navigateToCart(page: Page): Promise<void> {
  await page.goto('/cart');
}

export async function navigateToOrders(page: Page): Promise<void> {
  await page.goto('/orders');
}

export async function navigateToManagerDashboard(page: Page): Promise<void> {
  await page.goto('/manager/dashboard');
}

export async function navigateToKitchenDisplay(page: Page): Promise<void> {
  await page.goto('/kitchen');
}

export async function navigateToDriverHome(page: Page): Promise<void> {
  await page.goto('/driver');
}

export async function navigateToStaffLogin(page: Page): Promise<void> {
  await page.goto('/staff-login');
}

export async function navigateToCheckout(page: Page): Promise<void> {
  await page.goto('/checkout');
}
