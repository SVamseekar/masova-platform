import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectCurrentUser } from '../../store/slices/authSlice';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backRoute?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  backRoute = '/'
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
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
        {currentUser && (
          <div style={userInfoStyles}>
            <span style={userNameStyles}>{currentUser.name}</span>
            <span style={userRoleStyles}>{currentUser.userType}</span>
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
        ) : (
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
      </div>
    </header>
  );
};

export default AppHeader;
