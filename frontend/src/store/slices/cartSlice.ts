import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: 'PIZZA' | 'SIDES' | 'DRINKS';
  toppings?: string[];
  size?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  deliveryFee: number;
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  deliveryFee: 29, // Fixed delivery fee in INR
  isLoading: false,
};

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
    },
    
    removeItemCompletely: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
      cartSlice.caseReducers.calculateTotals(state);
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
    },
    
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },
    
    calculateTotals: (state) => {
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      const subtotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      state.total = subtotal + (state.itemCount > 0 ? state.deliveryFee : 0);
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
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
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartItemCount = (state: { cart: CartState }) => state.cart.itemCount;
export const selectCartSubtotal = (state: { cart: CartState }) => 
  state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectDeliveryFee = (state: { cart: CartState }) => state.cart.deliveryFee;

export default cartSlice.reducer;