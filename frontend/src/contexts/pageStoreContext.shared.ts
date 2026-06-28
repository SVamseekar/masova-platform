import { createContext } from 'react';

export interface PageStoreContextType {
  selectedStoreId: string | null;
  selectedStoreName: string | null;
  setStore: (storeId: string, storeName: string) => void;
  clearStore: () => void;
}

export const PageStoreContext = createContext<PageStoreContextType | undefined>(undefined);