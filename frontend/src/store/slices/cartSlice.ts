import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  toppings?: string[];
  size?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  deliveryFee: number;
  isLoading: boolean;
  selectedStoreId: string | null;
  selectedStoreName: string | null;
}

// Load cart from localStorage
const loadCartFromStorage = (): CartState => {
  try {
    const cartStr = localStorage.getItem('cart');
    if (cartStr) {
      const savedCart = JSON.parse(cartStr);
      return {
        items: savedCart.items || [],
        total: savedCart.total || 0,
        itemCount: savedCart.itemCount || 0,
        deliveryFee: 0, // Set dynamically when delivery address is entered
        isLoading: false,
        selectedStoreId: savedCart.selectedStoreId || null,
        selectedStoreName: savedCart.selectedStoreName || null,
      };
    }
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
  }
  return {
    items: [],
    total: 0,
    itemCount: 0,
    deliveryFee: 0,
    isLoading: false,
    selectedStoreId: null,
    selectedStoreName: null,
  };
};

// Save cart to localStorage
const saveCartToStorage = (state: CartState) => {
  try {
    localStorage.setItem('cart', JSON.stringify({
      items: state.items,
      total: state.total,
      itemCount: state.itemCount,
      selectedStoreId: state.selectedStoreId,
      selectedStoreName: state.selectedStoreName,
    }));
  } catch (e) {
    console.error('Failed to save cart to localStorage:', e);
  }
};

const initialState: CartState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) => {
      const { quantity = 1, ...item } = action.payload;
      const existingItem = state.items.find(i => i.id === item.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ ...item, quantity });
      }

      cartSlice.caseReducers.calculateTotals(state);
      saveCartToStorage(state);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItem = state.items.find(i => i.id === itemId);

      if (existingItem) {
        if (existingItem.quantity > 1) {
          existingItem.quantity -= 1;
        } else {
          state.items = state.items.filter(i => i.id !== itemId);
        }
      }

      cartSlice.caseReducers.calculateTotals(state);
      saveCartToStorage(state);
    },

    removeItemCompletely: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
      cartSlice.caseReducers.calculateTotals(state);
      saveCartToStorage(state);
    },

    updateItemQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const existingItem = state.items.find(i => i.id === id);

      if (existingItem) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        } else {
          existingItem.quantity = quantity;
        }
      }

      cartSlice.caseReducers.calculateTotals(state);
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      saveCartToStorage(state);
    },

    calculateTotals: (state) => {
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      const subtotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      state.total = subtotal + (state.itemCount > 0 ? state.deliveryFee : 0);
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setDeliveryFee: (state, action: PayloadAction<number>) => {
      state.deliveryFee = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },

    setSelectedStore: (state, action: PayloadAction<{ storeId: string; storeName: string }>) => {
      state.selectedStoreId = action.payload.storeId;
      state.selectedStoreName = action.payload.storeName;
      saveCartToStorage(state);
    },

    clearSelectedStore: (state) => {
      state.selectedStoreId = null;
      state.selectedStoreName = null;
      saveCartToStorage(state);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  removeItemCompletely,
  updateItemQuantity,
  clearCart,
  calculateTotals,
  setLoading,
  setDeliveryFee,
  setSelectedStore,
  clearSelectedStore,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartItemCount = (state: { cart: CartState }) => state.cart.itemCount;
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectDeliveryFee = (state: { cart: CartState }) => state.cart.deliveryFee;
export const selectDeliveryFeeINR = (state: { cart: CartState }) => state.cart.deliveryFee;
export const selectSelectedStoreId = (state: { cart: CartState }) => state.cart.selectedStoreId;
export const selectSelectedStoreName = (state: { cart: CartState }) => state.cart.selectedStoreName;

export default cartSlice.reducer;