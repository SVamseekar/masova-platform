import { clearAllTabStores } from '../utils/tabStorage';

/** Clear all store contexts for current tab (used on logout) */
export const clearAllStoreContexts = (): void => {
  clearAllTabStores();
};