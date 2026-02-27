import { Page, Locator } from '@playwright/test';

export class MenuPage {
  readonly page: Page;
  readonly menuItems: Locator;
  readonly searchInput: Locator;
  readonly categoryFilters: Locator;
  readonly cartButton: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuItems = page.locator('[data-testid="menu-item"], .menu-item');
    this.searchInput = page.locator('[data-testid="search-input"], input[placeholder*="Search"]');
    this.categoryFilters = page.locator('[data-testid="category-filter"], .category-filter');
    this.cartButton = page.locator('[data-testid="cart-button"], button:has-text("Cart")');
    this.cartBadge = page.locator('[data-testid="cart-badge"], .cart-badge');
  }

  async goto(): Promise<void> {
    await this.page.goto('/menu');
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async selectCategory(categoryName: string): Promise<void> {
    await this.categoryFilters.filter({ hasText: categoryName }).click();
  }

  async addItemToCart(itemName: string): Promise<void> {
    const item = this.menuItems.filter({ hasText: itemName });
    const addButton = item.locator('button:has-text("Add"), [data-testid="add-to-cart"]');
    await addButton.click();
  }

  async getMenuItemCount(): Promise<number> {
    return this.menuItems.count();
  }

  async openCart(): Promise<void> {
    await this.cartButton.click();
  }
}
