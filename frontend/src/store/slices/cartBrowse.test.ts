import { describe, expect, it, vi } from 'vitest';
import reducer, { addToCart, cartLineKey, clearCart, removeFromCart, removeItemCompletely, setSelectedStore, updateItemQuantity } from './cartSlice';

describe('customer browse cart isolation', () => {
  const initial = () => reducer(reducer(undefined, clearCart()), setSelectedStore({ storeId: 'BERLIN', storeName: 'Berlin' }));
  it('keeps differently configured versions of the same dish separate', () => {
    let state = initial();
    state = reducer(state, addToCart({ id: 'pizza', name: 'Pizza', price: 12, variant: 'Regular' }));
    state = reducer(state, addToCart({ id: 'pizza', name: 'Pizza', price: 16, variant: 'Large', customizations: ['Olives'] }));
    expect(state.items).toHaveLength(2);
    expect(state.items.map(item => item.id)).toEqual(['pizza', 'pizza']);
    expect(state.items.map(item => item.price)).toEqual([12, 16]);
  });
  it('merges identical configurations independently of modifier order', () => {
    let state = initial();
    state = reducer(state, addToCart({ id: 'pizza', name: 'Pizza', price: 14, customizations: ['Olives', 'Basil'] }));
    state = reducer(state, addToCart({ id: 'pizza', name: 'Pizza', price: 14, customizations: ['Basil', 'Olives'], quantity: 2 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
  });
  it('clears items when switching stores even within one currency', () => {
    let state = reducer(initial(), addToCart({ id: 'pizza', name: 'Pizza', price: 12 }));
    state = reducer(state, setSelectedStore({ storeId: 'OTHER', storeName: 'Other store' }));
    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.itemCount).toBe(0);
  });
  it('preserves items when selecting the same store again', () => {
    let state = reducer(initial(), addToCart({ id: 'pizza', name: 'Pizza', price: 12 }));
    state = reducer(state, setSelectedStore({ storeId: 'BERLIN', storeName: 'Berlin' }));
    expect(state.items).toHaveLength(1);
  });
  it('gives changed bare prices independent keys and mutations', () => {
    let state = reducer(initial(), addToCart({ id: 'pizza', name: 'Pizza', price: 12, quantity: 2 }));
    state = reducer(state, addToCart({ id: 'pizza', name: 'Pizza', price: 13 }));
    const [oldKey, newKey] = state.items.map(cartLineKey);
    expect(oldKey).not.toBe(newKey);
    state = reducer(state, updateItemQuantity({ id: newKey, quantity: 3 }));
    expect(state.items.map(item => item.quantity)).toEqual([2, 3]);
    state = reducer(state, removeFromCart(oldKey));
    expect(state.items.map(item => item.quantity)).toEqual([1, 3]);
    state = reducer(state, removeItemCompletely(oldKey));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].price).toBe(13);
    expect(state.total).toBe(39);
  });
  it('repairs persisted duplicate bare keys on reload', async () => {
    vi.mocked(localStorage.getItem).mockReturnValueOnce(JSON.stringify({ items: [
      { id: 'pizza', name: 'Pizza', price: 12, quantity: 1 },
      { id: 'pizza', name: 'Pizza', price: 13, quantity: 2 },
    ] }));
    vi.resetModules();
    const { default: restoredReducer, cartLineKey: restoredKey } = await import('./cartSlice');
    const restored = restoredReducer(undefined, { type: 'init' });
    expect(new Set(restored.items.map(restoredKey)).size).toBe(2);
    expect(restored.items.map(item => item.price)).toEqual([12, 13]);
  });
});
