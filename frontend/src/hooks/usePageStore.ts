import { useContext } from 'react';
import { PageStoreContext, type PageStoreContextType } from '../contexts/pageStoreContext.shared';

export const usePageStore = (): PageStoreContextType => {
  const context = useContext(PageStoreContext);
  if (context === undefined) {
    throw new Error('usePageStore must be used within a PageStoreProvider');
  }
  return context;
};