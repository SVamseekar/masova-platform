import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartItemCount,
  selectDeliveryFee,
} from '../../store/slices/cartSlice';
import { selectIsAuthenticated, selectCurrentUser } from '../../store/slices/authSlice';
import { Button, Card } from '../../components/ui/neumorphic';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const deliveryFee = useAppSelector(selectDeliveryFee);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);

  const tax = subtotal * 0.05;
  const total = subtotal + (itemCount > 0 ? deliveryFee : 0) + tax;

  // If cart is empty, redirect to menu
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/menu');
    }
  }, [cartItems, navigate]);

  // If user is already logged in as a customer, go to guest-checkout to select/add address
  // Guest checkout page will handle both selecting existing addresses and adding new ones
  useEffect(() => {
    if (isAuthenticated && currentUser?.type === 'CUSTOMER') {
      navigate('/guest-checkout', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const checkoutOptions = [
    {
      id: 'login',
      title: 'Login',
      icon: '🔐',
      description: 'Already have an account? Sign in to continue',
      benefits: [
        'Access your saved addresses',
        'View order history',
        'Track your orders',
        'Earn loyalty points',
      ],
      buttonText: 'Login to Continue',
      buttonVariant: 'primary' as const,
      action: () => {
        console.log('Login button clicked');
        navigate('/customer-login', { state: { from: '/checkout' } });
      },
    },
    {
      id: 'register',
      title: 'Create Account',
      icon: '✨',
      description: 'New to MaSoVa? Create an account for faster checkout',
      benefits: [
        'Save delivery addresses',
        'Faster future checkouts',
        'Exclusive member deals',
        'Order tracking & history',
      ],
      buttonText: 'Create Account',
      buttonVariant: 'secondary' as const,
      action: () => {
        console.log('Create Account button clicked');
        navigate('/register', { state: { from: '/checkout' } });
      },
    },
    {
      id: 'guest',
      title: 'Guest Checkout',
      icon: '👤',
      description: 'No account needed. Quick and easy checkout',
      benefits: [
        'No registration required',
        'Quick checkout process',
        'Enter delivery details once',
        'Track order with order ID',
      ],
      buttonText: 'Continue as Guest',
      buttonVariant: 'ghost' as const,
      action: () => {
        console.log('Guest Checkout button clicked');
        navigate('/guest-checkout');
      },
    },
  ];

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    padding: `${spacing[8]} ${spacing[4]}`,
    fontFamily: typography.fontFamily.primary,
  };

  const headerStyles: React.CSSProperties = {
    marginBottom: spacing[8],
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing[6],
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const sidebarStyles: React.CSSProperties = {
    maxWidth: '400px',
    margin: '0 auto',
  };

  return (
    <div style={containerStyles}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={headerStyles}>
          <button
            onClick={() => navigate('/menu')}
            style={{
              ...createNeumorphicSurface('raised', 'sm', 'base'),
              padding: spacing[2],
              marginBottom: spacing[4],
              cursor: 'pointer',
              border: 'none',
              fontSize: typography.fontSize.lg,
            }}
          >
            ← Back
          </button>
          <h1 style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            margin: `${spacing[4]} 0 ${spacing[2]} 0`,
          }}>
            Checkout
          </h1>
          <p style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            margin: 0,
          }}>
            Choose how you'd like to continue with your order
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: spacing[8], maxWidth: '1400px' }}>
          {/* Checkout Options */}
          <div style={gridStyles}>
            {checkoutOptions.map((option) => (
              <Card key={option.id} elevation="md" padding="lg" interactive>
                <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
                  <div style={{
                    fontSize: '60px',
                    marginBottom: spacing[3],
                  }}>
                    {option.icon}
                  </div>
                  <h2 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.extrabold,
                    color: colors.text.primary,
                    margin: `0 0 ${spacing[2]} 0`,
                  }}>
                    {option.title}
                  </h2>
                  <p style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    margin: 0,
                  }}>
                    {option.description}
                  </p>
                </div>

                <div style={{ marginBottom: spacing[5] }}>
                  {option.benefits.map((benefit, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: spacing[2],
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: colors.brand.primary,
                        marginRight: spacing[3],
                      }} />
                      {benefit}
                    </div>
                  ))}
                </div>

                <Button
                  variant={option.buttonVariant}
                  size="lg"
                  fullWidth
                  onClick={option.action}
                >
                  {option.buttonText}
                </Button>
              </Card>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div style={sidebarStyles}>
            <Card elevation="lg" padding="lg">
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.extrabold,
                color: colors.text.primary,
                margin: `0 0 ${spacing[4]} 0`,
              }}>
                Order Summary
              </h3>

              <div style={{ height: '1px', backgroundColor: colors.surface.tertiary, margin: `${spacing[4]} 0` }} />

              {/* Cart Items */}
              <div style={{ marginBottom: spacing[4], maxHeight: '300px', overflowY: 'auto' }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: spacing[3],
                    paddingBottom: spacing[3],
                    borderBottom: `1px solid ${colors.surface.secondary}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        marginBottom: spacing[1],
                      }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.tertiary,
                      }}>
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ height: '1px', backgroundColor: colors.surface.tertiary, margin: `${spacing[4]} 0` }} />

              {/* Bill Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[4] }}>
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

              <div style={{
                padding: spacing[3],
                backgroundColor: colors.surface.secondary,
                borderRadius: borderRadius.base,
                border: `1px solid ${colors.surface.tertiary}`,
              }}>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, textAlign: 'center', margin: 0 }}>
                  🕒 Your items are reserved for 15 minutes
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
