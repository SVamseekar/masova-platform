import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import axios from 'axios';
import { Button, Card, Input } from '../../components/ui/neumorphic';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const from = (location.state as any)?.from || '/checkout';

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterFormData>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegisterFormData> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Phone must be 10 digits';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/users/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        type: 'CUSTOMER',
        active: true,
      });

      if (response.data) {
        navigate('/login', {
          state: {
            from: from,
            email: formData.email,
            message: 'Registration successful! Please login to continue.',
          },
        });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    padding: `${spacing[8]} ${spacing[4]}`,
    fontFamily: typography.fontFamily.primary,
  };

  return (
    <div style={containerStyles}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: spacing[6] }}>
          <button
            onClick={() => navigate(-1)}
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

          <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
            <div style={{ fontSize: '60px', marginBottom: spacing[3] }}>✨</div>
            <h1 style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary,
              margin: `0 0 ${spacing[2]} 0`,
            }}>
              Create Account
            </h1>
            <p style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              margin: 0,
            }}>
              Join MaSoVa and enjoy faster checkouts and exclusive deals
            </p>
          </div>
        </div>

        <Card elevation="lg" padding="xl">
          {error && (
            <div style={{
              ...createNeumorphicSurface('inset', 'base', 'base'),
              backgroundColor: colors.semantic.errorLight,
              border: `1px solid ${colors.semantic.error}`,
              color: colors.semantic.errorDark,
              padding: spacing[4],
              marginBottom: spacing[5],
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              borderLeft: `4px solid ${colors.semantic.error}`,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                state={validationErrors.firstName ? 'error' : 'default'}
                helperText={validationErrors.firstName}
                disabled={loading}
                size="lg"
                leftIcon="👤"
                required
              />

              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                state={validationErrors.lastName ? 'error' : 'default'}
                helperText={validationErrors.lastName}
                disabled={loading}
                size="lg"
                required
              />
            </div>

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              state={validationErrors.email ? 'error' : 'default'}
              helperText={validationErrors.email}
              disabled={loading}
              size="lg"
              leftIcon="📧"
              required
            />

            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              state={validationErrors.phone ? 'error' : 'default'}
              helperText={validationErrors.phone || '10-digit mobile number'}
              placeholder="Enter your phone number"
              disabled={loading}
              size="lg"
              leftIcon="📱"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              state={validationErrors.password ? 'error' : 'default'}
              helperText={validationErrors.password || 'Minimum 6 characters'}
              disabled={loading}
              size="lg"
              leftIcon="🔒"
              showPasswordToggle
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              state={validationErrors.confirmPassword ? 'error' : 'default'}
              helperText={validationErrors.confirmPassword}
              disabled={loading}
              size="lg"
              leftIcon="🔒"
              showPasswordToggle
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="xl"
              fullWidth
              isLoading={loading}
              disabled={loading}
            >
              Create Account
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
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login', { state: { from } })}
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
                Login here
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
