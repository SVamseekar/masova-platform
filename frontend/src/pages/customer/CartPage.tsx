import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeFromCart, updateItemQuantity, clearCart, selectDeliveryFee } from '../../store/slices/cartSlice';

interface CartPageProps {
  onContinueShopping: () => void;
  onProceedToPayment: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ onContinueShopping, onProceedToPayment }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const reduxDeliveryFee = useAppSelector(selectDeliveryFee);
  const deliveryFee = subtotal > 0 ? reduxDeliveryFee : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  const handleRemove = (id: string) => dispatch(removeFromCart(id));
  const handleClearAll = () => dispatch(clearCart());

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity > 0) dispatch(updateItemQuantity({ id, quantity }));
  };

  if (cartItems.length === 0) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        fontFamily: 'var(--font-body)',
        padding: '48px 24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', opacity: 0.5,
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>
            Your Cart is Empty
          </h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '28px' }}>
            Looks like you haven't added anything yet
          </p>
          <button
            onClick={onContinueShopping}
            style={{
              background: 'var(--red)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius-pill)', padding: '12px 28px',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Browse Menu →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', padding: '32px 24px', fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>
            Your Cart
          </h2>
          <button
            onClick={handleClearAll}
            style={{
              background: 'rgba(198,42,9,0.08)', border: '1px solid rgba(198,42,9,0.25)',
              color: 'var(--red-light)', fontFamily: 'var(--font-body)',
              fontWeight: 600, fontSize: '0.8rem', padding: '6px 14px',
              borderRadius: 'var(--radius-pill)', cursor: 'pointer', transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(198,42,9,0.15)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(198,42,9,0.08)'; }}
          >
            Clear All
          </button>
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: '0 0 32px 0' }}>
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                {/* Plate thumbnail */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 32%, rgba(212,168,67,0.25) 0%, rgba(212,168,67,0.05) 50%, transparent 100%)',
                  border: '1px solid rgba(212,168,67,0.2)',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/>
                    <line x1="10" y1="1" x2="10" y2="4"/>
                    <line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                </div>

                {/* Name + price */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)' }}>
                    ₹{item.price.toFixed(2)} each
                  </p>
                </div>

                {/* Qty controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-1)', fontWeight: 700, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                      opacity: item.quantity <= 1 ? 0.4 : 1,
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'var(--red)', border: 'none',
                      color: '#fff', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleRemove(item.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-3)',
                    cursor: 'pointer', fontSize: '1.1rem', padding: '4px', flexShrink: 0,
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--red-light)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ position: 'sticky', top: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 16px 0' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}` },
                { label: 'Delivery Fee', value: `₹${deliveryFee.toFixed(2)}` },
                { label: 'Tax (5%)', value: `₹${tax.toFixed(2)}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{row.label}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-1)', fontSize: '1.05rem' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: '1.35rem' }}>₹{total.toFixed(2)}</span>
            </div>

            <button
              onClick={onProceedToPayment}
              style={{
                width: '100%', background: 'var(--red)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-pill)', padding: '13px',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer', marginBottom: '10px', transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
            >
              Proceed to Payment →
            </button>

            <button
              onClick={onContinueShopping}
              style={{
                width: '100%', background: 'transparent', color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '11px',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
