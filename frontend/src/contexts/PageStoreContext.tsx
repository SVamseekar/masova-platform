import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { getTabStore, setTabStore, clearTabStore } from '../utils/tabStorage';
import { PageStoreContext, type PageStoreContextType } from './pageStoreContext.shared';

interface PageStoreProviderProps {
  children: ReactNode;
  contextKey: string;
}

export const PageStoreProvider: React.FC<PageStoreProviderProps> = ({ children, contextKey }) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => {
    const stored = getTabStore(contextKey);
    return stored ? stored.storeId : null;
  });

  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(() => {
    const stored = getTabStore(contextKey);
    return stored ? stored.storeName : null;
  });

  const selectedStoreIdRef = useRef(selectedStoreId);
  const selectedStoreNameRef = useRef(selectedStoreName);

  useEffect(() => {
    selectedStoreIdRef.current = selectedStoreId;
  }, [selectedStoreId]);

  useEffect(() => {
    selectedStoreNameRef.current = selectedStoreName;
  }, [selectedStoreName]);

  // Listen for storage changes (when StoreSelector updates tabStorage)
  useEffect(() => {
    const checkStorage = () => {
      const stored = getTabStore(contextKey);
      if (stored) {
        if (
          stored.storeId !== selectedStoreIdRef.current ||
          stored.storeName !== selectedStoreNameRef.current
        ) {
          setSelectedStoreId(stored.storeId);
          setSelectedStoreName(stored.storeName);
        }
      }
    };

    const interval = setInterval(checkStorage, 100);
    return () => clearInterval(interval);
  }, [contextKey]);

  const setStore = (storeId: string, storeName: string) => {
    setSelectedStoreId(storeId);
    setSelectedStoreName(storeName);
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