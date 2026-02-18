import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartItemCount,
  selectDeliveryFee,
} from '../../store/slices/cartSlice';
import { selectIsAuthenticated, selectCurrentUser } from '../../store/slices/authSlice';

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

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const userType = currentUser.type;
      if (userType === 'MANAGER' || userType === 'ASSISTANT_MANAGER') { navigate('/manager', { replace: true }); return; }
      if (userType === 'STAFF') { navigate('/pos', { replace: true }); return; }
      if (userType === 'DRIVER') { navigate('/driver', { replace: true }); return; }
    }
  }, [isAuthenticated, currentUser, navigate]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.type === 'CUSTOMER') {
      navigate('/guest-checkout', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const options = [
    {
      id: 'login',
      title: 'Sign In',
      subtitle: 'Already have an account? Sign in to continue',
      benefits: ['Access saved addresses', 'View order history', 'Track orders live', 'Earn loyalty points'],
      buttonText: 'Login & Continue →',
      accent: 'var(--gold)',
      primary: true,
      action: () => navigate('/customer-login', { state: { from: '/checkout' } }),
    },
    {
      id: 'register',
      title: 'Create Account',
      subtitle: "New to MaSoVa? Sign up for a better experience",
      benefits: ['Save delivery addresses', 'Faster future checkouts', 'Exclusive member deals', 'Order tracking & history'],
      buttonText: 'Create Account →',
      accent: 'var(--red)',
      primary: false,
      action: () => navigate('/register', { state: { from: '/checkout' } }),
    },
    {
      id: 'guest',
      title: 'Guest Checkout',
      subtitle: 'No account needed. Quick and easy',
      benefits: ['No registration required', 'Quick checkout process', 'Enter delivery details once', 'Track with order ID'],
      buttonText: 'Continue as Guest →',
      accent: 'var(--border-strong)',
      primary: false,
      action: () => navigate('/guest-checkout'),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 16px', fontFamily: 'var(--font-body)', color: 'var(--text-1)' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <button
            onClick={() => navigate('/menu')}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '16px', padding: 0 }}
          >
            ← Back to Menu
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-1)', margin: '0 0 6px 0' }}>
            Checkout
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0 }}>
            Choose how you'd like to continue with your order
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

          {/* Option cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {options.map((opt) => (
              <div
                key={opt.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border)',
                  borderTop: `3px solid ${opt.accent}`,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: opt.accent, margin: '0 0 6px 0' }}>
                  {opt.title}
                </h2>
                <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  {opt.subtitle}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {opt.benefits.map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-2)' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: opt.accent, flexShrink: 0 }} />
                      {b}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={opt.action}
                  style={{
                    width: '100%',
                    background: opt.primary ? opt.accent : 'transparent',
                    color: opt.primary ? '#000' : opt.accent,
                    border: `1px solid ${opt.accent}`,
                    borderRadius: 'var(--radius-pill)',
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = opt.accent;
                    (e.currentTarget as HTMLElement).style.color = opt.id === 'login' ? '#000' : '#fff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = opt.primary ? opt.accent : 'transparent';
                    (e.currentTarget as HTMLElement).style.color = opt.primary ? '#000' : opt.accent;
                  }}
                >
                  {opt.buttonText}
                </button>
              </div>
            ))}
          </div>

          {/* Order summary sidebar */}
          <div style={{ position: 'sticky', top: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 16px 0' }}>
              Order Summary
            </h3>

            <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 16px 0' }} />

            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-3)' }}>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-1)', flexShrink: 0 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 14px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: `Subtotal (${itemCount} items)`, value: `₹${subtotal.toFixed(2)}` },
                { label: 'Delivery Fee', value: `₹${deliveryFee.toFixed(2)}` },
                { label: 'Tax (5%)', value: `₹${tax.toFixed(2)}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{row.label}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-1)', fontSize: '1.05rem' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: '1.35rem' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '10px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-3)' }}>Items reserved for 15 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
