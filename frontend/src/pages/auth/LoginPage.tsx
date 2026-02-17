import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Checkbox } from '../../components/ui/neumorphic';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { useLoginMutation } from '../../store/api/authApi';
import { useAppSelector } from '../../store/hooks';
import { useToast } from '../../hooks/useToast';
import { getSavedReturnUrl, clearReturnUrl } from '../../utils/security';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import KitchenIcon from '@mui/icons-material/Kitchen';

interface DemoAccount {
  type: string;
  email: string;
  password: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  description: string;
  route: string;
  accentColor: string;
}

const demoAccounts: DemoAccount[] = [
  {
    type: 'Manager',
    email: 'suresh.manager@masova.com',
    password: 'manager123',
    Icon: ManageAccountsIcon,
    description: 'Store Management Dashboard',
    route: '/manager',
    accentColor: '#7B1FA2',
  },
  {
    type: 'Kitchen Staff',
    email: 'rahul.staff@masova.com',
    password: 'staff123',
    Icon: RestaurantIcon,
    description: 'Kitchen Display System',
    route: '/kitchen',
    accentColor: '#FF6B35',
  },
  {
    type: 'Driver',
    email: 'ravi.driver@masova.com',
    password: 'driver123',
    Icon: LocalShippingIcon,
    description: 'Delivery Management',
    route: '/driver',
    accentColor: '#00B14F',
  },
  {
    type: 'Kiosk (POS)',
    email: 'kiosk.pos@masova.com',
    password: 'kiosk123',
    Icon: PointOfSaleIcon,
    description: 'Point of Sale Terminal',
    route: '/pos',
    accentColor: '#2196F3',
  },
  {
    type: 'Asst. Manager',
    email: 'rohan.asst@masova.com',
    password: 'asst123',
    Icon: SupervisorAccountIcon,
    description: 'Operations Support',
    route: '/manager',
    accentColor: '#FF9800',
  },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const [error, setError] = useState<string>('');
  const [activeDemo, setActiveDemo] = useState<string>('');
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleForgotPassword = () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    // In production: call POST /api/users/forgot-password
    setForgotSubmitted(true);
  };

  // Redirect if already authenticated (staff login only)
  useEffect(() => {
    if (isAuthenticated && user) {
      const returnUrl = getSavedReturnUrl();
      if (returnUrl) {
        clearReturnUrl();
        navigate(returnUrl, { replace: true });
        return;
      }

      const userType = user.type?.toLowerCase();
      if (userType?.includes('manager')) {
        navigate('/manager', { replace: true });
      } else if (userType?.includes('staff')) {
        navigate('/kitchen', { replace: true });
      } else if (userType?.includes('driver')) {
        navigate('/driver', { replace: true });
      } else if (userType?.includes('customer')) {
        navigate('/checkout', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      setError('');
      const result = await login({ email, password, rememberMe }).unwrap();

      if (result.user.type === 'CUSTOMER') {
        setError('Customers should use the customer login page. Redirecting...');
        setTimeout(() => navigate('/customer-login'), 2000);
        return;
      }
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

    await handleLogin(formData.email, formData.password, formData.rememberMe);
  };

  const handleDemoLogin = async (account: DemoAccount): Promise<void> => {
    setActiveDemo(account.type);
    setError('');
    setFormData({ email: account.email, password: account.password, rememberMe: true });

    setTimeout(async () => {
      await handleLogin(account.email, account.password, true);
      setActiveDemo('');
    }, 500);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // ─── Styles ───────────────────────────────────────────────────────────────

  const containerStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    background: colors.surface.background,
  };

  const outerGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
    animation: 'slideIn 0.5s ease',
  };

  const leftPanelStyles: React.CSSProperties = {
    background: '#111111',
    color: '#ffffff',
    padding: isMobile ? `${spacing[8]} ${spacing[6]}` : `${spacing[12]} ${spacing[10]}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: spacing[8],
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 40px,
        rgba(255,255,255,0.025) 40px,
        rgba(255,255,255,0.025) 41px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 40px,
        rgba(255,255,255,0.025) 40px,
        rgba(255,255,255,0.025) 41px
      )
    `,
  };

  const rightPanelStyles: React.CSSProperties = {
    backgroundColor: colors.surface.primary,
    padding: isMobile ? `${spacing[8]} ${spacing[6]}` : `${spacing[12]} ${spacing[10]}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
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

  const features = [
    { Icon: ShowChartIcon, text: 'Real-time Store Analytics' },
    { Icon: KitchenIcon, text: 'Kitchen Management System' },
    { Icon: DeliveryDiningIcon, text: 'Delivery Tracking & Orders' },
    { Icon: PeopleAltIcon, text: 'Staff & Employee Management' },
  ];

  return (
    <div style={containerStyles}>
      <div style={outerGridStyles}>

        {/* ─── LEFT: Dark Brand Panel ─────────────────────────────── */}
        <div style={leftPanelStyles}>

          {/* Brand identity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[8] }}>
              <div style={{
                width: '44px', height: '44px',
                background: colors.semantic.error,
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontSize: '20px', fontWeight: '900', fontFamily: typography.fontFamily.primary }}>M</span>
              </div>
              <span style={{
                fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px',
                color: '#fff', fontFamily: typography.fontFamily.primary,
              }}>MaSoVa</span>
            </div>

            <h1 style={{
              fontSize: isMobile ? '28px' : '34px',
              fontWeight: '800',
              lineHeight: 1.2,
              marginBottom: spacing[4],
              color: '#fff',
              fontFamily: typography.fontFamily.primary,
              margin: `0 0 ${spacing[4]} 0`,
            }}>
              Restaurant Management,<br />
              <span style={{ color: colors.semantic.error }}>Simplified.</span>
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: '340px', margin: 0 }}>
              One platform for your kitchen, delivery, payments, and analytics.
            </p>
          </div>

          {/* Demo role cards — 5 roles */}
          <div>
            <p style={{
              fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)',
              marginBottom: spacing[4], margin: `0 0 ${spacing[4]} 0`,
            }}>
              Quick Demo Access
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: spacing[3],
            }}>
              {demoAccounts.map((account) => (
                <button
                  key={account.type}
                  onClick={() => handleDemoLogin(account)}
                  disabled={isLoading}
                  style={{
                    background: activeDemo === account.type
                      ? `rgba(${account.accentColor === '#00B14F' ? '0,177,79' : account.accentColor === '#7B1FA2' ? '123,31,162' : account.accentColor === '#FF6B35' ? '255,107,53' : account.accentColor === '#2196F3' ? '33,150,243' : '255,152,0'},0.15)`
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeDemo === account.type ? account.accentColor : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px',
                    padding: `${spacing[3]} ${spacing[3]}`,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    opacity: isLoading && activeDemo !== account.type ? 0.5 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!isLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={e => {
                    if (activeDemo !== account.type) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <account.Icon style={{ color: account.accentColor, fontSize: '20px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', lineHeight: 1.2 }}>
                      {account.type}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                      {account.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {features.map(({ Icon, text }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: spacing[3],
                fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500',
              }}>
                <Icon style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Login Form ─────────────────────────────────── */}
        <div style={rightPanelStyles}>

          {!showForgotPassword ? (
            <>
              <div style={{ marginBottom: spacing[8] }}>
                <h2 style={{
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.extrabold,
                  color: colors.text.primary,
                  margin: `0 0 ${spacing[2]} 0`,
                }}>
                  Sign In
                </h2>
                <p style={{ color: colors.text.secondary, fontSize: typography.fontSize.base, margin: 0 }}>
                  Access your MaSoVa management account
                </p>
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
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Checkbox
                    label="Remember me"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    disabled={isLoading}
                    size="base"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setError(''); }}
                    style={{
                      background: 'none', border: 'none',
                      color: colors.brand.primary,
                      cursor: 'pointer',
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="xl"
                  isLoading={isLoading}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Store'}
                </Button>
              </form>

              <div style={{
                marginTop: spacing[6],
                textAlign: 'center',
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
              }}>
                Click any demo role on the left for instant access
              </div>
            </>
          ) : forgotSubmitted ? (
            /* ── Forgot password: success state ── */
            <div style={{ textAlign: 'center', padding: `${spacing[8]} 0` }}>
              <div style={{
                width: '64px', height: '64px',
                borderRadius: '50%',
                background: `${colors.semantic.success}22`,
                border: `2px solid ${colors.semantic.success}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: `0 auto ${spacing[5]}`,
              }}>
                <span style={{ fontSize: '28px', color: colors.semantic.success, lineHeight: 1 }}>✓</span>
              </div>
              <h3 style={{ margin: `0 0 ${spacing[2]} 0`, color: colors.text.primary, fontWeight: '700' }}>
                Check your email
              </h3>
              <p style={{ color: colors.text.secondary, marginBottom: spacing[8], fontSize: typography.fontSize.sm }}>
                If <strong>{forgotEmail}</strong> has an account, a reset link has been sent.
              </p>
              <Button
                variant="secondary"
                onClick={() => { setShowForgotPassword(false); setForgotSubmitted(false); setForgotEmail(''); }}
              >
                Back to login
              </Button>
            </div>
          ) : (
            /* ── Forgot password: email input ── */
            <div>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setError(''); }}
                style={{
                  background: 'none', border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  padding: 0,
                  display: 'flex', alignItems: 'center', gap: spacing[1],
                  marginBottom: spacing[6],
                }}
              >
                ← Back
              </button>
              <h2 style={{ margin: `0 0 ${spacing[2]} 0`, fontWeight: '800', color: colors.text.primary }}>
                Reset Password
              </h2>
              <p style={{ color: colors.text.secondary, marginBottom: spacing[8], fontSize: typography.fontSize.sm }}>
                Enter your email and we'll send a reset link.
              </p>

              {error && <div style={errorMessageStyles}>{error}</div>}

              <Input
                type="email"
                label="Email Address"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={e => { setForgotEmail(e.target.value); if (error) setError(''); }}
                size="lg"
              />

              <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[6] }}>
                <Button
                  variant="secondary"
                  onClick={() => { setShowForgotPassword(false); setError(''); }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleForgotPassword} fullWidth>
                  Send Reset Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .login-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
