import { describe, it, expect, vi, beforeEach } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  removeItemCompletely,
  updateItemQuantity,
  clearCart,
  calculateTotals,
  setLoading,
  setSelectedStore,
  clearSelectedStore,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectCartSubtotal,
  selectDeliveryFee,
  selectSelectedStoreId,
  selectSelectedStoreName,
} from './cartSlice';

describe('cartSlice', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => {});
  });

  const emptyState = {
    items: [],
    total: 0,
    itemCount: 0,
    deliveryFee: 29,
    isLoading: false,
    selectedStoreId: null,
    selectedStoreName: null,
  };

  const stateWithItems = {
    ...emptyState,
    items: [
      { id: '1', name: 'Pizza', price: 200, quantity: 2 },
      { id: '2', name: 'Burger', price: 150, quantity: 1 },
    ],
    total: 579, // (200*2 + 150*1) + 29 delivery
    itemCount: 3,
  };

  describe('addToCart', () => {
    it('adds a new item with default quantity of 1', () => {
      const state = cartReducer(
        emptyState,
        addToCart({ id: '1', name: 'Pizza', price: 200 })
      );

      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1);
      expect(state.itemCount).toBe(1);
    });

    it('adds a new item with specified quantity', () => {
      const state = cartReducer(
        emptyState,
        addToCart({ id: '1', name: 'Pizza', price: 200, quantity: 3 })
      );

      expect(state.items[0].quantity).toBe(3);
      expect(state.itemCount).toBe(3);
    });

    it('increments quantity for existing item', () => {
      const stateWithOne = {
        ...emptyState,
        items: [{ id: '1', name: 'Pizza', price: 200, quantity: 1 }],
        itemCount: 1,
      };

      const state = cartReducer(
        stateWithOne,
        addToCart({ id: '1', name: 'Pizza', price: 200 })
      );

      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('updates total including delivery fee', () => {
      const state = cartReducer(
        emptyState,
        addToCart({ id: '1', name: 'Pizza', price: 200 })
      );

      expect(state.total).toBe(200 + 29); // price + delivery fee
    });

    it('saves to localStorage after adding', () => {
      cartReducer(
        emptyState,
        addToCart({ id: '1', name: 'Pizza', price: 100 })
      );

      expect(localStorage.setItem).toHaveBeenCalledWith('cart', expect.any(String));
    });
  });

  describe('removeFromCart', () => {
    it('decrements quantity when item has more than 1', () => {
      const state = cartReducer(stateWithItems, removeFromCart('1'));

      const pizza = state.items.find(i => i.id === '1');
      expect(pizza?.quantity).toBe(1);
    });

    it('removes item completely when quantity reaches 0', () => {
      const singleItemState = {
        ...emptyState,
        items: [{ id: '1', name: 'Pizza', price: 200, quantity: 1 }],
        itemCount: 1,
      };

      const state = cartReducer(singleItemState, removeFromCart('1'));
      expect(state.items).toHaveLength(0);
    });

    it('does nothing for non-existent item id', () => {
      const state = cartReducer(stateWithItems, removeFromCart('999'));
      expect(state.items).toHaveLength(2);
    });
  });

  describe('removeItemCompletely', () => {
    it('removes item regardless of quantity', () => {
      const state = cartReducer(stateWithItems, removeItemCompletely('1'));

      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('2');
    });

    it('updates totals after removal', () => {
      const state = cartReducer(stateWithItems, removeItemCompletely('1'));

      expect(state.itemCount).toBe(1);
      expect(state.total).toBe(150 + 29); // burger + delivery
    });
  });

  describe('updateItemQuantity', () => {
    it('updates item quantity to specified value', () => {
      const state = cartReducer(
        stateWithItems,
        updateItemQuantity({ id: '1', quantity: 5 })
      );

      const pizza = state.items.find(i => i.id === '1');
      expect(pizza?.quantity).toBe(5);
    });

    it('removes item when quantity is set to 0', () => {
      const state = cartReducer(
        stateWithItems,
        updateItemQuantity({ id: '1', quantity: 0 })
      );

      expect(state.items.find(i => i.id === '1')).toBeUndefined();
    });

    it('removes item when quantity is set to negative', () => {
      const state = cartReducer(
        stateWithItems,
        updateItemQuantity({ id: '1', quantity: -1 })
      );

      expect(state.items.find(i => i.id === '1')).toBeUndefined();
    });
  });

  describe('clearCart', () => {
    it('removes all items and resets totals', () => {
      const state = cartReducer(stateWithItems, clearCart());

      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
    });

    it('saves empty cart to localStorage', () => {
      cartReducer(stateWithItems, clearCart());
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('calculateTotals', () => {
    it('calculates item count and total correctly', () => {
      const stateWithDirtyTotals = {
        ...stateWithItems,
        total: 0,
        itemCount: 0,
      };

      const state = cartReducer(stateWithDirtyTotals, calculateTotals());

      expect(state.itemCount).toBe(3); // 2 pizza + 1 burger
      // subtotal = 200*2 + 150*1 = 550, delivery = 29
      expect(state.total).toBe(579);
    });

    it('does not add delivery fee when cart is empty', () => {
      const state = cartReducer(emptyState, calculateTotals());
      expect(state.total).toBe(0);
    });
  });

  describe('setLoading', () => {
    it('sets loading state', () => {
      const state = cartReducer(emptyState, setLoading(true));
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setSelectedStore', () => {
    it('sets store id and name', () => {
      const state = cartReducer(
        emptyState,
        setSelectedStore({ storeId: '1', storeName: 'Main Branch' })
      );

      expect(state.selectedStoreId).toBe('1');
      expect(state.selectedStoreName).toBe('Main Branch');
    });
  });

  describe('clearSelectedStore', () => {
    it('clears store selection', () => {
      const stateWithStore = {
        ...emptyState,
        selectedStoreId: '1',
        selectedStoreName: 'Main Branch',
      };

      const state = cartReducer(stateWithStore, clearSelectedStore());
      expect(state.selectedStoreId).toBeNull();
      expect(state.selectedStoreName).toBeNull();
    });
  });

  describe('selectors', () => {
    const rootState = { cart: stateWithItems };

    it('selectCartItems returns items', () => {
      expect(selectCartItems(rootState)).toEqual(stateWithItems.items);
    });

    it('selectCartTotal returns total', () => {
      expect(selectCartTotal(rootState)).toBe(579);
    });

    it('selectCartItemCount returns item count', () => {
      expect(selectCartItemCount(rootState)).toBe(3);
    });

    it('selectCartSubtotal returns subtotal without delivery fee', () => {
      expect(selectCartSubtotal(rootState)).toBe(550);
    });

    it('selectDeliveryFee returns delivery fee', () => {
      expect(selectDeliveryFee(rootState)).toBe(29);
    });

    it('selectSelectedStoreId returns null by default', () => {
      expect(selectSelectedStoreId(rootState)).toBeNull();
    });

    it('selectSelectedStoreName returns null by default', () => {
      expect(selectSelectedStoreName(rootState)).toBeNull();
    });
  });
});
