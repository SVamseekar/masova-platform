import { test, expect } from '@playwright/test';

/**
 * Catches dual-source lie: TOTAL ORDERS > 0 but table empty.
 * Requires Dell + seed + getStoreOrders fix (/orders?storeId=).
 */
const MANAGER = {
  email: 'manager.berlin@gmail.com',
  password: 'Demo@1234',
};

test.describe('Orders list + filters [NEEDS BACKEND]', () => {
  test('manager orders tab lists rows when store has orders', async ({ page }) => {
    await page.goto('/staff-login');
    await page.getByPlaceholder(/work email|email/i).or(page.locator('input[type="email"]')).first().fill(MANAGER.email);
    await page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first().fill(MANAGER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/manager/, { timeout: 25000 });

    await page.goto('/manager?section=orders&tab=orders');
    await page.waitForTimeout(2500);

    // Wait for either order rows or explicit empty for zero-data store
    const noOrders = page.getByText(/No orders for this store yet|No orders found|No orders match/i);
    const loading = page.getByText(/Loading orders/i);

    await expect(loading).toHaveCount(0, { timeout: 20000 }).catch(() => undefined);

    // KPI total should not stay at 8 with empty table forever — expect list count label
    const body = await page.locator('body').innerText();
    // Prefer: "N orders" with N > 0, or table with order numbers
    const countMatch = body.match(/(\d+)\s+orders/i);
    const listed = countMatch ? Number(countMatch[1]) : -1;

    if (listed === 0) {
      // If truly empty, dual-source fail if TOTAL ORDERS shows positive elsewhere
      const totalCard = body.match(/TOTAL ORDERS\s*(\d+)/i);
      if (totalCard && Number(totalCard[1]) > 0) {
        throw new Error(
          `Dual-source lie: TOTAL ORDERS=${totalCard[1]} but list shows 0 orders. Check GET /orders?storeId=`,
        );
      }
      await expect(noOrders.first()).toBeVisible();
      return;
    }

    expect(listed).toBeGreaterThan(0);

    // Filter by status RECEIVED if option exists
    const statusSelect = page.locator('select').filter({ hasText: /All Statuses|RECEIVED|status/i }).first();
    if (await statusSelect.isVisible().catch(() => false)) {
      const options = await statusSelect.locator('option').allTextContents();
      if (options.some((o) => /RECEIVED/i.test(o))) {
        await statusSelect.selectOption({ label: options.find((o) => /RECEIVED/i.test(o))! });
        await page.waitForTimeout(500);
        const after = await page.locator('body').innerText();
        const m2 = after.match(/(\d+)\s+orders/i);
        // filter should not crash; count can be 0..listed
        expect(m2).toBeTruthy();
      }
    }

    // Search box on page
    const search = page.getByPlaceholder(/Search orders/i);
    if (await search.isVisible().catch(() => false)) {
      await search.fill('___no_such_order___');
      await page.waitForTimeout(400);
      await expect(page.getByText(/No orders match|0 orders/i).first()).toBeVisible({ timeout: 5000 });
      await search.fill('');
      await page.waitForTimeout(400);
    }
  });
});
