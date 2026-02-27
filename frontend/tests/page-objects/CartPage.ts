import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly totalAmount: Locator;
  readonly checkoutButton: Locator;
  readonly emptyCartMessage: Locator;
  readonly removeButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-testid="cart-item"], .cart-item');
    this.totalAmount = page.locator('[data-testid="cart-total"], .cart-total');
    this.checkoutButton = page.locator('[data-testid="checkout-button"], button:has-text("Checkout"), button:has-text("Proceed")');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"], :text("empty")');
    this.removeButtons = page.locator('[data-testid="remove-item"], button:has-text("Remove")');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async removeItem(index: number): Promise<void> {
    await this.removeButtons.nth(index).click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
