import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import DeliveryHomePage from './pages/DeliveryHomePage';
import ActiveDeliveryPage from './pages/ActiveDeliveryPage';
import DeliveryHistoryPage from './pages/DeliveryHistoryPage';
import DriverProfilePage from './pages/DriverProfilePage';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentNavValue, setCurrentNavValue] = useState('/driver');
  const [isOnline, setIsOnline] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState(0);

  useEffect(() => {
    // Update navigation value based on current path
    const path = location.pathname;
    if (path.includes('/active')) {
      setCurrentNavValue('/driver/active');
    } else if (path.includes('/history')) {
      setCurrentNavValue('/driver/history');
    } else if (path.includes('/profile')) {
      setCurrentNavValue('/driver/profile');
    } else {
      setCurrentNavValue('/driver');
    }
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigationChange = (newValue: string) => {
    setCurrentNavValue(newValue);
    navigate(newValue);
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: colors.surface.background,
    fontFamily: typography.fontFamily.primary,
  };

  const topBarStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'none'),
    padding: spacing[4],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.primary,
  };

  const logoContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const iconStyles: React.CSSProperties = {
    fontSize: '1.5rem',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  const statusContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  };

  const statusBadgeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    backgroundColor: isOnline ? colors.semantic.success : colors.surface.secondary,
    color: isOnline ? '#fff' : colors.text.secondary,
    ...createNeumorphicSurface('flat', 'sm', 'full'),
  };

  const userNameStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    display: 'none', // Hidden on mobile
    '@media (min-width: 640px)': {
      display: 'block',
    },
  };

  const logoutButtonStyles: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    transition: 'all 0.2s',
  };

  const contentStyles: React.CSSProperties = {
    flexGrow: 1,
    overflow: 'auto',
    paddingBottom: '80px', // Space for bottom nav
  };

  const bottomNavStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    backgroundColor: colors.surface.primary,
    ...createNeumorphicSurface('raised', 'sm', 'none'),
    borderTop: `1px solid ${colors.surface.tertiary}`,
    zIndex: 1000,
  };

  const navButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    gap: spacing[1],
    border: 'none',
    backgroundColor: isActive ? colors.surface.secondary : 'transparent',
    color: isActive ? colors.brand.primary : colors.text.secondary,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: typography.fontSize.xs,
    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
    ...(isActive ? createNeumorphicSurface('inset', 'sm', 'none') : {}),
  });

  const navIconStyles: React.CSSProperties = {
    fontSize: '1.5rem',
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '18px',
    height: '18px',
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.primary,
    color: '#fff',
    fontSize: typography.fontSize.xs,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 4px',
    fontWeight: typography.fontWeight.bold,
  };

  return (
    <div style={containerStyles}>
      {/* Top Bar */}
      <div style={topBarStyles}>
        <div style={logoContainerStyles}>
          <span style={iconStyles}>🚚</span>
          <span style={titleStyles}>Driver App</span>
        </div>

        <div style={statusContainerStyles}>
          <div style={statusBadgeStyles}>
            <span>📍</span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          {user && (
            <span style={userNameStyles}>
              {user.firstName} {user.lastName}
            </span>
          )}
          <button onClick={handleLogout} style={logoutButtonStyles}>
            🚪
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={contentStyles}>
        <Routes>
          <Route
            path="/"
            element={
              <DeliveryHomePage
                isOnline={isOnline}
                setIsOnline={setIsOnline}
                setActiveDeliveries={setActiveDeliveries}
              />
            }
          />
          <Route path="/active" element={<ActiveDeliveryPage />} />
          <Route path="/history" element={<DeliveryHistoryPage />} />
          <Route path="/profile" element={<DriverProfilePage />} />
        </Routes>
      </div>

      {/* Bottom Navigation */}
      <div style={bottomNavStyles}>
        <button
          onClick={() => handleNavigationChange('/driver')}
          style={navButtonStyles(currentNavValue === '/driver')}
        >
          <span style={navIconStyles}>🏠</span>
          <span>Home</span>
        </button>

        <button
          onClick={() => handleNavigationChange('/driver/active')}
          style={{ ...navButtonStyles(currentNavValue === '/driver/active'), position: 'relative' }}
        >
          <span style={navIconStyles}>🚚</span>
          {activeDeliveries > 0 && (
            <span style={badgeStyles}>{activeDeliveries}</span>
          )}
          <span>Active</span>
        </button>

        <button
          onClick={() => handleNavigationChange('/driver/history')}
          style={navButtonStyles(currentNavValue === '/driver/history')}
        >
          <span style={navIconStyles}>📋</span>
          <span>History</span>
        </button>

        <button
          onClick={() => handleNavigationChange('/driver/profile')}
          style={navButtonStyles(currentNavValue === '/driver/profile')}
        >
          <span style={navIconStyles}>👤</span>
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
};

export default DriverDashboard;
