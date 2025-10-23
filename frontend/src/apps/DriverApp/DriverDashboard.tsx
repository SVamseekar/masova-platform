import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Chip,
  Stack
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import DeliveryHomePage from './pages/DeliveryHomePage';
import ActiveDeliveryPage from './pages/ActiveDeliveryPage';
import DeliveryHistoryPage from './pages/DeliveryHistoryPage';
import DriverProfilePage from './pages/DriverProfilePage';

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

  const handleNavigationChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentNavValue(newValue);
    navigate(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      {/* Top App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <LocalShippingIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Driver App
          </Typography>

          {/* Online/Offline Status */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mr: 2 }}>
            <Chip
              icon={<LocationOnIcon />}
              label={isOnline ? 'Online' : 'Offline'}
              color={isOnline ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
            {user && (
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.firstName} {user.lastName}
              </Typography>
            )}
          </Stack>

          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 7 }}>
        <Routes>
          <Route path="/" element={<DeliveryHomePage isOnline={isOnline} setIsOnline={setIsOnline} setActiveDeliveries={setActiveDeliveries} />} />
          <Route path="/active" element={<ActiveDeliveryPage />} />
          <Route path="/history" element={<DeliveryHistoryPage />} />
          <Route path="/profile" element={<DriverProfilePage />} />
        </Routes>
      </Box>

      {/* Bottom Navigation */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <BottomNavigation
          value={currentNavValue}
          onChange={handleNavigationChange}
          showLabels
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
            }
          }}
        >
          <BottomNavigationAction
            label="Home"
            value="/driver"
            icon={<HomeIcon />}
          />
          <BottomNavigationAction
            label="Active"
            value="/driver/active"
            icon={
              <Badge badgeContent={activeDeliveries} color="primary">
                <LocalShippingIcon />
              </Badge>
            }
          />
          <BottomNavigationAction
            label="History"
            value="/driver/history"
            icon={<HistoryIcon />}
          />
          <BottomNavigationAction
            label="Profile"
            value="/driver/profile"
            icon={<AccountCircleIcon />}
          />
        </BottomNavigation>
      </Box>
    </Box>
  );
};

export default DriverDashboard;
