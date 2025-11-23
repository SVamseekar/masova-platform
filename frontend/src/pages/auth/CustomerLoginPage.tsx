import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Input } from '../../components/ui/neumorphic';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { useLoginMutation } from '../../store/api/authApi';
import { useAppSelector } from '../../store/hooks';

const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [error, setError] = useState<string>('');

  const locationState = location.state as { from?: string; email?: string; message?: string } | null;
  const prefillEmail = locationState?.email || '';
  const successMessage = locationState?.message || '';

  const [formData, setFormData] = useState({
    email: prefillEmail,
    password: ''
  });

  // Update form when prefillEmail changes
  useEffect(() => {
    if (prefillEmail) {
      setFormData(prev => ({ ...prev, email: prefillEmail }));
    }
  }, [prefillEmail]);

  // Redirect if already authenticated - go back to checkout flow
  useEffect(() => {
    if (isAuthenticated && user) {
      // Customer logged in, redirect to guest-checkout to collect delivery info
      // (even logged-in users need to provide delivery address)
      navigate('/guest-checkout');
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setError('');
      await login({ email, password }).unwrap();
      // Redirect happens via useEffect when isAuthenticated changes
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.data?.message || err?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    await handleLogin(formData.email, formData.password);
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    padding: `${spacing[8]} ${spacing[4]}`,
    fontFamily: typography.fontFamily.primary,
  };

  const errorMessageStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'base', 'lg'),
    backgroundColor: colors.surface.primary,
    color: colors.semantic.error,
    padding: `${spacing[4]} ${spacing[5]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    borderLeft: `4px solid ${colors.semantic.error}`,
    marginBottom: spacing[6],
  };

  const successMessageStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'base', 'lg'),
    backgroundColor: colors.surface.primary,
    color: colors.semantic.success,
    padding: `${spacing[4]} ${spacing[5]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    borderLeft: `4px solid ${colors.semantic.success}`,
    marginBottom: spacing[6],
  };

  return (
    <div style={containerStyles}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: spacing[6] }}>
          <button
            onClick={() => navigate('/checkout')}
            style={{
              ...createNeumorphicSurface('raised', 'sm', 'base'),
              padding: spacing[2],
              marginBottom: spacing[4],
              cursor: 'pointer',
              border: 'none',
              fontSize: typography.fontSize.lg,
            }}
          >
            ← Back to Checkout
          </button>

          <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
            <div style={{ fontSize: '60px', marginBottom: spacing[3] }}>🔐</div>
            <h1 style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary,
              margin: `0 0 ${spacing[2]} 0`,
            }}>
              Welcome Back
            </h1>
            <p style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              margin: 0,
            }}>
              Login to continue with your order
            </p>
          </div>
        </div>

        <Card elevation="lg" padding="xl">
          {successMessage && <div style={successMessageStyles}>{successMessage}</div>}
          {error && <div style={errorMessageStyles}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              size="lg"
              state={error && !formData.email ? 'error' : 'default'}
              leftIcon="📧"
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              size="lg"
              state={error && formData.password.length < 6 ? 'error' : 'default'}
              showPasswordToggle
              leftIcon="🔒"
            />

            <Button
              type="submit"
              variant="primary"
              size="xl"
              isLoading={isLoading}
              disabled={isLoading}
              fullWidth
              rightIcon="→"
            >
              {isLoading ? 'Signing In...' : 'Login & Continue'}
            </Button>
          </form>

          <div style={{
            marginTop: spacing[6],
            paddingTop: spacing[5],
            borderTop: `1px solid ${colors.surface.tertiary}`,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0,
            }}>
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register', { state: { from: '/checkout' } })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.brand.primary,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Create Account
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
