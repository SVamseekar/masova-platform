/**
 * DeliveryHomePage - Redesigned (Uber-style)
 * Complete visual transformation while maintaining all functionality
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Alert, CircularProgress, IconButton, Switch, FormControlLabel } from '@mui/material';
import {
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  Navigation as NavigationIcon,
  Bolt as BoltIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  LocalShipping as DeliveryIcon,
  CheckCircleOutline as CompleteIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useStartSessionMutation, useEndSessionMutation } from '../../../store/api/sessionApi';
import { useGetDriverPerformanceQuery, useUpdateDriverStatusMutation } from '../../../store/api/driverApi';
import { websocketService } from '../../../services/websocketService';
import { MetricCard, ActionButton, StatsChart } from '../components/shared';
import { colors, spacing, borderRadius, typography, shadows, animations, createNeumorphicSurface } from '../../../styles/driver-design-tokens';

interface DeliveryHomePageProps {
  isOnline: boolean;
  setIsOnline: (value: boolean) => void;
  setActiveDeliveries: (value: number) => void;
}

const DeliveryHomePage: React.FC<DeliveryHomePageProps> = ({ isOnline, setIsOnline, setActiveDeliveries }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [startSession] = useStartSessionMutation();
  const [endSession] = useEndSessionMutation();
  const [updateDriverStatus] = useUpdateDriverStatusMutation();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [locationMode, setLocationMode] = useState<'auto' | 'manual'>('auto');
  // Session start time comes from backend when manager clocks in the driver
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day');

  // Fetch real driver performance data
  const today = new Date().toISOString().split('T')[0];
  const { data: performanceData, isLoading: isLoadingPerformance } = useGetDriverPerformanceQuery(
    {
      driverId: user?.id || '',
      startDate: today,
      endDate: today
    },
    {
      skip: !user?.id,
      pollingInterval: 30000
    }
  );

  // Calculate today's stats
  const todayStats = {
    deliveries: performanceData?.totalDeliveries || 0,
    earnings: performanceData?.totalEarnings || 0,
    distance: performanceData?.totalDistanceCovered || 0,
    avgDeliveryTime: Math.round(performanceData?.averageDeliveryTime || 0)
  };

  // Generate earnings chart data from performance data
  // Create last 7 days data (replace with actual API call if available)
  const earningsChartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      const dayLabel = days[dayIndex];

      // For today, use real data; for past days, use estimated values
      // In production, this should come from a weekly performance API endpoint
      const value = i === 0
        ? todayStats.earnings
        : Math.round(todayStats.earnings * (0.7 + Math.random() * 0.6)); // Simulated past data

      data.push({ label: dayLabel, value });
    }

    return data;
  }, [todayStats.earnings]);

  const getDefaultLocation = (): { latitude: number; longitude: number } => {
    const savedLocation = localStorage.getItem(`driver_default_location_${user?.id}`);
    if (savedLocation) {
      return JSON.parse(savedLocation);
    }
    return { latitude: 12.9716, longitude: 77.5946 };
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve) => {
      if (locationMode === 'manual') {
        const manualCoords = getDefaultLocation();
        setLocation(manualCoords);
        setIsUsingFallback(true);
        setLocationError('Using manual location. Click "Retry GPS" to enable GPS tracking.');
        resolve(manualCoords);
        return;
      }

      if (!navigator.geolocation) {
        const fallbackCoords = getDefaultLocation();
        setLocation(fallbackCoords);
        setIsUsingFallback(true);
        setLocationError('GPS not supported. Using fallback location.');
        resolve(fallbackCoords);
        return;
      }

      setIsLoadingLocation(true);
      setIsUsingFallback(false);
      setLocationError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(coords);
          setIsLoadingLocation(false);
          setIsUsingFallback(false);
          setLocationError('');
          resolve(coords);
        },
        (error) => {
          setIsLoadingLocation(false);
          const fallbackCoords = getDefaultLocation();
          let errorMsg = 'GPS unavailable. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg += 'Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg += 'GPS signal not found.';
              break;
            case error.TIMEOUT:
              errorMsg += 'GPS request timed out.';
              break;
          }
          setLocation(fallbackCoords);
          setIsUsingFallback(true);
          setLocationError(errorMsg + ' Using fallback location.');
          resolve(fallbackCoords);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  };

  // Session start time is managed by backend via clock-in
  // No need for localStorage persistence

  // Update elapsed time
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - sessionStartTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Continuous location tracking
  useEffect(() => {
    if (!isOnline || !user?.id) return;

    let watchId: number | null = null;
    let updateInterval: NodeJS.Timeout | null = null;

    const connectWebSocket = async () => {
      if (websocketService.isConnected()) return;
      try {
        await websocketService.connect();
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
      }
    };

    connectWebSocket();

    if (locationMode === 'auto' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: new Date().toISOString()
          };

          setLocation({ latitude: coords.latitude, longitude: coords.longitude });
          setIsUsingFallback(false);
          setLocationError('');

          if (websocketService.isConnected()) {
            websocketService.sendLocationUpdate(user.id, coords);
          }
        },
        (error) => {
          const fallbackCoords = getDefaultLocation();
          setLocation(fallbackCoords);
          setIsUsingFallback(true);
          let errorMsg = 'GPS signal lost. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg += 'Enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg += 'Enable location services.';
              break;
            case error.TIMEOUT:
              errorMsg += 'GPS signal weak.';
              break;
          }
          setLocationError(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000
        }
      );
    }

    if (locationMode === 'manual' || !navigator.geolocation) {
      updateInterval = setInterval(() => {
        const coords = location || getDefaultLocation();
        if (websocketService.isConnected()) {
          websocketService.sendLocationUpdate(user.id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString()
          });
        }
      }, 30000);

      const coords = location || getDefaultLocation();
      if (websocketService.isConnected()) {
        websocketService.sendLocationUpdate(user.id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString()
        });
      }
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (!isOnline) {
        websocketService.disconnect();
      }
    };
  }, [isOnline, locationMode, user?.id]);

  // Online/Offline status is now controlled by backend via POS clock-in
  // Drivers cannot manually toggle - manager clocks them in with 5-digit PIN

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: colors.gradients.heroBackground,
      }}
    >
      <Container maxWidth="md" sx={{ py: spacing.lg, pb: `calc(${spacing.xxl} + ${spacing.lg})` }}>
        {/* GPS Status Section */}
        <Box
          sx={{
            background: colors.surface.background,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            mb: spacing.lg,
            boxShadow: shadows.subtle,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: spacing.base }}>
            <Typography
              sx={{
                fontSize: typography.fontSize.h2,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              GPS Location
            </Typography>

            {/* GPS Mode Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={locationMode === 'auto'}
                  onChange={(e) => {
                    const newMode = e.target.checked ? 'auto' : 'manual';
                    setLocationMode(newMode);
                    if (newMode === 'auto') {
                      getCurrentLocation();
                    }
                  }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colors.primary.green,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.primary.green,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: typography.fontSize.caption, color: colors.text.secondary }}>
                  {locationMode === 'auto' ? 'Auto GPS' : 'Manual'}
                </Typography>
              }
              sx={{ ml: 'auto', mr: 0 }}
            />
          </Box>

          {isOnline && location && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <LocationIcon sx={{ fontSize: '20px', color: isUsingFallback ? colors.semantic.warning : colors.semantic.success }} />
                <Typography
                  sx={{
                    fontSize: typography.fontSize.body,
                    fontWeight: typography.fontWeight.medium,
                    color: isUsingFallback ? colors.semantic.warning : colors.semantic.success,
                  }}
                >
                  {isUsingFallback ? 'Using Fallback Location' : 'GPS Active - Accurate Location'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <TimerIcon sx={{ fontSize: '20px', color: colors.text.secondary }} />
                <Typography
                  sx={{
                    fontSize: typography.fontSize.h2,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.mono,
                  }}
                >
                  {elapsedTime}
                </Typography>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.caption,
                    color: colors.text.secondary,
                  }}
                >
                  Session Time
                </Typography>
              </Box>
            </Box>
          )}

          {!isOnline && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <LocationIcon sx={{ fontSize: '20px', color: colors.text.secondary }} />
              <Typography
                sx={{
                  fontSize: typography.fontSize.body,
                  color: colors.text.secondary,
                }}
              >
                GPS tracking will start when manager clocks you in
              </Typography>
            </Box>
          )}

          {/* Location Error Alert */}
          {locationError && (
            <Alert
              severity={isUsingFallback ? 'warning' : 'error'}
              sx={{ mt: spacing.base }}
              action={
                <IconButton size="small" onClick={() => getCurrentLocation()}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              }
            >
              {locationError}
            </Alert>
          )}
        </Box>

        {/* Quick Actions */}
        <Box
          sx={{
            display: 'flex',
            gap: spacing.md,
            mb: spacing.lg,
          }}
        >
          <ActionButton
            variant="secondary"
            fullWidth
            startIcon={<NavigationIcon />}
            onClick={() => {
              if (location) {
                // Open OpenStreetMap with current location (using OSRM for routing)
                const osmUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=16#map=16/${location.latitude}/${location.longitude}`;
                window.open(osmUrl, '_blank');
              } else {
                alert('Location not available. Please go online first.');
              }
            }}
          >
            My Location
          </ActionButton>

          <ActionButton
            variant="secondary"
            fullWidth
            startIcon={<PhoneIcon />}
            onClick={() => {
              alert('Support Contact:\n\nPhone: 1-800-MASOVA\nEmail: support@masova.com\n\nFor urgent issues during delivery, call the number above.');
            }}
          >
            Support
          </ActionButton>
        </Box>

        {/* Instructions - Horizontal Scrollable Cards */}
        <Box sx={{ mb: spacing.lg }}>
          <Typography
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              mb: spacing.base,
            }}
          >
            How It Works
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: spacing.md,
              overflowX: 'auto',
              pb: spacing.sm,
              '&::-webkit-scrollbar': {
                height: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: colors.surface.border,
                borderRadius: borderRadius.full,
              },
            }}
          >
            {[
              { icon: <CheckCircleIcon />, title: 'Go Online', desc: 'Toggle above to start accepting orders' },
              { icon: <DeliveryIcon />, title: 'Accept Orders', desc: 'New deliveries appear in Active tab' },
              { icon: <NavigationIcon />, title: 'Navigate', desc: 'Use map to reach customer location' },
              { icon: <CompleteIcon />, title: 'Deliver', desc: 'Mark complete when delivered' },
            ].map((step, index) => (
              <Box
                key={index}
                sx={{
                  minWidth: '200px',
                  padding: spacing.base,
                  background: colors.surface.background,
                  borderRadius: borderRadius.md,
                  boxShadow: shadows.subtle,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ fontSize: '32px', mb: spacing.sm, color: colors.primary.green, display: 'flex', justifyContent: 'center' }}>
                  {step.icon}
                </Box>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.body,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    mb: spacing.xs,
                  }}
                >
                  {step.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.caption,
                    color: colors.text.secondary,
                  }}
                >
                  {step.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DeliveryHomePage;
