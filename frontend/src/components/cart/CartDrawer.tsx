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
import { Button, Card } from '../ui/neumorphic';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createBadge } from '../../styles/neumorphic-utils';

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

  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '420px',
    ...createNeumorphicSurface('raised', 'lg', 'none'),
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1300,
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1299,
    opacity: open ? 1 : 0,
    transition: 'opacity 350ms cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: open ? 'auto' : 'none',
  };

  const headerStyles: React.CSSProperties = {
    padding: `${spacing[5]} ${spacing[6]}`,
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    color: colors.text.inverse,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: shadows.floating.sm,
  };

  const badgeStyles = createBadge('primary', 'sm');

  const quantityControlStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: spacing[1],
  };

  const quantityButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'base'),
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    border: 'none',
    transition: 'all 250ms ease',
  };

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyles} onClick={onClose} />

      {/* Drawer */}
      <div style={containerStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <span style={{ fontSize: '28px' }}>🛒</span>
            <div>
              <h2 style={{ margin: 0, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.extrabold }}>
                Your Cart
              </h2>
              {itemCount > 0 && (
                <span style={badgeStyles}>{itemCount} items</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.text.inverse,
              fontSize: '24px',
              cursor: 'pointer',
              padding: spacing[2],
            }}
          >
            ×
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: spacing[4] }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spacing[16]} 0` }}>
              <div style={{ fontSize: '80px', marginBottom: spacing[4] }}>🛒</div>
              <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[2] }}>
                Your cart is empty
              </h3>
              <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, marginBottom: spacing[5] }}>
                Add some delicious items from our menu!
              </p>
              <Button variant="primary" size="lg" onClick={onClose}>
                Browse Menu
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {cartItems.map((item) => (
                <Card key={item.id} elevation="base" padding="sm">
                  <div style={{ display: 'flex', gap: spacing[3] }}>
                    {/* Item Details */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                        {item.name}
                      </h4>
                      {item.category && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: spacing[1],
                          padding: `${spacing[1]} ${spacing[2]}`,
                          background: colors.surface.secondary,
                          borderRadius: borderRadius.base,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.secondary,
                          fontWeight: typography.fontWeight.semibold,
                        }}>
                          {item.category}
                        </span>
                      )}
                      <div style={{ marginTop: spacing[2] }}>
                        <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.extrabold, color: colors.brand.primary }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginLeft: spacing[2] }}>
                          ₹{item.price.toFixed(2)} each
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: colors.semantic.error,
                          fontSize: typography.fontSize.lg,
                          cursor: 'pointer',
                          padding: spacing[1],
                        }}
                      >
                        🗑️
                      </button>

                      <div style={quantityControlStyles}>
                        <button
                          onClick={() => handleDecreaseQuantity(item.id)}
                          disabled={item.quantity <= 1}
                          style={{
                            ...quantityButtonStyles,
                            opacity: item.quantity <= 1 ? 0.5 : 1,
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          −
                        </button>

                        <span style={{
                          minWidth: '32px',
                          textAlign: 'center',
                          fontWeight: typography.fontWeight.extrabold,
                          fontSize: typography.fontSize.base,
                          color: colors.text.primary,
                        }}>
                          {item.quantity}
                        </span>

                        <button onClick={() => handleIncreaseQuantity(item.id, item.name, item.price)} style={quantityButtonStyles}>
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Bill Summary */}
        {cartItems.length > 0 && (
          <div style={{
            padding: spacing[5],
            ...createNeumorphicSurface('inset', 'base', 'none'),
            backgroundColor: colors.surface.primary,
          }}>
            <h3 style={{ margin: `0 0 ${spacing[4]} 0`, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.extrabold, color: colors.text.primary }}>
              Bill Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[5] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                <span>Subtotal ({itemCount} items)</span>
                <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>₹{subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                <span>Delivery Fee</span>
                <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.semantic.success }}>₹{deliveryFee.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                <span>Tax (5%)</span>
                <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>₹{tax.toFixed(2)}</span>
              </div>

              <div style={{ height: '1px', backgroundColor: colors.surface.tertiary, margin: `${spacing[2]} 0` }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.extrabold, color: colors.text.primary }}>
                  Total Amount
                </span>
                <span style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.extrabold, color: colors.brand.primary }}>
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            <Button variant="primary" size="xl" fullWidth onClick={handleCheckout}>
              Proceed to Checkout →
            </Button>

            <p style={{ marginTop: spacing[3], fontSize: typography.fontSize.xs, color: colors.text.tertiary, textAlign: 'center' }}>
              🕒 Your items are reserved for 15 minutes
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
