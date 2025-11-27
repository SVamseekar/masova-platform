import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useRegisterMutation } from '../../store/api/authApi';
import { useCreateCustomerMutation } from '../../store/api/customerApi';
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
  console.log('RegisterPage loaded');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const from = (location.state as any)?.from || '/checkout';
  const [register, { isLoading }] = useRegisterMutation();
  const [createCustomer] = useCreateCustomerMutation();
  console.log('isLoading:', isLoading);

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterFormData>>({});
  const currentUser = useAppSelector(state => state.auth.user);

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
    } else if (!/^[6-9][0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Enter valid 10-digit Indian mobile number';
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
    console.log('Form submitted');
    setError('');

    console.log('Form data:', formData);
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    console.log('Validation passed, registering...');
    try {
      // Clean phone number - remove any spaces, dashes, or special characters
      const cleanPhone = formData.phone.replace(/\D/g, '');

      // Step 1: Register the user account
      const result = await register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: cleanPhone,
        password: formData.password,
        type: 'CUSTOMER',
        rememberMe: true,
      }).unwrap();

      console.log('Registration successful:', result);

      // Step 2: Create customer profile immediately
      try {
        console.log('Creating customer profile for new user...');
        await createCustomer({
          userId: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: cleanPhone,
          marketingOptIn: false,
          smsOptIn: false,
        }).unwrap();
        console.log('Customer profile created successfully');
      } catch (customerErr: any) {
        console.error('Failed to create customer profile during registration:', customerErr);
        // Don't block user - they can still proceed, profile will be auto-created later
      }

      // User is now automatically logged in with tokens stored in Redux
      // Navigate to the original destination or checkout
      navigate(from);
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = err?.data?.message || err?.data?.error || err?.message || 'Registration failed. Please try again.';

      // Provide more user-friendly error messages
      if (errorMessage.toLowerCase().includes('email already exists')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('exists')) {
        errorMessage = 'This phone number is already registered. Please use a different phone number or try logging in.';
      }

      setError(errorMessage);
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
          {isAuthenticated && currentUser ? (
            <div>
              <div style={{
                ...createNeumorphicSurface('inset', 'base', 'base'),
                backgroundColor: colors.brand.primaryLight,
                border: `1px solid ${colors.brand.primary}`,
                color: colors.brand.primaryDark,
                padding: spacing[6],
                marginBottom: spacing[5],
                fontSize: typography.fontSize.base,
                textAlign: 'center',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: spacing[4] }}>👋</div>
                <h2 style={{
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  marginBottom: spacing[3],
                  color: colors.text.primary,
                }}>
                  You're Already Logged In!
                </h2>
                <p style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.secondary,
                  marginBottom: spacing[6],
                }}>
                  Welcome back, <strong>{currentUser.name}</strong>!<br/>
                  You don't need to create a new account.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/guest-checkout')}
                  >
                    Continue to Checkout
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                  >
                    Logout & Create New Account
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              isLoading={isLoading}
              disabled={isLoading}
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
                onClick={() => navigate('/customer-login', { state: { from } })}
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
