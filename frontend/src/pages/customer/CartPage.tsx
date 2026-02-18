import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeFromCart, updateItemQuantity } from '../../store/slices/cartSlice';

interface CartPageProps {
  onContinueShopping: () => void;
  onProceedToPayment: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ onContinueShopping, onProceedToPayment }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 29 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  const handleRemove = (id: string) => dispatch(removeFromCart(id));

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
          <div style={{ fontSize: '5rem', marginBottom: '20px', opacity: 0.4 }}>🛒</div>
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
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--text-1)', margin: '0 0 4px 0' }}>
          Your Cart
        </h2>
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
                {/* Thumbnail */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '10px',
                  background: 'var(--surface-2)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                }}>
                  🍽️
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
