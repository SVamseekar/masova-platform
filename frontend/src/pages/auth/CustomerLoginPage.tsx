import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useLoginMutation, useGoogleLoginMutation } from '../../store/api/authApi';
import { useAppSelector } from '../../store/hooks';
import { getSavedReturnUrl, clearReturnUrl } from '../../utils/security';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--text-1)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'var(--transition)',
  boxSizing: 'border-box',
};

const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [error, setError] = useState<string>('');

  const locationState = location.state as { from?: string; email?: string; message?: string } | null;
  const prefillEmail = locationState?.email || '';
  const successMessage = locationState?.message || '';

  const [formData, setFormData] = useState({
    email: prefillEmail,
    password: '',
    rememberMe: false
  });

  useEffect(() => {
    if (prefillEmail) setFormData(prev => ({ ...prev, email: prefillEmail }));
  }, [prefillEmail]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const returnUrl = getSavedReturnUrl();
      if (returnUrl) { clearReturnUrl(); navigate(returnUrl, { replace: true }); return; }
      navigate('/guest-checkout', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setError('Please fill in all fields'); return; }
    if (!formData.email.includes('@')) { setError('Please enter a valid email'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      setError('');
      await login({ email: formData.email, password: formData.password, rememberMe: formData.rememberMe }).unwrap();
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    try {
      setError('');
      await googleLogin({ idToken: credentialResponse.credential }).unwrap();
    } catch (err: any) {
      setError(err?.data?.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          borderTop: '3px solid var(--gold)',
          padding: '40px 36px',
          boxShadow: 'var(--shadow-card)',
        }}>
          {/* Logo + Heading */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.75rem',
              color: 'var(--gold)',
              marginBottom: '6px',
            }}>
              MaSoVa
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text-1)',
              margin: 0,
            }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: '6px' }}>
              Sign in to continue with your order
            </p>
          </div>

          {/* Messages */}
          {successMessage && (
            <div style={{ background: 'rgba(46,125,50,0.12)', border: '1px solid #2e7d32', borderRadius: '8px', padding: '10px 14px', color: '#4caf50', fontSize: '0.875rem', marginBottom: '20px', textAlign: 'center' }}>
              {successMessage}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(198,42,9,0.12)', border: '1px solid var(--red)', borderRadius: '8px', padding: '10px 14px', color: 'var(--red-light)', fontSize: '0.875rem', marginBottom: '20px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-3)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                style={inputStyle}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-3)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                style={inputStyle}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={isLoading}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>Remember me</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: isLoading ? 'var(--surface-2)' : 'var(--red)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'var(--transition)',
                width: '100%',
              }}
              onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
              onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
            >
              {isLoading ? 'Signing in...' : 'Login & Continue →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Google OAuth */}
          <div style={{ display: 'flex', justifyContent: 'center', opacity: isGoogleLoading ? 0.6 : 1 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in was cancelled or failed.')}
              text="signin_with"
              shape="rectangular"
              theme="filled_black"
              size="large"
              width="340"
            />
          </div>

          {/* Links */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-3)' }}>
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register', { state: { from: '/checkout' } })}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Create Account
              </button>
            </p>
            <button
              onClick={() => navigate('/checkout')}
              style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '8px', textDecoration: 'underline' }}
            >
              ← Back to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
