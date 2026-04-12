import { describe, it, expect, beforeAll } from 'vitest';
import i18n, { applyStoreLocale, SUPPORTED_LOCALES } from './index';

beforeAll(async () => {
  // Wait for i18next to finish initialising (it may be async)
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => {
      i18n.on('initialized', resolve);
    });
  }
});

describe('i18n initializer', () => {
  it('loads English translations', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('cart.delivery_fee')).toBe('Delivery fee');
    expect(i18n.t('cart.total')).toBe('Total');
  });

  it('loads German translations', async () => {
    await i18n.changeLanguage('de');
    expect(i18n.t('cart.delivery_fee')).toBe('Liefergebühr');
    expect(i18n.t('cart.total')).toBe('Gesamt');
    await i18n.changeLanguage('en');
  });

  it('loads French translations', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('cart.delivery_fee')).toBe('Frais de livraison');
    await i18n.changeLanguage('en');
  });

  it('loads Italian translations', async () => {
    await i18n.changeLanguage('it');
    expect(i18n.t('cart.total')).toBe('Totale');
    await i18n.changeLanguage('en');
  });

  it('loads Dutch translations', async () => {
    await i18n.changeLanguage('nl');
    expect(i18n.t('cart.delivery_fee')).toBe('Bezorgkosten');
    await i18n.changeLanguage('en');
  });

  it('loads Hungarian translations', async () => {
    await i18n.changeLanguage('hu');
    expect(i18n.t('cart.total')).toBe('Összesen');
    await i18n.changeLanguage('en');
  });

  it('falls back to English for unsupported locale', async () => {
    await i18n.changeLanguage('en');
    applyStoreLocale('xx-XX'); // unsupported — no-op
    expect(i18n.t('cart.total')).toBe('Total');
  });

  it('applyStoreLocale extracts language tag from BCP-47 string', async () => {
    applyStoreLocale('de-DE');
    // allow changeLanguage to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(i18n.language).toBe('de');
    await i18n.changeLanguage('en');
  });

  it('SUPPORTED_LOCALES contains all 7 languages', () => {
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('de');
    expect(SUPPORTED_LOCALES).toContain('fr');
    expect(SUPPORTED_LOCALES).toContain('it');
    expect(SUPPORTED_LOCALES).toContain('nl');
    expect(SUPPORTED_LOCALES).toContain('hu');
    expect(SUPPORTED_LOCALES).toContain('lb');
  });
});
