import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/ui/neumorphic';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface, createResponsive } from '../../styles/neumorphic-utils';
import { useLoginMutation } from '../../store/api/authApi';
import { useAppSelector } from '../../store/hooks';

interface DemoAccount {
  type: string;
  email: string;
  password: string;
  icon: string;
  description: string;
  route: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [error, setError] = useState<string>('');
  const [activeDemo, setActiveDemo] = useState<string>('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already authenticated (staff login only)
  useEffect(() => {
    if (isAuthenticated && user) {
      const userType = user.type?.toLowerCase();
      if (userType?.includes('manager')) {
        navigate('/manager');
      } else if (userType?.includes('staff')) {
        navigate('/kitchen');
      } else if (userType?.includes('driver')) {
        navigate('/driver');
      } else if (userType?.includes('customer')) {
        // Customers shouldn't use this login page, redirect to checkout
        navigate('/checkout');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const demoAccounts: DemoAccount[] = [
    {
      type: 'Manager',
      email: 'suresh.manager@masova.com',
      password: 'manager123',
      icon: '👨‍💼',
      description: 'Store Management Dashboard',
      route: '/manager'
    },
    {
      type: 'Kitchen Staff',
      email: 'rahul.staff@masova.com',
      password: 'staff123',
      icon: '👨‍🍳',
      description: 'Kitchen Display System',
      route: '/kitchen'
    },
    {
      type: 'Driver',
      email: 'rajesh.driver@masova.com',
      password: 'driver123',
      icon: '🚚',
      description: 'Delivery Management',
      route: '/driver'
    },
  ];

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

      // Call the actual API
      const result = await login({ email, password }).unwrap();

      // Redux will handle token storage via extraReducers in authSlice
      // Navigation will happen via useEffect when isAuthenticated changes

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

  const handleDemoLogin = async (account: DemoAccount): Promise<void> => {
    setActiveDemo(account.type);
    setError('');
    setFormData({
      email: account.email,
      password: account.password
    });
    
    setTimeout(async () => {
      await handleLogin(account.email, account.password);
      setActiveDemo('');
    }, 500);
  };

  // Styles using the design system
  const containerStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    backgroundColor: colors.surface.background,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
  };

  const mainCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'xl', '3xl'),
    width: '100%',
    maxWidth: '1200px',
    overflow: 'hidden',
    borderTop: `4px solid ${colors.brand.primary}`,
    animation: 'slideIn 0.8s ease',
  };

  const contentGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '600px',
    ...createResponsive({
      md: { gridTemplateColumns: '1fr' }
    })
  };

  const brandSectionStyles: React.CSSProperties = {
    background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, ${colors.brand.secondaryDark} 100%)`,
    padding: `${spacing[16]} ${spacing[10]}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: colors.text.inverse,
    position: 'relative',
  };

  const formSectionStyles: React.CSSProperties = {
    backgroundColor: colors.surface.primary,
    padding: `${spacing[16]} ${spacing[10]}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  const logoStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing[10],
    position: 'relative',
    zIndex: 1,
  };

  const logoIconStyles: React.CSSProperties = {
    fontSize: '80px',
    marginBottom: spacing[5],
    display: 'block',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
  };

  const logoTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing[2],
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    color: colors.text.inverse,
    margin: 0,
  };

  const logoSubtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    margin: 0,
  };

  const demoSectionStyles: React.CSSProperties = {
    marginBottom: spacing[8],
    position: 'relative',
    zIndex: 1,
  };

  const demoTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing[5],
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    margin: `0 0 ${spacing[5]} 0`,
  };

  const demoGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[3],
    ...createResponsive({
      sm: { gridTemplateColumns: '1fr' }
    })
  };

  const getDemoCardStyles = (isActive: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isActive ? 'inset' : 'raised', 'base', 'lg'),
    backgroundColor: isActive ? 'rgba(227, 24, 55, 0.2)' : 'rgba(255, 255, 255, 0.15)',
    border: `2px solid ${isActive ? colors.brand.primary : 'rgba(255, 255, 255, 0.2)'}`,
    padding: spacing[4],
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 250ms ease',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    overflow: 'hidden',
    opacity: isLoading && !isActive ? 0.6 : 1,
  });

  const formHeaderStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing[10],
  };

  const formTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.brand.secondary,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    margin: `0 0 ${spacing[2]} 0`,
  };

  const formSubtitleStyles: React.CSSProperties = {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    margin: 0,
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

  // Staff login UI
  return (
    <div style={containerStyles}>
      <div style={mainCardStyles}>
        <div style={contentGridStyles}>
          {/* Brand Section */}
          <div style={brandSectionStyles}>
            <div style={logoStyles}>
              <span style={logoIconStyles}>🍽️</span>
              <h1 style={logoTitleStyles}>MaSoVa</h1>
              <p style={logoSubtitleStyles}>Restaurant Management</p>
            </div>

            <div style={demoSectionStyles}>
              <h3 style={demoTitleStyles}>Quick Demo Access</h3>
              <div style={demoGridStyles}>
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    style={getDemoCardStyles(activeDemo === account.type)}
                    onClick={() => handleDemoLogin(account)}
                    disabled={isLoading}
                  >
                    <span style={{ fontSize: '28px', marginBottom: spacing[2], display: 'block' }}>
                      {account.icon}
                    </span>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      marginBottom: spacing[1],
                      textTransform: 'uppercase',
                      letterSpacing: typography.letterSpacing.wide,
                    }}>
                      {account.type}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      opacity: 0.8,
                      lineHeight: typography.lineHeight.tight
                    }}>
                      {account.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Features Section */}
            <div>
              <h4 style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                textAlign: 'center',
                marginBottom: spacing[4],
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wide,
                opacity: 0.9,
                margin: `0 0 ${spacing[4]} 0`,
              }}>
                System Features
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                {[
                  { icon: '📊', text: 'Real-time Store Analytics' },
                  { icon: '🍕', text: 'Kitchen Management System' },
                  { icon: '🚚', text: 'Delivery Tracking & Orders' },
                  { icon: '👥', text: 'Staff & Employee Management' },
                ].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                    padding: `${spacing[2]} 0`,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    opacity: 0.8,
                  }}>
                    <span style={{ fontSize: '20px', width: '24px', textAlign: 'center' }}>
                      {feature.icon}
                    </span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div style={formSectionStyles}>
            <div style={formHeaderStyles}>
              <h2 style={formTitleStyles}>Sign In</h2>
              <p style={formSubtitleStyles}>Access your MaSoVa management account</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
              {error && <div style={errorMessageStyles}>{error}</div>}

              <Input
                type="email"
                name="email"
                label="Email Address"
                placeholder="Enter your work email"
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
                {isLoading ? 'Signing In...' : 'Sign In to Store'}
              </Button>
            </form>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: `${spacing[8]} 0 ${spacing[5]}`,
              gap: spacing[4],
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colors.shadow.dark}, transparent)`,
              }} />
              <span style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                fontWeight: typography.fontWeight.semibold,
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wide,
              }}>
                or
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colors.shadow.dark}, transparent)`,
              }} />
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium,
            }}>
              Click any demo role above for instant access
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 1024px) {
          .main-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;