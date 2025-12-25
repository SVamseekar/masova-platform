import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Avatar, IconButton, Badge, BottomNavigation, BottomNavigationAction } from '@mui/material';
import {
  Home as HomeIcon,
  LocalShipping as ActiveIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  HomeOutlined as HomeOutlinedIcon,
  LocalShippingOutlined as ActiveOutlinedIcon,
  HistoryOutlined as HistoryOutlinedIcon,
  PersonOutline as PersonOutlinedIcon,
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import DeliveryHomePage from './pages/DeliveryHomePage';
import ActiveDeliveryPage from './pages/ActiveDeliveryPage';
import DeliveryHistoryPage from './pages/DeliveryHistoryPage';
import DriverProfilePage from './pages/DriverProfilePage';
import { StatusBadge } from './components/shared';
import { colors, spacing, typography, borderRadius, shadows, components, animations } from '../../styles/driver-design-tokens';
import { useGetDriverStatusQuery } from '../../store/api/driverApi';
import { injectKeyframes } from './utils/animations';
import { getTabSync } from './utils/tabSync';

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentNavValue, setCurrentNavValue] = useState(0);

  // Inject keyframes on mount
  useEffect(() => {
    injectKeyframes();
  }, []);

  // Phase 8: Fetch driver status from backend on mount
  const { data: driverStatusData, isLoading: isLoadingStatus } = useGetDriverStatusQuery(
    user?.id || '',
    {
      skip: !user?.id,
      // Poll every 30 seconds to keep status in sync
      pollingInterval: 30000,
    }
  );

  // Initialize online status from backend (fallback to localStorage for offline scenarios)
  const [isOnline, setIsOnline] = useState(() => {
    const savedStatus = localStorage.getItem(`driver_online_${user?.id}`);
    const initialOnline = savedStatus === 'true';
    console.log(`🎬 Initial online status from localStorage: ${initialOnline} (saved value: "${savedStatus}")`);
    return initialOnline;
  });
  const [activeDeliveries, setActiveDeliveries] = useState(0);

  // Phase 8: Sync with backend status when loaded
  // BUT: Don't override if we're in the middle of restoring a session
  useEffect(() => {
    if (driverStatusData && !isLoadingStatus && user?.id) {
      const backendIsOnline = driverStatusData.isOnline;
      const savedStatus = localStorage.getItem(`driver_online_${user.id}`);
      const savedSessionStart = localStorage.getItem(`driver_session_start_${user.id}`);

      console.log(`🔄 Backend sync: backend=${backendIsOnline}, localStorage=${savedStatus}, sessionStart=${savedSessionStart}`);

      // If we have a saved session and backend says offline, trust the local state
      // The backend might not have synced yet
      if (savedStatus === 'true' && savedSessionStart && !backendIsOnline) {
        console.log('⚠️ Backend shows offline but localStorage shows online - keeping local state');
        return;
      }

      // Otherwise, sync with backend
      console.log(`✅ Syncing with backend: setting isOnline to ${backendIsOnline}`);
      setIsOnline(backendIsOnline);
      localStorage.setItem(`driver_online_${user.id}`, String(backendIsOnline));
    }
  }, [driverStatusData, isLoadingStatus, user?.id]);

  // Persist online status to localStorage whenever it changes (fallback for offline)
  useEffect(() => {
    if (user?.id) {
      console.log(`💾 Saving online status to localStorage: ${isOnline}`);
      localStorage.setItem(`driver_online_${user.id}`, String(isOnline));
    }
  }, [isOnline, user?.id]);

  // Tab Synchronization: Listen for status changes from other tabs
  useEffect(() => {
    if (!user?.id) return;

    const tabSync = getTabSync();

    // Listen for driver status changes from other tabs
    const unsubscribeStatus = tabSync.on('DRIVER_STATUS_CHANGE', (data) => {
      if (data.userId === user.id) {
        console.log('📡 TabSync: Received status change from another tab:', data.isOnline);
        setIsOnline(data.isOnline);
        // Update localStorage to keep all tabs in sync
        localStorage.setItem(`driver_online_${user.id}`, String(data.isOnline));
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStatus();
    };
  }, [user?.id]);

  useEffect(() => {
    // Update navigation value based on current path
    const path = location.pathname;
    if (path.includes('/active')) {
      setCurrentNavValue(1);
    } else if (path.includes('/history')) {
      setCurrentNavValue(2);
    } else if (path.includes('/profile')) {
      setCurrentNavValue(3);
    } else {
      setCurrentNavValue(0);
    }
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigationChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentNavValue(newValue);
    const routes = ['/driver', '/driver/active', '/driver/history', '/driver/profile'];
    navigate(routes[newValue]);
  };

  const handleSettingsClick = () => {
    // Navigate to settings or show settings dialog
    console.log('Settings clicked');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return '?';
    const nameParts = user.name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return '?';
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Get driver display name
  const getDriverName = () => {
    if (!user || !user.name) return 'Driver';
    return user.name;
  };

  // Get employee ID or user ID
  const getEmployeeId = () => {
    if (!user) return '';
    // @ts-ignore - employeeId might exist on user
    return user.employeeId || `#EMP${user.id.slice(-6).toUpperCase()}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: colors.surface.background,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {/* Top Navigation Bar - Uber Style */}
      <Box
        sx={{
          height: components.topBar.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${spacing.base}`,
          backgroundColor: colors.primary.white,
          borderBottom: `1px solid ${colors.surface.border}`,
          boxShadow: shadows.subtle,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          transition: `all ${animations.duration.normal} ${animations.easing.standard}`,
        }}
      >
        {/* Left: Avatar + Name + ID */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <Avatar
            sx={{
              width: components.avatar.size.medium,
              height: components.avatar.size.medium,
              backgroundColor: colors.primary.green,
              color: colors.text.inverse,
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.bold,
            }}
          >
            {getUserInitials()}
          </Avatar>

          <Box>
            <Box
              sx={{
                fontSize: typography.fontSize.body,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                lineHeight: typography.lineHeight.tight,
              }}
            >
              {getDriverName()}
            </Box>
            <Box
              sx={{
                fontSize: typography.fontSize.small,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.tight,
              }}
            >
              {getEmployeeId()}
            </Box>
          </Box>
        </Box>

        {/* Right: Status Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <StatusBadge
            status={isOnline ? 'online' : 'offline'}
            size="medium"
            animated
          />
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          paddingBottom: `${components.bottomNav.height}px`,
        }}
      >
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
      </Box>

      {/* Bottom Navigation - Minimalist Uber Style */}
      <BottomNavigation
        value={currentNavValue}
        onChange={handleNavigationChange}
        showLabels
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: components.bottomNav.height,
          borderTop: `1px solid ${colors.surface.border}`,
          backgroundColor: colors.primary.white,
          zIndex: 1000,

          '& .MuiBottomNavigationAction-root': {
            color: colors.text.secondary,
            fontSize: typography.fontSize.caption,
            minWidth: 'unset',
            padding: spacing.sm,
            transition: `all ${animations.duration.normal} ${animations.easing.spring}`,

            '&.Mui-selected': {
              color: colors.primary.green,
              fontSize: typography.fontSize.caption,
              transform: 'scale(1.05)',

              '& .MuiSvgIcon-root': {
                transform: 'scale(1.1)',
              },
            },

            '& .MuiBottomNavigationAction-label': {
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
              marginTop: spacing.xs,

              '&.Mui-selected': {
                fontSize: typography.fontSize.caption,
                fontWeight: typography.fontWeight.semibold,
              },
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={currentNavValue === 0 ? <HomeIcon /> : <HomeOutlinedIcon />}
        />
        <BottomNavigationAction
          label="Active"
          icon={
            <Badge badgeContent={activeDeliveries} color="error">
              {currentNavValue === 1 ? <ActiveIcon /> : <ActiveOutlinedIcon />}
            </Badge>
          }
        />
        <BottomNavigationAction
          label="History"
          icon={currentNavValue === 2 ? <HistoryIcon /> : <HistoryOutlinedIcon />}
        />
        <BottomNavigationAction
          label="Profile"
          icon={currentNavValue === 3 ? <PersonIcon /> : <PersonOutlinedIcon />}
        />
      </BottomNavigation>
    </Box>
  );
};

export default DriverDashboard;
