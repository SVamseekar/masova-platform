import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly orderSummary: Locator;
  readonly addressInput: Locator;
  readonly paymentMethodOptions: Locator;
  readonly placeOrderButton: Locator;
  readonly orderTypeSelector: Locator;
  readonly specialInstructionsInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderSummary = page.locator('[data-testid="order-summary"], .order-summary');
    this.addressInput = page.locator('[data-testid="address-input"], input[name="address"]');
    this.paymentMethodOptions = page.locator('[data-testid="payment-method"], .payment-method');
    this.placeOrderButton = page.locator('[data-testid="place-order"], button:has-text("Place Order"), button:has-text("Confirm")');
    this.orderTypeSelector = page.locator('[data-testid="order-type"], .order-type-selector');
    this.specialInstructionsInput = page.locator('[data-testid="special-instructions"], textarea[name="instructions"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  async selectOrderType(type: 'Delivery' | 'Dine-In' | 'Takeaway'): Promise<void> {
    await this.orderTypeSelector.filter({ hasText: type }).click();
  }

  async selectPaymentMethod(method: string): Promise<void> {
    await this.paymentMethodOptions.filter({ hasText: method }).click();
  }

  async fillAddress(address: string): Promise<void> {
    await this.addressInput.fill(address);
  }

  async addSpecialInstructions(instructions: string): Promise<void> {
    await this.specialInstructionsInput.fill(instructions);
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}
