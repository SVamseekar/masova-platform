import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useVerifyPaymentMutation } from '../../store/api/paymentApi';
import { Button, Card } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifyPayment, { isLoading, isError, isSuccess }] = useVerifyPaymentMutation();

  // Get payment details from URL params (sent by Razorpay)
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  const razorpayOrderId = searchParams.get('razorpay_order_id');
  const razorpaySignature = searchParams.get('razorpay_signature');
  const orderId = searchParams.get('order_id'); // Our internal order ID

  useEffect(() => {
    // Verify payment when component mounts
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      verifyPayment({
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      });
    }
  }, [razorpayPaymentId, razorpayOrderId, razorpaySignature, verifyPayment]);

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  };

  const cardStyles: React.CSSProperties = {
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  };

  const iconStyles: React.CSSProperties = {
    fontSize: '120px',
    marginBottom: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const messageStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing[6],
    lineHeight: 1.6,
  };

  const orderIdStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[6],
    backgroundColor: colors.surface.secondary,
  };

  const orderIdTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  };

  const orderIdValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  if (isLoading) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <Card elevation="xl" padding="xl" style={cardStyles}>
            <div style={iconStyles}>⏳</div>
            <h1 style={titleStyles}>Verifying Payment...</h1>
            <p style={messageStyles}>
              Please wait while we confirm your payment with our payment gateway.
            </p>
          </Card>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <AnimatedBackground variant="minimal" />
        <div style={containerStyles}>
          <Card elevation="xl" padding="xl" style={cardStyles}>
            <div style={iconStyles}>⚠️</div>
            <h1 style={titleStyles}>Payment Verification Failed</h1>
            <p style={messageStyles}>
              We couldn't verify your payment. If money was deducted from your account,
              please contact our support team. We'll resolve this issue shortly.
            </p>
            <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/customer/orders')}
              >
                View My Orders
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/menu')}
              >
                Back to Menu
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="success" />
      <div style={containerStyles}>
        <Card elevation="xl" padding="xl" style={cardStyles}>
          <div style={iconStyles}>✅</div>
          <h1 style={titleStyles}>Payment Successful!</h1>
          <p style={messageStyles}>
            Thank you for your order! Your payment has been confirmed and your order
            is being prepared.
          </p>

          {orderId && (
            <div style={orderIdStyles}>
              <div style={orderIdTextStyles}>Your Order ID</div>
              <div style={orderIdValueStyles}>{orderId}</div>
            </div>
          )}

          <p style={{ ...messageStyles, fontSize: typography.fontSize.base }}>
            You will receive an email confirmation shortly. You can track your order status
            from the orders page.
          </p>

          <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', marginTop: spacing[6] }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/tracking/${orderId}`)}
            >
              Track Order
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/menu')}
            >
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PaymentSuccessPage;
