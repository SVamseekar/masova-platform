import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomerPageHeader from '../../components/common/CustomerPageHeader';

/**
 * Payment failed — dark-premium only. Honest, EU-friendly copy (no UPI/Razorpay-only language).
 */
const PaymentFailedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('order_id');
  const errorMessage = searchParams.get('error') || 'Payment was not completed';

  return (
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
      <CustomerPageHeader onBack={() => navigate('/checkout')} breadcrumb="Payment" />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px 64px',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            padding: '40px 32px',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--red-light)',
              margin: '0 0 12px',
            }}
          >
            Payment failed
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.55, margin: '0 0 20px' }}>
            We couldn&apos;t complete your payment. If nothing was charged, you can try again with the
            same or a different method.
          </p>

          <div
            style={{
              background: 'rgba(198,42,9,0.1)',
              border: '1px solid rgba(198,42,9,0.35)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 24,
              color: 'var(--red-light)',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {errorMessage}
          </div>

          <div style={{ textAlign: 'left', maxWidth: 380, margin: '0 auto 24px' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 10, fontSize: '0.9rem' }}>
              Common reasons:
            </p>
            {[
              'Card declined or insufficient funds',
              'Incorrect or expired card details',
              'Payment cancelled before confirmation',
              'Bank or network connectivity issues',
              'Daily transaction limit reached',
            ].map((reason) => (
              <div
                key={reason}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-3)',
                  marginBottom: 8,
                  paddingLeft: 14,
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}>•</span>
                {reason}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/payment')}
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
              Try Again
            </button>
            <button
              type="button"
              onClick={() => navigate('/menu')}
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
              Back to Menu
            </button>
          </div>

          {orderId && (
            <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--text-3)' }}>
              Order reference: {orderId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
