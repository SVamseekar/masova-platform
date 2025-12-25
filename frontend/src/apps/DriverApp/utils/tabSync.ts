/**
 * Tab Synchronization Utility
 * Synchronizes driver state (online status, GPS location) across multiple tabs
 */

type TabSyncEventType = 'DRIVER_STATUS_CHANGE' | 'GPS_LOCATION_UPDATE' | 'SESSION_CHANGE';

interface TabSyncEvent {
  type: TabSyncEventType;
  data: any;
  timestamp: number;
  tabId: string;
}

class TabSyncManager {
  private tabId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<TabSyncEventType, Set<(data: any) => void>> = new Map();
  private useLocalStorage: boolean = false;

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Try to use BroadcastChannel API (modern browsers)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('driver_app_sync');
        this.channel.onmessage = (event) => this.handleMessage(event.data);
        console.log('✅ TabSync: Using BroadcastChannel API');
      } catch (error) {
        console.warn('⚠️ TabSync: BroadcastChannel failed, falling back to localStorage');
        this.useLocalStorage = true;
        this.setupLocalStorageSync();
      }
    } else {
      // Fallback to localStorage events for older browsers
      console.log('ℹ️ TabSync: Using localStorage events (BroadcastChannel not available)');
      this.useLocalStorage = true;
      this.setupLocalStorageSync();
    }
  }

  private setupLocalStorageSync() {
    // Listen for storage events (fired when localStorage changes in other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'driver_app_sync_event' && event.newValue) {
        try {
          const syncEvent: TabSyncEvent = JSON.parse(event.newValue);
          // Ignore events from this tab
          if (syncEvent.tabId !== this.tabId) {
            this.handleMessage(syncEvent);
          }
        } catch (error) {
          console.error('TabSync: Failed to parse storage event', error);
        }
      }
    });
  }

  private handleMessage(event: TabSyncEvent) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event.data);
        } catch (error) {
          console.error('TabSync: Error in listener callback', error);
        }
      });
    }
  }

  /**
   * Broadcast an event to all other tabs
   */
  broadcast(type: TabSyncEventType, data: any) {
    const event: TabSyncEvent = {
      type,
      data,
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    if (this.channel && !this.useLocalStorage) {
      // Use BroadcastChannel
      this.channel.postMessage(event);
    } else {
      // Use localStorage
      // Store event and immediately remove to trigger storage event in other tabs
      localStorage.setItem('driver_app_sync_event', JSON.stringify(event));
      // Clear after a short delay to allow other tabs to read it
      setTimeout(() => {
        const current = localStorage.getItem('driver_app_sync_event');
        if (current) {
          const currentEvent = JSON.parse(current);
          if (currentEvent.tabId === this.tabId) {
            localStorage.removeItem('driver_app_sync_event');
          }
        }
      }, 100);
    }
  }

  /**
   * Subscribe to events from other tabs
   */
  on(type: TabSyncEventType, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Cleanup on unmount
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }

  /**
   * Get this tab's unique ID
   */
  getTabId(): string {
    return this.tabId;
  }
}

// Singleton instance
let tabSyncInstance: TabSyncManager | null = null;

export const getTabSync = (): TabSyncManager => {
  if (!tabSyncInstance) {
    tabSyncInstance = new TabSyncManager();
  }
  return tabSyncInstance;
};

export const destroyTabSync = () => {
  if (tabSyncInstance) {
    tabSyncInstance.destroy();
    tabSyncInstance = null;
  }
};

export default getTabSync;
