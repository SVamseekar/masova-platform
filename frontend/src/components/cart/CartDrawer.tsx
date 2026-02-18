import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  removeFromCart,
  addToCart,
  removeItemCompletely,
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
          <div>
            <h2 style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.5rem',
              color: 'var(--text-1)',
            }}>
              Your Order
            </h2>
            {itemCount > 0 && (
              <span style={{ color: 'var(--text-3)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                {itemCount} item{itemCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-2)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          >
            ×
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.4 }}>🛒</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-2)',
                marginBottom: '8px',
              }}>
                Your cart is empty
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '20px' }}>
                Add some delicious items from our menu!
              </p>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '10px 24px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
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
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '10px',
                    background: 'var(--surface-3)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    🍽️
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
                      >
                        {item.quantity <= 1 ? '🗑' : '−'}
                      </button>
                      <span style={{ fontWeight: 700, color: 'var(--text-1)', minWidth: '16px', textAlign: 'center', fontSize: '0.875rem' }}>
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                      >
                        +
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
              { label: `Subtotal (${itemCount} items)`, value: `₹${subtotal.toFixed(2)}` },
              { label: 'Delivery Fee', value: `₹${deliveryFee.toFixed(2)}` },
              { label: 'Tax (5%)', value: `₹${tax.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-3)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>{row.label}</span>
                <span style={{ color: 'var(--text-2)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>{row.value}</span>
              </div>
            ))}

            <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-1)', fontSize: '1.1rem' }}>
                Total
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: '1.35rem' }}>
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
