import { useEffect, useState } from 'react';
import { useGetActiveStoresQuery, type Store } from '../../../store/api/storeApi';
import { useGetAvailableMenuQuery } from '../../../store/api/menuApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectSelectedStoreId, setStoreCurrency } from '../../../store/slices/cartSlice';
import { resolveStoreMarket, storeCurrencyPayload } from '../../../utils/storeCurrency';

export const browseStoreId = (store: Store) => store.storeCode || store.id;

export function useBrowseMenu() {
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const dispatch = useAppDispatch();
  const stores = useGetActiveStoresQuery();
  const selectedStore = stores.data?.find(store => browseStoreId(store) === selectedStoreId || store.id === selectedStoreId);
  const market = resolveStoreMarket(selectedStore);
  const storeReady = !!selectedStore && selectedStore.status === 'ACTIVE' && market.resolved && !stores.isError;
  const menu = useGetAvailableMenuQuery(selectedStoreId || undefined, { skip: !storeReady });
  useEffect(() => {
    if (storeReady) dispatch(setStoreCurrency(storeCurrencyPayload(selectedStore)));
  }, [dispatch, selectedStore, storeReady]);
  // currentData belongs to this argument; cached data from another store must never render.
  const items = storeReady && !menu.isError ? (menu.currentData || []).filter(item =>
    !item.storeId || item.storeId === selectedStoreId || item.storeId === selectedStore.id
  ) : [];
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return { selectedStoreId, selectedStore, market, storeReady, stores, menu, items, online, canOrder: storeReady && selectedStore?.operatingConfig?.acceptsOnlineOrders !== false };
}
