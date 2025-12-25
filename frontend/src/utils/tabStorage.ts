/**
 * Tab-Specific Storage Utility
 *
 * Provides tab-specific storage using sessionStorage with unique tab IDs.
 * Each browser tab gets its own isolated storage namespace, preventing
 * store selections from bleeding across tabs.
 *
 * Problem Solved:
 * - sessionStorage is shared across all tabs in the same browser session
 * - When Tab 1 selects Store A, Tab 2 would also show Store A
 *
 * Solution:
 * - Generate a unique tab ID for each tab
 * - Append tab ID to all storage keys
 * - Each tab now has independent storage
 */

const TAB_ID_KEY = 'current_tab_id';

/**
 * Get or create a unique ID for the current browser tab
 *
 * @returns Unique tab identifier (e.g., "tab_1734567890_abc123def")
 */
export function getTabId(): string {
  // Check if current tab already has an ID
  let tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    // Generate new unique ID for this tab
    // Format: tab_{timestamp}_{random}
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    tabId = `tab_${timestamp}_${random}`;

    sessionStorage.setItem(TAB_ID_KEY, tabId);
    console.log(`[TabStorage] New tab initialized with ID: ${tabId}`);
  }

  return tabId;
}

/**
 * Save store selection for the current tab only
 *
 * @param contextKey - Context identifier (e.g., "dashboard", "inventory")
 * @param storeId - Store ID to save
 * @param storeName - Store name to save (optional)
 */
export function setTabStore(contextKey: string, storeId: string, storeName?: string): void {
  try {
    const tabId = getTabId();
    const key = `store_context_${contextKey}_${tabId}`;

    const data = {
      storeId,
      storeName: storeName || null,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[TabStorage] Failed to save store:', error);
  }
}

/**
 * Get store selection for the current tab only
 *
 * @param contextKey - Context identifier (e.g., "dashboard", "inventory")
 * @returns Store data or null if not found
 */
export function getTabStore(contextKey: string): { storeId: string; storeName: string | null } | null {
  try {
    const tabId = getTabId();
    const key = `store_context_${contextKey}_${tabId}`;

    const stored = sessionStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);
    return data;
  } catch (error) {
    console.error('[TabStorage] Failed to retrieve store:', error);
    return null;
  }
}

/**
 * Clear store selection for a specific context in the current tab
 *
 * @param contextKey - Context identifier to clear
 */
export function clearTabStore(contextKey: string): void {
  try {
    const tabId = getTabId();
    const key = `store_context_${contextKey}_${tabId}`;
    sessionStorage.removeItem(key);
    console.log(`[TabStorage] Cleared store for context "${contextKey}" in tab ${tabId}`);
  } catch (error) {
    console.error('[TabStorage] Failed to clear store:', error);
  }
}

/**
 * Clear all store contexts for the current tab
 * Called on logout to clean up current tab's data
 */
export function clearAllTabStores(): void {
  try {
    const tabId = getTabId();
    const allKeys = Object.keys(sessionStorage);

    let clearedCount = 0;
    allKeys.forEach((key) => {
      if (key.startsWith('store_context_') && key.endsWith(`_${tabId}`)) {
        sessionStorage.removeItem(key);
        clearedCount++;
      }
    });

    console.log(`[TabStorage] Cleared ${clearedCount} store contexts for tab ${tabId}`);
  } catch (error) {
    console.error('[TabStorage] Failed to clear all stores:', error);
  }
}

/**
 * Get all store contexts for the current tab
 * Useful for debugging
 *
 * @returns Array of context keys that have store data in this tab
 */
export function getTabStoreContexts(): string[] {
  try {
    const tabId = getTabId();
    const allKeys = Object.keys(sessionStorage);

    const contexts: string[] = [];
    allKeys.forEach((key) => {
      if (key.startsWith('store_context_') && key.endsWith(`_${tabId}`)) {
        // Extract context name from key: store_context_{contextName}_{tabId}
        const contextName = key.replace('store_context_', '').replace(`_${tabId}`, '');
        contexts.push(contextName);
      }
    });

    return contexts;
  } catch (error) {
    console.error('[TabStorage] Failed to get contexts:', error);
    return [];
  }
}

/**
 * Optional: Clean up stale data from closed tabs
 * This is optional since sessionStorage auto-clears when browser closes
 * Can be called periodically or on app initialization
 */
export function cleanupStaleTabs(): void {
  try {
    const currentTabId = getTabId();
    const allKeys = Object.keys(sessionStorage);

    let cleanedCount = 0;
    allKeys.forEach((key) => {
      // Find store_context keys for other tabs
      if (key.startsWith('store_context_') && !key.endsWith(`_${currentTabId}`)) {
        // Extract tab ID from key
        const matches = key.match(/store_context_.*_(tab_\d+_\w+)$/);
        if (matches && matches[1] !== currentTabId) {
          // This is data from another tab - we can't determine if it's still open
          // For safety, we'll leave it alone. It will auto-clear when browser closes.
          // If you want aggressive cleanup, uncomment the line below:
          // sessionStorage.removeItem(key);
          // cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      console.log(`[TabStorage] Cleaned up ${cleanedCount} stale tab entries`);
    }
  } catch (error) {
    console.error('[TabStorage] Failed to cleanup stale tabs:', error);
  }
}
