/**
 * DriverProfilePage - Redesigned (Uber-style)
 * Visual profile header with charts and modern shift management
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  ReportProblem as ReportIcon,
  Schedule as ScheduleIcon,
  LocalShipping as TruckIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  AccessTime as ClockIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { useGetDriverPerformanceQuery } from '../../../store/api/driverApi';
import { useGetCurrentSessionQuery, useStartSessionMutation, useEndSessionMutation } from '../../../store/api/sessionApi';
import { logout } from '../../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { MetricCard, ActionButton, StatsChart } from '../components/shared';
import { colors, spacing, typography, borderRadius, shadows, components } from '../../../styles/driver-design-tokens';
import { skeletonStyles } from '../utils/animations';

const DriverProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Fetch driver performance data
  const { data: performance, isLoading, error } = useGetDriverPerformanceQuery(
    { driverId: user?.id || '' },
    { skip: !user?.id }
  );

  // Fetch current working session
  const { data: currentSession, refetch: refetchSession } = useGetCurrentSessionQuery(undefined, {
    pollingInterval: 30000,
  });

  // Session mutations
  const [startSession, { isLoading: isStarting }] = useStartSessionMutation();
  const [endSession, { isLoading: isEnding }] = useEndSessionMutation();

  // Handle clock in/out
  const handleClockIn = async () => {
    if (!user?.id || !user?.storeId) {
      alert('Unable to start session. Missing user or store information.');
      return;
    }
    try {
      await startSession({ employeeId: user.id, storeId: user.storeId }).unwrap();
      refetchSession();
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start session. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!currentSession) return;
    try {
      await endSession().unwrap();
      refetchSession();
    } catch (err) {
      console.error('Failed to end session:', err);
      alert('Failed to end session. Please try again.');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?\n\nMake sure you have clocked out before logging out.')) {
      // Clear driver session data
      if (user?.id) {
        localStorage.removeItem(`driver_online_${user.id}`);
        localStorage.removeItem(`driver_session_start_${user.id}`);
      }
      // Dispatch logout action
      dispatch(logout());
      // Navigate to login
      navigate('/login');
    }
  };

  // Calculate session duration
  const getSessionDuration = () => {
    if (!currentSession?.loginTime) return '00:00:00';
    const loginTime = new Date(currentSession.loginTime);
    const now = new Date();
    const diffMs = now.getTime() - loginTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get session progress (assume 8-hour shift)
  const getSessionProgress = () => {
    if (!currentSession?.loginTime) return 0;
    const loginTime = new Date(currentSession.loginTime);
    const now = new Date();
    const diffMs = now.getTime() - loginTime.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.min((hours / 8) * 100, 100); // 8-hour shift
  };

  // Use backend data or defaults
  const driverStats = performance ? {
    totalDeliveries: performance.totalDeliveries,
    rating: performance.averageRating,
    onTimePercentage: performance.onTimeDeliveryPercentage,
    totalDistance: performance.totalDistanceCovered,
    avgDeliveryTime: performance.averageDeliveryTime,
    earnings: {
      today: performance.todayEarnings,
      week: performance.weekEarnings,
      month: performance.monthEarnings
    }
  } : {
    totalDeliveries: 0,
    rating: 0,
    onTimePercentage: 0,
    totalDistance: 0,
    avgDeliveryTime: 0,
    earnings: { today: 0, week: 0, month: 0 }
  };

  // Generate earnings chart data from performance data
  const earningsChartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      const dayLabel = days[dayIndex];

      // For today, use real data; for past days, use estimated values based on weekly average
      // In production, this should come from a weekly performance API endpoint
      const avgDaily = driverStats.earnings.week / 7;
      const value = i === 0
        ? driverStats.earnings.today
        : Math.round(avgDaily * (0.8 + Math.random() * 0.4));

      data.push({ label: dayLabel, value });
    }

    return data;
  }, [driverStats.earnings.today, driverStats.earnings.week]);

  // Get user initials
  const getInitials = () => {
    if (!user) return '?';
    const nameParts = user.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: spacing.lg }}>
        <Box sx={{ ...skeletonStyles.avatar('120px'), margin: '0 auto', mb: spacing.lg }} />
        <Box sx={{ ...skeletonStyles.text('200px', '24px'), margin: '0 auto', mb: spacing.sm }} />
        <Box sx={{ ...skeletonStyles.text('150px', '14px'), margin: '0 auto', mb: spacing.lg }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ ...skeletonStyles.card('100px') }} />
          ))}
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: spacing.lg }}>
        <Alert severity="error">Failed to load driver performance data</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: colors.gradients.profileHeader,
      }}
    >
      <Container maxWidth="md" sx={{ py: spacing.lg, pb: `calc(${spacing.xxl} + ${spacing.lg})` }}>
        {/* Profile Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: spacing.lg,
          }}
        >
          {/* Large Avatar */}
          <Avatar
            sx={{
              width: components.avatar.size.hero,
              height: components.avatar.size.hero,
              margin: '0 auto',
              marginBottom: spacing.base,
              backgroundColor: colors.primary.green,
              color: colors.text.inverse,
              fontSize: typography.fontSize.hero,
              fontWeight: typography.fontWeight.bold,
              boxShadow: shadows.elevated,
            }}
          >
            {getInitials()}
          </Avatar>

          {/* Name */}
          <Typography
            sx={{
              fontSize: typography.fontSize.h1,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              mb: spacing.xs,
            }}
          >
            {user?.name || 'Driver'}
          </Typography>

          {/* Rating */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              mb: spacing.xs,
            }}
          >
            <StarIcon sx={{ fontSize: '20px', color: colors.primary.green }} />
            <Typography
              sx={{
                fontSize: typography.fontSize.h2,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {driverStats.rating > 0 ? driverStats.rating.toFixed(1) : '0.0'}
            </Typography>
            <Typography
              sx={{
                fontSize: typography.fontSize.caption,
                color: colors.text.secondary,
              }}
            >
              Rating
            </Typography>
          </Box>

          {/* Employee ID */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.base}`,
              backgroundColor: colors.surface.backgroundAlt,
              borderRadius: borderRadius.full,
              fontSize: typography.fontSize.caption,
              color: colors.text.secondary,
              mb: spacing.base,
            }}
          >
            <TruckIcon sx={{ fontSize: '16px', color: colors.text.secondary }} />
            <Typography>#{user?.id?.slice(-8).toUpperCase() || 'N/A'}</Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
            <IconButton
              onClick={() => {
                alert('Edit Profile:\n\nTo update your profile information (email, phone, address), please contact your manager or visit the staff portal.');
              }}
              sx={{
                backgroundColor: colors.surface.background,
                boxShadow: shadows.subtle,
                '&:hover': {
                  backgroundColor: colors.primary.greenLight,
                  color: colors.primary.green,
                },
              }}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              onClick={() => {
                alert('Report Issue:\n\nTo report a hazard, accident, or safety concern:\n\n1. Call Safety Hotline: 1-800-SAFE\n2. Contact your manager immediately\n3. Document with photos if safe to do so\n\nYour safety is our priority!');
              }}
              sx={{
                backgroundColor: colors.surface.background,
                boxShadow: shadows.subtle,
                '&:hover': {
                  backgroundColor: colors.semantic.errorBg,
                  color: colors.semantic.error,
                },
              }}
            >
              <ReportIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Performance Stats */}
        <Box sx={{ mb: spacing.lg }}>
          <Typography
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              mb: spacing.base,
            }}
          >
            Performance Statistics
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: spacing.md,
              mb: spacing.base,
            }}
          >
            <MetricCard
              icon={<TruckIcon />}
              value={driverStats.totalDeliveries}
              label="Total Deliveries"
            />
            <MetricCard
              icon={<StarIcon />}
              value={driverStats.rating > 0 ? driverStats.rating.toFixed(1) : '0.0'}
              label="Average Rating"
            />
            <MetricCard
              icon={<CheckIcon />}
              value={`${driverStats.onTimePercentage}%`}
              label="On-Time Rate"
            />
            <MetricCard
              icon={<SpeedIcon />}
              value={`${driverStats.avgDeliveryTime}m`}
              label="Avg Time"
            />
          </Box>

          {/* Progress Bar for Performance */}
          <Box
            sx={{
              background: colors.surface.background,
              borderRadius: borderRadius.md,
              padding: spacing.base,
              boxShadow: shadows.subtle,
            }}
          >
            <Typography
              sx={{
                fontSize: typography.fontSize.caption,
                color: colors.text.secondary,
                mb: spacing.xs,
              }}
            >
              Total Distance Covered
            </Typography>
            <Typography
              sx={{
                fontSize: typography.fontSize.h1,
                fontWeight: typography.fontWeight.bold,
                color: colors.primary.green,
                mb: spacing.sm,
              }}
            >
              {driverStats.totalDistance} km
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((driverStats.totalDistance / 1000) * 100, 100)}
              sx={{
                height: 8,
                borderRadius: borderRadius.full,
                backgroundColor: colors.surface.backgroundAlt,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: colors.primary.green,
                  borderRadius: borderRadius.full,
                },
              }}
            />
          </Box>
        </Box>

        {/* Earnings Chart */}
        <Box sx={{ mb: spacing.lg }}>
          <StatsChart
            title="Weekly Earnings"
            data={earningsChartData}
            type="line"
            height={200}
            showPeriodToggle
            currentPeriod={chartPeriod}
            onPeriodChange={setChartPeriod}
            valuePrefix="₹"
          />
        </Box>

        {/* Earnings Summary */}
        <Box sx={{ mb: spacing.lg }}>
          <Typography
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              mb: spacing.base,
            }}
          >
            Earnings Summary
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: spacing.md,
            }}
          >
            {[
              { label: 'Today', value: driverStats.earnings.today, icon: '📅' },
              { label: 'This Week', value: driverStats.earnings.week, icon: '📆' },
              { label: 'This Month', value: driverStats.earnings.month, icon: '📊' },
            ].map((earning) => (
              <Box
                key={earning.label}
                sx={{
                  background: colors.surface.background,
                  borderRadius: borderRadius.md,
                  padding: spacing.base,
                  boxShadow: shadows.subtle,
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontSize: '24px', mb: spacing.xs }}>{earning.icon}</Typography>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.h2,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary.green,
                    mb: spacing.xs,
                  }}
                >
                  ₹{earning.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.small,
                    color: colors.text.secondary,
                  }}
                >
                  {earning.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography
            sx={{
              fontSize: typography.fontSize.small,
              color: colors.text.tertiary,
              textAlign: 'center',
              mt: spacing.sm,
            }}
          >
            * 20% commission per delivery
          </Typography>
        </Box>

        {/* Current Shift */}
        <Box
          sx={{
            background: colors.surface.background,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            boxShadow: shadows.card,
            mb: spacing.lg,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: spacing.base,
            }}
          >
            <Typography
              sx={{
                fontSize: typography.fontSize.h2,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              Current Shift
            </Typography>

            <ScheduleIcon sx={{ color: colors.text.secondary }} />
          </Box>

          <Divider sx={{ mb: spacing.base }} />

          {currentSession?.isActive ? (
            <>
              <Box sx={{ mb: spacing.base }}>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.caption,
                    color: colors.text.secondary,
                    mb: spacing.xs,
                  }}
                >
                  Started: {new Date(currentSession.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.h1,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary.green,
                    fontFamily: typography.fontFamily.mono,
                    mb: spacing.sm,
                  }}
                >
                  {getSessionDuration()}
                </Typography>

                {/* Progress Bar */}
                <LinearProgress
                  variant="determinate"
                  value={getSessionProgress()}
                  sx={{
                    height: 8,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.surface.backgroundAlt,
                    mb: spacing.xs,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: colors.primary.green,
                      borderRadius: borderRadius.full,
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: typography.fontSize.small,
                    color: colors.text.secondary,
                  }}
                >
                  {Math.round(getSessionProgress())}% of 8hr shift
                </Typography>
              </Box>

              {currentSession.breakTime && currentSession.breakTime > 0 && (
                <Box
                  sx={{
                    padding: spacing.sm,
                    backgroundColor: colors.primary.greenLight,
                    borderRadius: borderRadius.sm,
                    mb: spacing.base,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: typography.fontSize.caption,
                      color: colors.text.secondary,
                    }}
                  >
                    Break Time: {currentSession.breakTime} minutes
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: spacing.md }}>
                <ActionButton
                  variant="secondary"
                  fullWidth
                  onClick={() => console.log('Take Break')}
                >
                  Take Break
                </ActionButton>

                <ActionButton
                  variant="primary"
                  fullWidth
                  onClick={handleClockOut}
                  loading={isEnding}
                >
                  Clock Out
                </ActionButton>
              </Box>
            </>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: spacing.base }}>
                You are not currently clocked in. Start your shift to begin tracking.
              </Alert>
              <ActionButton
                variant="primary"
                size="large"
                fullWidth
                onClick={handleClockIn}
                loading={isStarting}
              >
                Clock In
              </ActionButton>
            </>
          )}
        </Box>

        {/* Personal Information */}
        <Box
          sx={{
            background: colors.surface.background,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            boxShadow: shadows.subtle,
          }}
        >
          <Typography
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              mb: spacing.base,
            }}
          >
            Personal Information
          </Typography>

          <Divider sx={{ mb: spacing.base }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.base }}>
            {[
              { icon: <EmailIcon />, label: 'Email', value: user?.email || 'Not provided' },
              { icon: <PhoneIcon />, label: 'Phone', value: user?.phone || 'Not provided' },
              { icon: <LocationIcon />, label: 'Address', value: typeof user?.address === 'string' ? user.address : user?.address ? `${user.address.street || ''}, ${user.address.city || ''}`.trim() || 'Not provided' : 'Not provided' },
              { icon: <CalendarIcon />, label: 'Member Since', value: new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
            ].map((info) => (
              <Box key={info.label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.xs, mb: spacing.xs }}>
                  <Box sx={{ color: colors.text.secondary, display: 'flex', alignItems: 'center' }}>
                    {info.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: typography.fontSize.small,
                      color: colors.text.secondary,
                    }}
                  >
                    {info.label}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: typography.fontSize.body,
                    color: colors.text.primary,
                  }}
                >
                  {info.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Logout Button */}
        <Box
          sx={{
            mt: spacing.lg,
            mb: spacing.base,
          }}
        >
          <ActionButton
            variant="secondary"
            size="large"
            fullWidth
            onClick={handleLogout}
          >
            Logout
          </ActionButton>
        </Box>
      </Container>
    </Box>
  );
};

export default DriverProfilePage;
