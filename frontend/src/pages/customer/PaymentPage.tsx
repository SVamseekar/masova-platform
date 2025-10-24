import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useCreateOrderMutation } from '../../store/api/orderApi';
import { clearCart, selectCartItems, selectCartTotal } from '../../store/slices/cartSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { Button, Card, Input } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface GuestInfo {
  email: string;
  phone: string;
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const currentUser = useAppSelector(selectCurrentUser);

  // Get guest info from navigation state (passed from GuestCheckoutPage)
  const guestInfo = location.state?.guestInfo as GuestInfo | undefined;

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>('DELIVERY');
  const [createOrder, { isLoading, error }] = useCreateOrderMutation();

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/menu');
    }
  }, [cartItems, navigate]);

  // Calculate totals
  const subtotal = cartTotal;
  const deliveryFee = orderType === 'DELIVERY' ? 40 : 0;
  const gst = subtotal * 0.05; // 5% GST
  const packagingCharges = orderType === 'TAKEAWAY' ? 10 : 0;
  const total = subtotal + deliveryFee + gst + packagingCharges;

  const handlePlaceOrder = async () => {
    try {
      // Prepare order data
      const orderData = {
        storeId: 'store-1', // Default store ID
        customerName: currentUser?.name || guestInfo?.name || 'Guest',
        customerPhone: guestInfo?.phone || currentUser?.phone || '',
        customerEmail: guestInfo?.email || currentUser?.email,
        customerId: currentUser?.userId,
        items: cartItems.map(item => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Math.round(item.price * 100), // Convert to paise
          variant: item.variant,
          customizations: item.customizations,
        })),
        orderType,
        paymentMethod,
        deliveryAddress: orderType === 'DELIVERY' && guestInfo ? {
          street: guestInfo.street,
          city: guestInfo.city,
          state: guestInfo.state,
          pincode: guestInfo.pincode,
          instructions: guestInfo.deliveryInstructions,
        } : undefined,
        notes: guestInfo?.deliveryInstructions,
      };

      const result = await createOrder(orderData).unwrap();

      // Clear cart after successful order
      dispatch(clearCart());

      // Navigate to tracking page with order ID
      navigate(`/tracking/${result.orderId}`, {
        state: { orderData: result }
      });
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    zIndex: 1,
  };

  const contentStyles: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: spacing[8],
    marginTop: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const paymentOptionStyles = (isSelected: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isSelected ? 'inset' : 'raised', 'base', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[3],
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: isSelected ? colors.brand.primaryLight + '20' : colors.surface.primary,
    border: isSelected ? `2px solid ${colors.brand.primary}` : 'none',
  });

  const orderTypeOptionStyles = (isSelected: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isSelected ? 'inset' : 'raised', 'base', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[3],
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: isSelected ? colors.brand.primaryLight + '20' : colors.surface.primary,
    border: isSelected ? `2px solid ${colors.brand.primary}` : 'none',
    textAlign: 'center',
  });

  const optionLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  };

  const optionIconStyles: React.CSSProperties = {
    fontSize: '32px',
  };

  const summaryRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  };

  const summaryLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  const summaryValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const totalRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: spacing[4],
    borderTop: `2px solid ${colors.surface.tertiary}`,
    marginBottom: spacing[6],
  };

  const totalLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
  };

  const totalValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const errorStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'base', 'lg'),
    padding: spacing[4],
    marginTop: spacing[4],
    backgroundColor: colors.semantic.errorLight + '40',
    color: colors.semantic.error,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  };

  const customerInfoStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.surface.secondary,
  };

  const infoRowStyles: React.CSSProperties = {
    marginBottom: spacing[2],
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  };

  const infoLabelStyles: React.CSSProperties = {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const itemStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const responsiveStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: spacing[3],
  };

  return (
    <>
      <AnimatedBackground variant="minimal" />

      <div style={containerStyles}>
        <AppHeader
          title="Payment & Checkout"
          showBackButton
          backRoute="/checkout"
          hideStaffLogin
        />

        <h1 style={titleStyles}>Complete Your Order</h1>

        <div style={contentStyles}>
          {/* Left Column: Payment Options */}
          <div>
            {/* Customer Info */}
            {guestInfo && (
              <Card elevation="md" padding="lg" style={{ marginBottom: spacing[6] }}>
                <h2 style={sectionTitleStyles}>Delivery Information</h2>
                <div style={customerInfoStyles}>
                  <div style={infoRowStyles}>
                    <span style={infoLabelStyles}>Name:</span> {guestInfo.name}
                  </div>
                  <div style={infoRowStyles}>
                    <span style={infoLabelStyles}>Email:</span> {guestInfo.email}
                  </div>
                  <div style={infoRowStyles}>
                    <span style={infoLabelStyles}>Phone:</span> {guestInfo.phone}
                  </div>
                  <div style={infoRowStyles}>
                    <span style={infoLabelStyles}>Address:</span> {guestInfo.street}, {guestInfo.city}, {guestInfo.state} - {guestInfo.pincode}
                  </div>
                  {guestInfo.deliveryInstructions && (
                    <div style={infoRowStyles}>
                      <span style={infoLabelStyles}>Instructions:</span> {guestInfo.deliveryInstructions}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Order Type Selection */}
            <Card elevation="md" padding="lg" style={{ marginBottom: spacing[6] }}>
              <h2 style={sectionTitleStyles}>Order Type</h2>
              <div style={responsiveStyles}>
                <div
                  style={orderTypeOptionStyles(orderType === 'DELIVERY')}
                  onClick={() => setOrderType('DELIVERY')}
                >
                  <div style={optionIconStyles}>🚚</div>
                  <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginTop: spacing[2] }}>
                    Delivery
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[1] }}>
                    +₹{deliveryFee}
                  </div>
                </div>

                <div
                  style={orderTypeOptionStyles(orderType === 'TAKEAWAY')}
                  onClick={() => setOrderType('TAKEAWAY')}
                >
                  <div style={optionIconStyles}>🛍️</div>
                  <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginTop: spacing[2] }}>
                    Takeaway
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[1] }}>
                    +₹{packagingCharges}
                  </div>
                </div>

                <div
                  style={orderTypeOptionStyles(orderType === 'DINE_IN')}
                  onClick={() => setOrderType('DINE_IN')}
                >
                  <div style={optionIconStyles}>🍽️</div>
                  <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginTop: spacing[2] }}>
                    Dine In
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[1] }}>
                    No extra charge
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method Selection */}
            <Card elevation="md" padding="lg">
              <h2 style={sectionTitleStyles}>Payment Method</h2>

              <div
                style={paymentOptionStyles(paymentMethod === 'CASH')}
                onClick={() => setPaymentMethod('CASH')}
              >
                <div style={optionLabelStyles}>
                  <span style={optionIconStyles}>💵</span>
                  <div>
                    <div>Cash on Delivery</div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      Pay with cash when your order arrives
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={paymentOptionStyles(paymentMethod === 'CARD')}
                onClick={() => setPaymentMethod('CARD')}
              >
                <div style={optionLabelStyles}>
                  <span style={optionIconStyles}>💳</span>
                  <div>
                    <div>Credit/Debit Card</div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      Pay securely with your card
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={paymentOptionStyles(paymentMethod === 'UPI')}
                onClick={() => setPaymentMethod('UPI')}
              >
                <div style={optionLabelStyles}>
                  <span style={optionIconStyles}>📱</span>
                  <div>
                    <div>UPI Payment</div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      Pay using Google Pay, PhonePe, Paytm, etc.
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {error && (
              <div style={errorStyles}>
                ⚠️ Failed to place order. Please try again or contact support.
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div style={{ position: 'sticky', top: spacing[6], height: 'fit-content' }}>
            <Card elevation="lg" padding="lg">
              <h2 style={sectionTitleStyles}>Order Summary</h2>

              {/* Cart Items */}
              <div style={{ marginBottom: spacing[4] }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={itemStyles}>
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span style={{ fontWeight: typography.fontWeight.semibold }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div style={{ marginBottom: spacing[4] }}>
                <div style={summaryRowStyles}>
                  <span style={summaryLabelStyles}>Subtotal ({cartItems.length} items)</span>
                  <span style={summaryValueStyles}>₹{subtotal.toFixed(2)}</span>
                </div>

                {orderType === 'DELIVERY' && (
                  <div style={summaryRowStyles}>
                    <span style={summaryLabelStyles}>Delivery Fee</span>
                    <span style={summaryValueStyles}>₹{deliveryFee.toFixed(2)}</span>
                  </div>
                )}

                {orderType === 'TAKEAWAY' && (
                  <div style={summaryRowStyles}>
                    <span style={summaryLabelStyles}>Packaging Charges</span>
                    <span style={summaryValueStyles}>₹{packagingCharges.toFixed(2)}</span>
                  </div>
                )}

                <div style={summaryRowStyles}>
                  <span style={summaryLabelStyles}>GST (5%)</span>
                  <span style={summaryValueStyles}>₹{gst.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div style={totalRowStyles}>
                <span style={totalLabelStyles}>Total</span>
                <span style={totalValueStyles}>₹{total.toFixed(2)}</span>
              </div>

              {/* Action Buttons */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handlePlaceOrder}
                disabled={isLoading}
                style={{ marginBottom: spacing[3] }}
              >
                {isLoading ? 'Placing Order...' : `Pay ₹${total.toFixed(2)}`}
              </Button>

              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => navigate('/checkout')}
                disabled={isLoading}
              >
                Back to Checkout
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;
