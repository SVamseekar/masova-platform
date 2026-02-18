import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  removeFromCart,
  addToCart,
  removeItemCompletely,
  clearCart,
  selectCartItems,
  selectCartSubtotal,
  selectCartItemCount,
  selectDeliveryFee,
} from '../../store/slices/cartSlice';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose, onCheckout }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const deliveryFee = useAppSelector(selectDeliveryFee);

  const tax = subtotal * 0.05;
  const total = subtotal + (itemCount > 0 ? deliveryFee : 0) + tax;

  const handleIncreaseQuantity = (itemId: string, itemName: string, itemPrice: number) => {
    dispatch(addToCart({ id: itemId, name: itemName, price: itemPrice }));
  };

  const handleDecreaseQuantity = (itemId: string) => {
    dispatch(removeFromCart(itemId));
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeItemCompletely(itemId));
  };

  const handleClearAll = () => {
    dispatch(clearCart());
  };

  const handleCheckout = () => {
    onCheckout();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--overlay)',
          zIndex: 1299,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '100%',
        maxWidth: '420px',
        background: 'var(--surface-2)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <div>
              <h2 style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.3rem',
                color: 'var(--text-1)',
              }}>
                Your Order
              </h2>
              {itemCount > 0 && (
                <span style={{ color: 'var(--text-3)', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>
                  {itemCount} item{itemCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clear All button — only when cart has items */}
            {cartItems.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: 'rgba(198,42,9,0.08)',
                  border: '1px solid rgba(198,42,9,0.25)',
                  color: 'var(--red-light)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(198,42,9,0.15)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(198,42,9,0.08)'; }}
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px', height: '32px',
                color: 'var(--text-2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-2)',
                marginBottom: '8px',
              }}>
                Your cart is empty
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '24px' }}>
                Add some delicious items from our menu
              </p>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '10px 28px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Plate thumbnail — dark circle */}
                  <div style={{
                    width: '52px', height: '52px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 38% 32%, rgba(212,168,67,0.3) 0%, rgba(212,168,67,0.05) 50%, transparent 100%)',
                    border: '1px solid rgba(212,168,67,0.2)',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                      <line x1="6" y1="1" x2="6" y2="4"/>
                      <line x1="10" y1="1" x2="10" y2="4"/>
                      <line x1="14" y1="1" x2="14" y2="4"/>
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 2px',
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      ₹{item.price.toFixed(2)} each
                    </p>
                  </div>

                  {/* Price + qty controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => item.quantity <= 1 ? handleRemoveItem(item.id) : handleDecreaseQuantity(item.id)}
                        style={{
                          width: '26px', height: '26px',
                          borderRadius: '50%',
                          background: 'var(--surface-3)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-1)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = item.quantity <= 1 ? 'var(--red-light)' : 'var(--gold)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                      >
                        {item.quantity <= 1 ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--red-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        )}
                      </button>
                      <span style={{ fontWeight: 700, color: 'var(--text-1)', minWidth: '18px', textAlign: 'center', fontSize: '0.875rem' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncreaseQuantity(item.id, item.name, item.price)}
                        style={{
                          width: '26px', height: '26px',
                          borderRadius: '50%',
                          background: 'var(--red)',
                          border: '1px solid var(--red)',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '20px 24px',
            background: 'var(--surface)',
          }}>
            {[
              { label: `Subtotal (${itemCount} item${itemCount > 1 ? 's' : ''})`, value: `₹${subtotal.toFixed(2)}` },
              { label: 'Delivery Fee', value: `₹${deliveryFee.toFixed(2)}` },
              { label: 'Tax (5%)', value: `₹${tax.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-3)', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>{row.label}</span>
                <span style={{ color: 'var(--text-2)', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>{row.value}</span>
              </div>
            ))}

            <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-1)', fontSize: '1.05rem' }}>
                Total
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: '1.3rem' }}>
                ₹{total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              style={{
                width: '100%',
                background: 'var(--red)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '14px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
            >
              Proceed to Checkout →
            </button>

            <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: 'var(--text-3)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
              Items reserved for 15 minutes
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
