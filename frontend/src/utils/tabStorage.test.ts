import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTabId,
  setTabStore,
  getTabStore,
  clearTabStore,
  clearAllTabStores,
  getTabStoreContexts,
  cleanupStaleTabs,
} from './tabStorage';

describe('tabStorage', () => {
  // Use a real Map-based storage for these tests since the behavior
  // depends on reading back values that were written
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};

    vi.mocked(sessionStorage.getItem).mockImplementation((key: string) => {
      return store[key] ?? null;
    });

    vi.mocked(sessionStorage.setItem).mockImplementation((key: string, value: string) => {
      store[key] = value;
    });

    vi.mocked(sessionStorage.removeItem).mockImplementation((key: string) => {
      delete store[key];
    });

    // Reset tab ID between tests
    delete store['current_tab_id'];
  });

  describe('getTabId', () => {
    it('creates a new tab ID when none exists', () => {
      const tabId = getTabId();
      expect(tabId).toMatch(/^tab_\d+_[a-z0-9]+$/);
    });

    it('returns the same tab ID on subsequent calls', () => {
      const first = getTabId();
      const second = getTabId();
      expect(first).toBe(second);
    });
  });

  describe('setTabStore and getTabStore', () => {
    it('saves and retrieves store data for a context', () => {
      setTabStore('dashboard', '123', 'Main Store');
      const result = getTabStore('dashboard');

      expect(result).not.toBeNull();
      expect(result!.storeId).toBe('123');
      expect(result!.storeName).toBe('Main Store');
    });

    it('returns null for a context that has not been set', () => {
      const result = getTabStore('nonexistent');
      expect(result).toBeNull();
    });

    it('stores storeName as null when not provided', () => {
      setTabStore('inventory', '456');
      const result = getTabStore('inventory');

      expect(result).not.toBeNull();
      expect(result!.storeId).toBe('456');
      expect(result!.storeName).toBeNull();
    });

    it('overwrites previous value for the same context', () => {
      setTabStore('dashboard', '111', 'Store A');
      setTabStore('dashboard', '222', 'Store B');

      const result = getTabStore('dashboard');
      expect(result!.storeId).toBe('222');
      expect(result!.storeName).toBe('Store B');
    });
  });

  describe('clearTabStore', () => {
    it('clears store data for a specific context', () => {
      setTabStore('dashboard', '123', 'Main');
      clearTabStore('dashboard');

      const result = getTabStore('dashboard');
      expect(result).toBeNull();
    });

    it('does not affect other contexts', () => {
      setTabStore('dashboard', '123');
      setTabStore('inventory', '456');

      clearTabStore('dashboard');

      expect(getTabStore('dashboard')).toBeNull();
      expect(getTabStore('inventory')).not.toBeNull();
    });
  });

  describe('clearAllTabStores', () => {
    it('clears all store contexts for the current tab', () => {
      setTabStore('dashboard', '123');
      setTabStore('inventory', '456');

      // Mock Object.keys to return our store keys
      const originalKeys = Object.keys;
      vi.spyOn(Object, 'keys').mockImplementation((obj) => {
        if (obj === sessionStorage) {
          return originalKeys(store);
        }
        return originalKeys(obj as object);
      });

      clearAllTabStores();

      expect(getTabStore('dashboard')).toBeNull();
      expect(getTabStore('inventory')).toBeNull();

      vi.mocked(Object.keys).mockRestore();
    });
  });

  describe('getTabStoreContexts', () => {
    it('returns empty array when no contexts exist', () => {
      vi.spyOn(Object, 'keys').mockImplementation((obj) => {
        if (obj === sessionStorage) return [];
        return Object.keys(obj as object);
      });

      const contexts = getTabStoreContexts();
      expect(contexts).toEqual([]);

      vi.mocked(Object.keys).mockRestore();
    });

    it('returns context names for the current tab', () => {
      setTabStore('dashboard', '123');
      setTabStore('inventory', '456');

      const tabId = getTabId();
      const keys = Object.keys(store).filter(
        k => k.startsWith('store_context_') && k.endsWith(`_${tabId}`)
      );

      const originalKeys = Object.keys;
      vi.spyOn(Object, 'keys').mockImplementation((obj) => {
        if (obj === sessionStorage) return keys;
        return originalKeys(obj as object);
      });

      const contexts = getTabStoreContexts();
      expect(contexts).toContain('dashboard');
      expect(contexts).toContain('inventory');

      vi.mocked(Object.keys).mockRestore();
    });
  });

  describe('cleanupStaleTabs', () => {
    it('runs without errors', () => {
      vi.spyOn(Object, 'keys').mockImplementation((obj) => {
        if (obj === sessionStorage) return [];
        return Object.keys(obj as object);
      });

      expect(() => cleanupStaleTabs()).not.toThrow();

      vi.mocked(Object.keys).mockRestore();
    });
  });

  describe('error handling', () => {
    it('getTabStore returns null on parse error', () => {
      const tabId = getTabId();
      store[`store_context_bad_${tabId}`] = 'not-json';

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = getTabStore('bad');
      expect(result).toBeNull();
      errorSpy.mockRestore();
    });

    it('setTabStore handles storage errors gracefully', () => {
      vi.mocked(sessionStorage.setItem).mockImplementation((key: string) => {
        if (key.startsWith('store_context_')) {
          throw new Error('Storage full');
        }
        store[key] = '';
      });

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => setTabStore('dashboard', '123')).not.toThrow();

      errorSpy.mockRestore();
    });
  });
});
