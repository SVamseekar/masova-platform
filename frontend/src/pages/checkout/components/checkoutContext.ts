import { useEffect } from 'react';
import { useGetActiveStoresQuery } from '../../../store/api/storeApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { cartConfigurationKey, type CartItem, selectCartItems, selectSelectedStoreId, setStoreCurrency } from '../../../store/slices/cartSlice';
import { browseStoreId } from '../../../apps/PublicWebsite/components/useBrowseMenu';
import { resolveStoreMarket, storeCurrencyPayload } from '../../../utils/storeCurrency';

export type CheckoutOrderType = 'DELIVERY' | 'TAKEAWAY';
export interface CheckoutGuestInfo {
  name: string; email: string; phone: string;
  street: string; city: string; state: string; pincode: string;
  latitude?: number; longitude?: number; deliveryInstructions?: string;
}
export interface CheckoutHandoff {
  guestInfo: CheckoutGuestInfo;
  orderType: CheckoutOrderType;
  checkoutStoreId: string;
  checkoutUserId: string | null;
  cartConfiguration: string;
}
export const checkoutCartConfiguration = (items: CartItem[]) => JSON.stringify(items.map(item => [cartConfigurationKey(item), item.quantity]));

export function useCheckoutStore() {
  const storeId = useAppSelector(selectSelectedStoreId);
  const items = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();
  const stores = useGetActiveStoresQuery();
  const store = stores.data?.find(candidate => browseStoreId(candidate) === storeId || candidate.id === storeId);
  const market = resolveStoreMarket(store);
  const ready = !!store && store.status === 'ACTIVE' && market.resolved && !stores.isError && store.operatingConfig?.acceptsOnlineOrders !== false;
  useEffect(() => {
    if (ready) dispatch(setStoreCurrency(storeCurrencyPayload(store)));
  }, [dispatch, ready, store]);
  return { storeId, store, market, stores, ready, items, configuration: checkoutCartConfiguration(items) };
}
