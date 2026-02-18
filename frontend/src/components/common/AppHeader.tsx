import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartItemCount } from '../../store/slices/cartSlice';
import { colors, spacing, typography, shadows, borderRadius, components } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import StoreSelector from '../StoreSelector';
import ManagementHubSidebar from './ManagementHubSidebar';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backRoute?: string;
  onBack?: () => void;
  hideStaffLogin?: boolean;
  showPublicNav?: boolean;
  showManagerNav?: boolean;
  onCartClick?: () => void;
  storeSelectorContextKey?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  backRoute = '/',
  onBack,
  hideStaffLogin = false,
  showPublicNav = false,
  showManagerNav = false,
  onCartClick,
  storeSelectorContextKey
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItemCount = useAppSelector(selectCartItemCount);

  const effectiveContextKey = storeSelectorContextKey ||
    (showManagerNav ? location.pathname.replace(/^\/manager\//, '').replace(/\//g, '-') : undefined);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isManagementHubOpen, setIsManagementHubOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOrderId = sessionStorage.getItem('activeOrderId');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCustomer = currentUser?.type === 'CUSTOMER';
  const isStaff = currentUser && !isCustomer;

  const handleLogout = () => {
    if (isStaff && location.pathname !== '/staff-login' && location.pathname !== '/login') {
      const returnUrl = location.pathname + location.search;
      sessionStorage.setItem('returnUrl', returnUrl);
    }
    sessionStorage.removeItem('activeOrderId');
    setIsDropdownOpen(false);
    dispatch(logout());
    navigate(isCustomer ? '/' : '/staff-login');
  };

  const handleMenuItemClick = (path: string) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleBack = () => {
    if (onBack) { onBack(); } else { navigate(backRoute); }
  };

  const handleGoHome = () => navigate('/');

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC NAV — Dark Glassmorphic (customer-facing pages)
  // ──────────────────────────────────────────────────────────────────────────
  if (showPublicNav) {
    const navLinkStyle: React.CSSProperties = {
      color: 'var(--text-2)',
      fontFamily: 'var(--font-body)',
      fontSize: '0.9rem',
      fontWeight: 500,
      textDecoration: 'none',
      paddingBottom: '2px',
      borderBottom: '2px solid transparent',
      cursor: 'pointer',
      transition: 'var(--transition)',
      background: 'none',
      border: 'none',
      borderBottomWidth: '2px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'transparent',
    };

    return (
      <>
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          background: 'rgba(10, 9, 8, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          height: '64px',
        }}>
          {/* Logo */}
          <div
            onClick={handleGoHome}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.5rem',
              color: 'var(--gold)',
              letterSpacing: '-0.02em',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            MaSoVa
          </div>

          {/* Centre nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {[
              { label: 'Menu', path: '/menu' },
              { label: 'Promotions', path: '/promotions' },
              ...(activeOrderId ? [{ label: 'Track Order', path: `/tracking/${activeOrderId}` }] : []),
            ].map(link => (
              <button
                key={link.label}
                style={{
                  ...navLinkStyle,
                  color: location.pathname === link.path ? 'var(--gold)' : 'var(--text-2)',
                  borderBottomColor: location.pathname === link.path ? 'var(--gold)' : 'transparent',
                }}
                onClick={() => navigate(link.path)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                  (e.currentTarget as HTMLElement).style.borderBottomColor = 'var(--gold)';
                }}
                onMouseLeave={(e) => {
                  const isActive = location.pathname === link.path;
                  (e.currentTarget as HTMLElement).style.color = isActive ? 'var(--gold)' : 'var(--text-2)';
                  (e.currentTarget as HTMLElement).style.borderBottomColor = isActive ? 'var(--gold)' : 'transparent';
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right: cart + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Cart button — not for staff */}
            {!isStaff && (
              <button
                onClick={onCartClick}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-2)',
                  fontSize: '1.35rem',
                  transition: 'var(--transition)',
                  padding: '4px',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                aria-label="Open cart"
              >
                🛒
                {cartItemCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--red)',
                    color: '#fff',
                    borderRadius: '999px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-body)',
                    padding: '0 4px',
                  }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Staff users on public pages */}
            {isStaff ? (
              <button
                style={{
                  background: 'rgba(212,168,67,0.15)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onClick={() => {
                  const userType = currentUser?.type;
                  if (userType === 'MANAGER' || userType === 'ASSISTANT_MANAGER') navigate('/manager');
                  else if (userType === 'STAFF') navigate('/staff');
                  else if (userType === 'DRIVER') navigate('/driver');
                }}
              >
                {currentUser?.name} → Dashboard
              </button>
            ) : currentUser ? (
              /* Customer dropdown */
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  <span>👤</span>
                  <span>{currentUser.name}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{isDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '200px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-card)',
                    overflow: 'hidden',
                    zIndex: 1300,
                  }}>
                    {[
                      { icon: '📦', label: 'My Orders', path: '/customer/orders' },
                      ...(activeOrderId ? [{ icon: '🚚', label: 'Track Order', path: `/tracking/${activeOrderId}` }] : []),
                      { icon: '👤', label: 'My Profile', path: '/customer/profile' },
                    ].map(item => (
                      <div
                        key={item.label}
                        onClick={() => handleMenuItemClick(item.path)}
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          color: 'var(--text-2)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                        }}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    <div
                      onClick={handleLogout}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'var(--red-light)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In pill */
              <button
                onClick={() => navigate('/checkout')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <ManagementHubSidebar
          isOpen={isManagementHubOpen}
          onClose={() => setIsManagementHubOpen(false)}
        />
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAFF / MANAGER NAV — unchanged neumorphic styling
  // ──────────────────────────────────────────────────────────────────────────
  const headerHeight = showManagerNav ? '64px' : components.header.height.compact;

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: headerHeight,
    padding: showManagerNav ? `0 ${spacing[6]}` : `${components.header.padding.vertical} ${components.header.padding.horizontal}`,
    background: showManagerNav ? colors.surface.background : colors.surface.primary,
    borderBottom: showManagerNav ? `1px solid ${colors.surface.border}` : 'none',
    boxShadow: showManagerNav ? '0 1px 3px rgba(0, 0, 0, 0.05)' : shadows.raised.lg,
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backdropFilter: showManagerNav ? 'blur(8px)' : 'none',
    backgroundColor: showManagerNav ? colors.surface.background : colors.surface.primary,
    transition: 'all 0.3s ease',
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
    letterSpacing: '-0.5px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    letterSpacing: '-0.3px',
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
    ...createNeumorphicSurface('raised', 'base', 'md'),
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    background: colors.surface.primary,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    height: '36px',
  };

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
  };

  const dropdownItemHoverStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'base'),
    backgroundColor: colors.brand.primaryLight + '10',
  };

  const logoutItemStyles: React.CSSProperties = {
    ...dropdownItemStyles,
    color: colors.semantic.error,
    fontWeight: typography.fontWeight.semibold,
  };

  return (
    <>
      <header style={headerStyles}>
        {showManagerNav && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            overflow: 'hidden', borderRadius: '16px', pointerEvents: 'none', zIndex: 0,
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%)',
              borderRadius: '16px 16px 0 0',
            }} />
          </div>
        )}
        <div style={{...leftSectionStyles, position: 'relative', zIndex: 2}}>
          <div style={logoStyles} onClick={handleGoHome}>MaSoVa</div>
          {showBackButton && (
            <button
              style={backButtonStyles}
              onClick={handleBack}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = shadows.raised.md; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.raised.base; }}
              onMouseDown={(e) => { e.currentTarget.style.boxShadow = shadows.inset.base; e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.boxShadow = shadows.raised.base; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ← Back
            </button>
          )}
          {title && <h1 style={titleStyles}>{title}</h1>}
        </div>

        <div style={{...rightSectionStyles, position: 'relative', zIndex: 2}}>
          {showManagerNav ? (
            <>
              <StoreSelector contextKey={effectiveContextKey} variant="manager" />
              <button
                style={{
                  ...createNeumorphicSurface('raised', 'base', 'md'),
                  padding: `${spacing[2]} ${spacing[4]}`,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  background: colors.surface.primary,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: typography.fontFamily.primary,
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: spacing[2], height: '36px',
                }}
                onClick={() => setIsManagementHubOpen(true)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = shadows.raised.md; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.raised.base; }}
                onMouseDown={(e) => { e.currentTarget.style.boxShadow = shadows.inset.base; e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.boxShadow = shadows.raised.base; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span>☰</span><span>Management</span>
              </button>
            </>
          ) : (
            <>
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
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = shadows.raised.lg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.raised.base; }}
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
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = shadows.raised.lg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.raised.base; }}
                >
                  Staff Login →
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <ManagementHubSidebar
        isOpen={isManagementHubOpen}
        onClose={() => setIsManagementHubOpen(false)}
      />
    </>
  );
};

export default AppHeader;
