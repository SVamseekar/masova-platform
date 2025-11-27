import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useCreateOrderMutation } from '../../store/api/orderApi';
import { useInitiatePaymentMutation } from '../../store/api/paymentApi';
import { useGetCustomerByUserIdQuery, useCreateCustomerMutation } from '../../store/api/customerApi';
import { clearCart, selectCartItems, selectCartSubtotal, selectDeliveryFee } from '../../store/slices/cartSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { Button, Card, Input } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

// Razorpay is declared in types/razorpay.d.ts - no need to redeclare

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
  const subtotal = useAppSelector(selectCartSubtotal);
  const baseDeliveryFee = useAppSelector(selectDeliveryFee);
  const currentUser = useAppSelector(selectCurrentUser);

  // Get guest info from navigation state (passed from GuestCheckoutPage)
  const guestInfo = location.state?.guestInfo as GuestInfo | undefined;

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>('DELIVERY');

  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [initiatePayment, { isLoading: isInitiatingPayment }] = useInitiatePaymentMutation();
  const [createCustomer] = useCreateCustomerMutation();

  // Check if customer profile exists
  const { data: customerProfile } = useGetCustomerByUserIdQuery(currentUser?.id || '', {
    skip: !currentUser?.id,
  });

  const isLoading = isCreatingOrder || isInitiatingPayment;

  // Track if order was placed to prevent redirect after successful order
  const [orderPlaced, setOrderPlaced] = React.useState(false);

  // Redirect if cart is empty (but not if order was just placed)
  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      navigate('/menu');
    }
  }, [cartItems, navigate, orderPlaced]);

  // Calculate totals - consistent with CartDrawer, CheckoutPage, and GuestCheckoutPage
  const deliveryFee = orderType === 'DELIVERY' ? baseDeliveryFee : 0;
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    try {
      // If user is logged in but doesn't have a customer profile, create one
      let customerId = customerProfile?.id;
      if (currentUser && !customerProfile) {
        try {
          console.log('Creating customer profile for user:', currentUser.id);
          const newCustomer = await createCustomer({
            userId: currentUser.id,
            name: currentUser.name,
            email: currentUser.email || '',
            phone: currentUser.phone || guestInfo?.phone || '',
          }).unwrap();
          customerId = newCustomer.id;
          console.log('Customer profile created:', customerId);
        } catch (err) {
          console.error('Failed to create customer profile:', err);
          // Continue with order even if customer profile creation fails
        }
      }

      // Prepare order data - matching backend CreateOrderRequest structure
      const orderData = {
        storeId: 'store-1', // Default store ID
        customerName: currentUser?.name || guestInfo?.name || 'Guest',
        customerPhone: guestInfo?.phone || currentUser?.phone || '',
        customerId: customerId, // Use customer ID from profile or newly created
        items: cartItems.map(item => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price, // Backend expects price in rupees (Double)
          variant: (item as any).variant,
          customizations: (item as any).customizations,
        })),
        orderType,
        paymentMethod,
        deliveryAddress: orderType === 'DELIVERY' && guestInfo ? {
          street: guestInfo.street,
          city: guestInfo.city,
          state: guestInfo.state,
          pincode: guestInfo.pincode,
          landmark: guestInfo.deliveryInstructions || '', // Backend uses 'landmark' not 'instructions'
        } : undefined,
        specialInstructions: guestInfo?.deliveryInstructions, // Backend uses 'specialInstructions' not 'notes'
      };

      console.log('Creating order with data:', orderData);

      // Create order first
      const orderResult = await createOrder(orderData).unwrap();
      console.log('Order created successfully:', orderResult);
      const orderId = orderResult.id; // Backend returns 'id' not 'orderId'

      // If payment method is CASH, just redirect to tracking
      if (paymentMethod === 'CASH') {
        console.log('Cash payment - redirecting to tracking page:', orderId);
        setOrderPlaced(true); // Prevent redirect to menu

        // Navigate to tracking page (cart will be cleared there)
        navigate(`/tracking/${orderId}`, {
          state: { orderData: orderResult },
          replace: true // Replace history to prevent back navigation issues
        });

        return;
      }

      // For CARD/UPI, initiate Razorpay payment
      const paymentResult = await initiatePayment({
        orderId: orderId,
        amount: total,
        customerId: currentUser?.id || 'guest',
        customerEmail: guestInfo?.email || currentUser?.email,
        customerPhone: guestInfo?.phone || currentUser?.phone,
        storeId: 'store-1',
      }).unwrap();

      // Open Razorpay checkout
      openRazorpayCheckout(paymentResult, orderId);

    } catch (err: any) {
      console.error('Failed to create order:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to create order. Please try again.';
      alert(errorMessage);
    }
  };

  const openRazorpayCheckout = (paymentData: any, orderId: string) => {
    if (!window.Razorpay) {
      alert('Razorpay SDK not loaded. Please refresh the page.');
      return;
    }

    const options = {
      key: paymentData.razorpayKeyId,
      amount: paymentData.amount * 100, // Convert to paise
      currency: 'INR',
      name: 'MaSoVa Restaurant',
      description: `Order #${orderId}`,
      order_id: paymentData.razorpayOrderId,
      handler: function (response: any) {
        // Payment successful
        console.log('Payment successful:', response);

        // Set order placed flag to prevent redirect to menu
        setOrderPlaced(true);

        // Navigate to success page (cart will be cleared there)
        navigate(`/payment/success?razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}&order_id=${orderId}`);
      },
      prefill: {
        name: guestInfo?.name || currentUser?.name || '',
        email: guestInfo?.email || currentUser?.email || '',
        contact: guestInfo?.phone || currentUser?.phone || '',
      },
      notes: {
        order_id: orderId,
      },
      theme: {
        color: colors.brand.primary,
      },
      modal: {
        ondismiss: function() {
          // Payment cancelled/closed
          console.log('Payment cancelled');
          navigate(`/payment/failed?order_id=${orderId}&error=Payment cancelled by user`);
        }
      }
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      navigate(`/payment/failed?order_id=${orderId}&error=${response.error.description || 'Payment failed'}`);
    });

    razorpay.open();
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

  const paymentInfoBadgeStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[3],
    marginTop: spacing[3],
    backgroundColor: colors.semantic.infoLight + '20',
    border: `2px solid ${colors.semantic.info}`,
    fontSize: typography.fontSize.sm,
    color: colors.semantic.info,
    borderRadius: borderRadius.lg,
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
                    +₹{baseDeliveryFee.toFixed(2)}
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
                    No delivery fee
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
                    No delivery fee
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
                      Pay securely with your card (Razorpay)
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

              {(paymentMethod === 'CARD' || paymentMethod === 'UPI') && (
                <div style={paymentInfoBadgeStyles}>
                  ℹ️ You will be redirected to Razorpay's secure payment gateway to complete your payment.
                </div>
              )}
            </Card>
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

                <div style={summaryRowStyles}>
                  <span style={summaryLabelStyles}>Tax (5%)</span>
                  <span style={summaryValueStyles}>₹{tax.toFixed(2)}</span>
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
                {isLoading
                  ? 'Processing...'
                  : paymentMethod === 'CASH'
                    ? `Place Order - ₹${total.toFixed(2)}`
                    : `Pay ₹${total.toFixed(2)} via Razorpay`
                }
              </Button>

              <Button
                variant="secondary"
                size="base"
                fullWidth
                onClick={() => navigate('/checkout')}
                disabled={isLoading}
              >
                Back to Checkout
              </Button>

              {paymentMethod !== 'CASH' && (
                <div style={{ marginTop: spacing[4], fontSize: typography.fontSize.xs, color: colors.text.tertiary, textAlign: 'center' }}>
                  🔒 Secured by Razorpay • 256-bit SSL Encrypted
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;
