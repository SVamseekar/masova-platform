import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartItemCount } from '../../store/slices/cartSlice';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import NotificationBell from '../notifications/NotificationBell';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backRoute?: string;
  hideStaffLogin?: boolean;  // Hide staff login button for public pages
  showPublicNav?: boolean; // Show Home, Offers, Cart buttons
  onCartClick?: () => void; // Handler for cart button
  showTrackOrder?: boolean; // Show track order button for customers with active orders
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  backRoute = '/',
  hideStaffLogin = false,
  showPublicNav = false,
  onCartClick,
  showTrackOrder = false
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItemCount = useAppSelector(selectCartItemCount);

  // Dropdown menu state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check for active order in sessionStorage
  // Works for both guests (temporary tracking) and logged-in customers (saved to profile)
  const activeOrderId = sessionStorage.getItem('activeOrderId');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    const isCustomer = currentUser?.type?.toLowerCase() === 'customer';
    // Clear active order from sessionStorage on logout
    sessionStorage.removeItem('activeOrderId');
    setIsDropdownOpen(false);
    dispatch(logout());
    // Customers go to home, staff go to login
    navigate(isCustomer ? '/' : '/login');
  };

  const handleMenuItemClick = (path: string) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleBack = () => {
    navigate(backRoute);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Styles
  const headerStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'lg', 'xl'),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing[4]} ${spacing[6]}`,
    marginBottom: spacing[6],
    backgroundColor: colors.surface.primary,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  };

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
  };

  const logoStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
  };

  const userInfoStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginRight: spacing[2],
  };

  const userNameStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const userRoleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  };

  const buttonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const logoutButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    background: `linear-gradient(135deg, ${colors.semantic.error} 0%, ${colors.semantic.errorLight} 100%)`,
    color: colors.text.inverse,
  };

  const backButtonStyles: React.CSSProperties = {
    ...buttonStyles,
  };

  // Dropdown menu styles
  const dropdownContainerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  const userButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[4]}`,
    cursor: 'pointer',
  };

  const dropdownMenuStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'md', 'lg'),
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: '220px',
    backgroundColor: colors.surface.primary,
    zIndex: 1000,
    opacity: isDropdownOpen ? 1 : 0,
    visibility: isDropdownOpen ? 'visible' : 'hidden',
    transform: isDropdownOpen ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const dropdownItemStyles: React.CSSProperties = {
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    borderBottom: `1px solid ${colors.surface.tertiary}`,
  };

  const dropdownItemHoverStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'base'),
    backgroundColor: colors.brand.primaryLight + '10',
  };

  const dropdownDividerStyles: React.CSSProperties = {
    height: '1px',
    backgroundColor: colors.surface.tertiary,
    margin: `${spacing[2]} 0`,
  };

  const logoutItemStyles: React.CSSProperties = {
    ...dropdownItemStyles,
    color: colors.semantic.error,
    fontWeight: typography.fontWeight.semibold,
    borderBottom: 'none',
  };

  return (
    <header style={headerStyles}>
      <div style={leftSectionStyles}>
        <div style={logoStyles} onClick={handleGoHome}>
          MaSoVa
        </div>
        {showBackButton && (
          <button
            style={backButtonStyles}
            onClick={handleBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = shadows.raised.md;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = shadows.raised.sm;
            }}
          >
            ← Back
          </button>
        )}
        {title && <h1 style={titleStyles}>{title}</h1>}
      </div>

      <div style={rightSectionStyles}>
        {showPublicNav ? (
          <>
            {/* Notification Bell for logged-in users */}
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', marginRight: spacing[2] }}>
                <NotificationBell />
              </div>
            )}
            <button
              style={buttonStyles}
              onClick={() => navigate('/')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = shadows.raised.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = shadows.raised.sm;
              }}
            >
              🏠 Home
            </button>
            <button
              style={buttonStyles}
              onClick={() => navigate('/promotions')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = shadows.raised.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = shadows.raised.sm;
              }}
            >
              🎁 Offers
            </button>

            {/* Track Order button - shown when there's an active order */}
            {(showTrackOrder || activeOrderId) && (
              <button
                style={{
                  ...buttonStyles,
                  background: `linear-gradient(135deg, ${colors.semantic.warning} 0%, ${colors.semantic.warningLight} 100%)`,
                  color: colors.text.inverse,
                  fontWeight: typography.fontWeight.bold,
                }}
                onClick={() => navigate(`/tracking/${activeOrderId}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = shadows.raised.lg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.raised.base;
                }}
              >
                📦 Track Order
              </button>
            )}

            <button
              style={{
                ...buttonStyles,
                background: cartItemCount > 0
                  ? `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`
                  : buttonStyles.background,
                color: cartItemCount > 0 ? colors.text.inverse : colors.text.primary,
                position: 'relative',
              }}
              onClick={onCartClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = shadows.raised.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = cartItemCount > 0 ? shadows.raised.base : shadows.raised.sm;
              }}
            >
              🛒 Cart
              {cartItemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: colors.semantic.error,
                  color: colors.text.inverse,
                  borderRadius: borderRadius.full,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  minWidth: '20px',
                  textAlign: 'center',
                }}>
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User dropdown menu for logged-in customers on public pages */}
            {currentUser ? (
              <div ref={dropdownRef} style={dropdownContainerStyles}>
                <button
                  style={userButtonStyles}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = shadows.raised.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadows.raised.sm;
                  }}
                >
                  <span>👤</span>
                  <span>{currentUser.name}</span>
                  <span style={{ fontSize: typography.fontSize.xs }}>
                    {isDropdownOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div style={dropdownMenuStyles}>
                  <div
                    style={dropdownItemStyles}
                    onClick={() => handleMenuItemClick('/customer-dashboard')}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, dropdownItemHoverStyles);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <span>📊</span>
                    <span>My Orders</span>
                  </div>

                  <div
                    style={dropdownItemStyles}
                    onClick={() => handleMenuItemClick('/customer/profile')}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, dropdownItemHoverStyles);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </div>

                  <div style={dropdownDividerStyles} />

                  <div
                    style={logoutItemStyles}
                    onClick={handleLogout}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, dropdownItemHoverStyles);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                style={{
                  ...buttonStyles,
                  background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, ${colors.brand.secondaryLight} 100%)`,
                  color: colors.text.inverse,
                }}
                onClick={() => navigate('/checkout')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = shadows.raised.lg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.raised.base;
                }}
              >
                👤 Login
              </button>
            )}
          </>
        ) : (
          <>
            {/* Notification Bell for staff/manager users */}
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', marginRight: spacing[2] }}>
                <NotificationBell />
              </div>
            )}
            {currentUser && (
              <div style={userInfoStyles}>
                <span style={userNameStyles}>{currentUser.name}</span>
                <span style={userRoleStyles}>{currentUser.type}</span>
              </div>
            )}

            {currentUser ? (
              <button
                style={logoutButtonStyles}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = shadows.raised.lg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.raised.base;
                }}
              >
                Logout →
              </button>
            ) : !hideStaffLogin && (
              <button
                style={{
                  ...buttonStyles,
                  background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
                  color: colors.text.inverse,
                }}
                onClick={() => navigate('/login')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = shadows.raised.lg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.raised.base;
                }}
              >
                Staff Login →
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
