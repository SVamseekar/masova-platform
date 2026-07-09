import { test, expect, type Page } from '@playwright/test';

/**
 * F2f — Guest checkout DE-friendly copy (K6).
 * Asserts India-only phone/PIN copy is gone and EU placeholders are present.
 * Does not require auth or a full order path.
 */

async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole('button', { name: /accept|allow all|got it|agree/i }).first();
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await accept.click().catch(() => undefined);
  }
}

/** Seed DOM001 DE cart so GuestCheckout does not redirect to /menu (empty cart guard). */
async function seedDeCart(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'cart',
      JSON.stringify({
        items: [
          {
            id: 'item-1',
            name: 'Margherita',
            price: 12.5,
            quantity: 1,
          },
        ],
        total: 12.5,
        itemCount: 1,
        selectedStoreId: 'DOM001',
        selectedStoreName: 'MaSoVa Berlin Mitte',
        currency: 'EUR',
        locale: 'de-DE',
        storeCountryCode: 'DE',
      })
    );
  });
}

test.describe('Guest checkout DE copy (F2f / K6)', () => {
  test.beforeEach(async ({ page }) => {
    await seedDeCart(page);
    await page.goto('/guest-checkout');
    await page.waitForLoadState('domcontentloaded');
    await dismissCookieBanner(page);
  });

  test('loads without ErrorBoundary and shows EU-friendly contact fields', async ({ page }) => {
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);

    // Contact section for guests
    await expect(page.getByText(/Contact Information/i).first()).toBeVisible({ timeout: 15000 });

    // Phone: DE-friendly placeholder (not India-only)
    const phone = page.locator('input[name="phone"]').first();
    await expect(phone).toBeVisible();
    const phonePh = await phone.getAttribute('placeholder');
    expect(phonePh ?? '').toMatch(/\+49|phone/i);
    expect(phonePh ?? '').not.toMatch(/10-digit mobile/i);

    await phone.fill('12345');
    const submit = page.locator('button[type="submit"]').first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click({ force: true });
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/10-digit Indian/i);
    expect(bodyText).not.toMatch(/Indian mobile/i);
  });

  test('postal field uses DE PLZ copy, not 6-digit PIN only', async ({ page }) => {
    await expect(page.getByText(/Delivery Address|Contact Information/i).first()).toBeVisible({
      timeout: 15000,
    });

    const zip = page.locator('input[name="zipCode"]').first();
    await expect(zip).toBeVisible();
    const ph = (await zip.getAttribute('placeholder')) ?? '';
    expect(ph).toBe('10115');
    expect(ph).not.toMatch(/6-digit PIN/i);

    await expect(page.getByText(/Postal Code \(PLZ\)|Postal/i).first()).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test('payment success and failed result pages load (dark-premium shell)', async ({ page }) => {
    await page.goto('/payment/success');
    await dismissCookieBanner(page);
    await expect(page.getByText(/Payment successful|Verifying payment/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);

    await page.goto('/payment/failed');
    await dismissCookieBanner(page);
    await expect(page.getByRole('heading', { name: /Payment failed/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });
});
