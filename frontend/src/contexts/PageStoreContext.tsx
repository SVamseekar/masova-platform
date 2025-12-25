import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTabStore, setTabStore, clearTabStore, clearAllTabStores } from '../utils/tabStorage';

interface PageStoreContextType {
  selectedStoreId: string | null;
  selectedStoreName: string | null;
  setStore: (storeId: string, storeName: string) => void;
  clearStore: () => void;
}

const PageStoreContext = createContext<PageStoreContextType | undefined>(undefined);

interface PageStoreProviderProps {
  children: ReactNode;
  contextKey: string;
}

export const PageStoreProvider: React.FC<PageStoreProviderProps> = ({ children, contextKey }) => {
  // Initialize state from tab-specific storage
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => {
    const stored = getTabStore(contextKey);
    return stored ? stored.storeId : null;
  });

  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(() => {
    const stored = getTabStore(contextKey);
    return stored ? stored.storeName : null;
  });

  // Listen for storage changes (when StoreSelector updates tabStorage)
  useEffect(() => {
    let lastStoreId = selectedStoreId;
    let lastStoreName = selectedStoreName;

    const checkStorage = () => {
      const stored = getTabStore(contextKey);
      if (stored) {
        if (stored.storeId !== lastStoreId || stored.storeName !== lastStoreName) {
          lastStoreId = stored.storeId;
          lastStoreName = stored.storeName;
          setSelectedStoreId(stored.storeId);
          setSelectedStoreName(stored.storeName);
        }
      }
    };

    // Check storage periodically (since we can't listen to sessionStorage events in same tab)
    const interval = setInterval(checkStorage, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [contextKey]); // Only depend on contextKey, not the state values

  const setStore = (storeId: string, storeName: string) => {
    setSelectedStoreId(storeId);
    setSelectedStoreName(storeName);

    // Persist to tab-specific storage
    setTabStore(contextKey, storeId, storeName);
  };

  const clearStore = () => {
    setSelectedStoreId(null);
    setSelectedStoreName(null);
    clearTabStore(contextKey);
  };

  const value: PageStoreContextType = {
    selectedStoreId,
    selectedStoreName,
    setStore,
    clearStore,
  };

  return (
    <PageStoreContext.Provider value={value}>
      {children}
    </PageStoreContext.Provider>
  );
};

export const usePageStore = (): PageStoreContextType => {
  const context = useContext(PageStoreContext);
  if (context === undefined) {
    throw new Error('usePageStore must be used within a PageStoreProvider');
  }
  return context;
};

// Utility function to clear all store contexts for current tab (used on logout)
export const clearAllStoreContexts = (): void => {
  clearAllTabStores();
};
