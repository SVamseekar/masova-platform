import { Page, Locator } from '@playwright/test';

export class OrderTrackingPage {
  readonly page: Page;
  readonly orderStatus: Locator;
  readonly orderNumber: Locator;
  readonly driverInfo: Locator;
  readonly estimatedArrival: Locator;
  readonly orderItems: Locator;
  readonly totalAmount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderStatus = page.locator('[data-testid="order-status"], .order-status');
    this.orderNumber = page.locator('[data-testid="order-number"], .order-number');
    this.driverInfo = page.locator('[data-testid="driver-info"], .driver-info');
    this.estimatedArrival = page.locator('[data-testid="estimated-arrival"], .estimated-arrival');
    this.orderItems = page.locator('[data-testid="order-item"], .order-item');
    this.totalAmount = page.locator('[data-testid="order-total"], .order-total');
  }

  async goto(orderId: string): Promise<void> {
    await this.page.goto(`/orders/${orderId}/track`);
  }

  async getStatusText(): Promise<string> {
    return (await this.orderStatus.textContent()) ?? '';
  }

  async getOrderNumberText(): Promise<string> {
    return (await this.orderNumber.textContent()) ?? '';
  }
}
