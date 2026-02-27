import { Page, Locator } from '@playwright/test';

export class ManagerDashboardPage {
  readonly page: Page;
  readonly salesMetrics: Locator;
  readonly orderCount: Locator;
  readonly recentOrders: Locator;
  readonly sidebarNavigation: Locator;
  readonly storeSelector: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.salesMetrics = page.locator('[data-testid="sales-metrics"], .sales-metrics');
    this.orderCount = page.locator('[data-testid="order-count"], .order-count');
    this.recentOrders = page.locator('[data-testid="recent-orders"], .recent-orders');
    this.sidebarNavigation = page.locator('[data-testid="sidebar"], nav, aside');
    this.storeSelector = page.locator('[data-testid="store-selector"], .store-selector');
    this.refreshButton = page.locator('[data-testid="refresh-button"], button:has-text("Refresh")');
  }

  async goto(): Promise<void> {
    await this.page.goto('/manager/dashboard');
  }

  async navigateToSection(sectionName: string): Promise<void> {
    await this.sidebarNavigation.locator(`a:has-text("${sectionName}"), button:has-text("${sectionName}")`).click();
  }

  async selectStore(storeName: string): Promise<void> {
    await this.storeSelector.click();
    await this.page.locator(`li:has-text("${storeName}"), option:has-text("${storeName}")`).click();
  }

  async refresh(): Promise<void> {
    await this.refreshButton.click();
  }
}
