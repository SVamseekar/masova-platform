import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVerifyPaymentMutation } from '../../store/api/paymentApi';
import { useAppDispatch } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';
import CustomerPageHeader from '../../components/common/CustomerPageHeader';

/**
 * Payment success — dark-premium only. Supports Stripe (order_id query) and
 * legacy Razorpay verify params when present.
 */
const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [verifyPayment, { isLoading, isError }] = useVerifyPaymentMutation();

  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  const razorpayOrderId = searchParams.get('razorpay_order_id');
  const razorpaySignature = searchParams.get('razorpay_signature');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem('activeOrderId', orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      verifyPayment({
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      });
    }
  }, [razorpayPaymentId, razorpayOrderId, razorpaySignature, verifyPayment]);

  const shell = (children: React.ReactNode) => (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CustomerPageHeader onBack={() => navigate('/menu')} breadcrumb="Payment" />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px 64px',
        }}
      >
        {children}
      </div>
    </div>
  );

  const card: React.CSSProperties = {
    maxWidth: 520,
    width: '100%',
    textAlign: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
    padding: '40px 32px',
  };

  if (isLoading) {
    return shell(
      <div style={card}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h1 style={titleStyle}>Verifying payment…</h1>
        <p style={bodyStyle}>Please wait while we confirm your payment with the payment provider.</p>
      </div>
    );
  }

  if (isError) {
    return shell(
      <div style={card}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h1 style={titleStyle}>Payment verification failed</h1>
        <p style={bodyStyle}>
          We couldn&apos;t verify your payment. If money was charged, contact support with your order
          reference — we&apos;ll resolve it quickly.
        </p>
        <div style={actionsStyle}>
          <PrimaryButton onClick={() => navigate('/customer/orders')}>View My Orders</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/menu')}>Back to Menu</SecondaryButton>
        </div>
      </div>
    );
  }

  return shell(
    <div style={card}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h1 style={titleStyle}>Payment successful</h1>
      <p style={bodyStyle}>
        Thank you! Your payment is confirmed and the kitchen is preparing your order.
      </p>

      {orderId && (
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 18px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 6 }}>Order ID</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gold)', wordBreak: 'break-all' }}>
            {orderId}
          </div>
        </div>
      )}

      <p style={{ ...bodyStyle, fontSize: '0.9rem' }}>
        You&apos;ll get a confirmation email shortly. Track status anytime from Orders.
      </p>

      <div style={actionsStyle}>
        <PrimaryButton
          onClick={() => navigate(orderId ? `/tracking/${orderId}` : '/customer/orders')}
        >
          Track Order
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate('/menu')}>Continue Shopping</SecondaryButton>
      </div>
    </div>
  );
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.75rem',
  fontWeight: 800,
  color: 'var(--text-1)',
  margin: '0 0 12px',
};

const bodyStyle: React.CSSProperties = {
  color: 'var(--text-2)',
  fontSize: '1rem',
  lineHeight: 1.55,
  margin: '0 0 20px',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'center',
  marginTop: 8,
};

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--red)',
        color: 'var(--text-1)',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '12px 22px',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '0.9rem',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        color: 'var(--text-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
        padding: '12px 22px',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export default PaymentSuccessPage;
