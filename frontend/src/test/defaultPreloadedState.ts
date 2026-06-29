import type { PreloadedState } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';

/** Cart defaults matching cartSlice initial state — required for formatMoney in tests. */
export const defaultCartPreload: RootState['cart'] = {
  items: [],
  total: 0,
  itemCount: 0,
  deliveryFee: 0,
  isLoading: false,
  selectedStoreId: null,
  selectedStoreName: null,
  currency: 'INR',
  locale: 'en-IN',
};

export function mergePreloadedState(
  partial?: PreloadedState<RootState>
): PreloadedState<RootState> {
  if (!partial) return { cart: defaultCartPreload };
  return {
    ...partial,
    cart: { ...defaultCartPreload, ...partial.cart },
  };
}