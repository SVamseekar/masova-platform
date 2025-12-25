import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Slider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as PushIcon,
  Vibration as InAppIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import {
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useUpdateChannelPreferenceMutation,
  NotificationChannel,
  NotificationType,
} from '../../store/api/notificationApi';
import { useAppSelector } from '../../store/hooks';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface NotificationTypePreference {
  [key: string]: {
    sms: boolean;
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

const NotificationSettingsPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const { data: preferences, isLoading } = useGetUserPreferencesQuery(user?.id || '', {
    skip: !user?.id,
  });

  const [updatePreferences, { isLoading: isSaving }] = useUpdateUserPreferencesMutation();
  const [updateChannel] = useUpdateChannelPreferenceMutation();

  // Local state for form
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [promotionalEnabled, setPromotionalEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState(22);
  const [quietHoursEnd, setQuietHoursEnd] = useState(8);
  const [respectQuietHours, setRespectQuietHours] = useState(true);

  // Notification type preferences
  const [typePreferences, setTypePreferences] = useState<NotificationTypePreference>({});

  // Success/Error states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load preferences into local state
  useEffect(() => {
    if (preferences) {
      setSmsEnabled(preferences.smsEnabled);
      setEmailEnabled(preferences.emailEnabled);
      setPushEnabled(preferences.pushEnabled);
      setInAppEnabled(preferences.inAppEnabled);
      setMarketingEnabled(preferences.marketingEnabled);
      setPromotionalEnabled(preferences.promotionalEnabled);
      setQuietHoursStart(preferences.quietHoursStart || 22);
      setQuietHoursEnd(preferences.quietHoursEnd || 8);
      setRespectQuietHours(preferences.respectQuietHours);

      if (preferences.typePreferences) {
        setTypePreferences(preferences.typePreferences);
      }
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      if (!user?.id) return;

      await updatePreferences({
        userId: user.id,
        preferences: {
          smsEnabled,
          emailEnabled,
          pushEnabled,
          inAppEnabled,
          marketingEnabled,
          promotionalEnabled,
          quietHoursStart,
          quietHoursEnd,
          respectQuietHours,
          typePreferences,
        },
      }).unwrap();

      setSuccessMessage('Notification preferences saved successfully');
    } catch (error) {
      setErrorMessage('Failed to save preferences. Please try again.');
    }
  };

  const handleChannelToggle = async (channel: string, enabled: boolean) => {
    try {
      if (!user?.id) return;

      await updateChannel({ userId: user.id, channel, enabled }).unwrap();

      switch (channel) {
        case 'SMS':
          setSmsEnabled(enabled);
          break;
        case 'EMAIL':
          setEmailEnabled(enabled);
          break;
        case 'PUSH':
          setPushEnabled(enabled);
          break;
        case 'IN_APP':
          setInAppEnabled(enabled);
          break;
      }
    } catch (error) {
      setErrorMessage(`Failed to update ${channel} preference`);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const channelSections = [
    {
      title: 'SMS Notifications',
      icon: <SmsIcon sx={{ color: '#e53e3e', fontSize: 28 }} />,
      description: 'Receive text messages for important updates',
      enabled: smsEnabled,
      onChange: (enabled: boolean) => handleChannelToggle('SMS', enabled),
    },
    {
      title: 'Email Notifications',
      icon: <EmailIcon sx={{ color: '#0066cc', fontSize: 28 }} />,
      description: 'Get detailed updates via email',
      enabled: emailEnabled,
      onChange: (enabled: boolean) => handleChannelToggle('EMAIL', enabled),
    },
    {
      title: 'Push Notifications',
      icon: <PushIcon sx={{ color: '#10b981', fontSize: 28 }} />,
      description: 'Receive push notifications on your device',
      enabled: pushEnabled,
      onChange: (enabled: boolean) => handleChannelToggle('PUSH', enabled),
    },
    {
      title: 'In-App Notifications',
      icon: <InAppIcon sx={{ color: '#f59e0b', fontSize: 28 }} />,
      description: 'See notifications within the app',
      enabled: inAppEnabled,
      onChange: (enabled: boolean) => handleChannelToggle('IN_APP', enabled),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          ...createNeumorphicSurface('raised', 'md', '2xl'),
          p: 4,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              ...createNeumorphicSurface('raised', 'sm', 'lg'),
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <NotificationsIcon sx={{ color: '#e53e3e', fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#333333' }}>
              Notification Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage how you receive notifications
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Channel Preferences */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {channelSections.map((section, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card
              sx={{
                ...createNeumorphicSurface('flat', 'sm', 'xl'),
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box
                      sx={{
                        ...createNeumorphicSurface('raised', 'sm', 'lg'),
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {section.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {section.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={section.enabled}
                    onChange={(e) => section.onChange(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#e53e3e',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#e53e3e',
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quiet Hours */}
      <Paper
        sx={{
          ...createNeumorphicSurface('flat', 'md', 'xl'),
          p: 3,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              ...createNeumorphicSurface('raised', 'sm', 'lg'),
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <ScheduleIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Quiet Hours
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={respectQuietHours}
              onChange={(e) => setRespectQuietHours(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#8b5cf6',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#8b5cf6',
                },
              }}
            />
          }
          label="Enable quiet hours (no notifications during these times)"
          sx={{ mb: 3 }}
        />

        {respectQuietHours && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Start Time: {quietHoursStart}:00
            </Typography>
            <Slider
              value={quietHoursStart}
              onChange={(_, value) => setQuietHoursStart(value as number)}
              min={0}
              max={23}
              marks
              valueLabelDisplay="auto"
              sx={{
                mb: 3,
                color: '#8b5cf6',
                '& .MuiSlider-thumb': {
                  boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                },
              }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              End Time: {quietHoursEnd}:00
            </Typography>
            <Slider
              value={quietHoursEnd}
              onChange={(_, value) => setQuietHoursEnd(value as number)}
              min={0}
              max={23}
              marks
              valueLabelDisplay="auto"
              sx={{
                color: '#8b5cf6',
                '& .MuiSlider-thumb': {
                  boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.9)',
                },
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Marketing & Promotional */}
      <Paper
        sx={{
          ...createNeumorphicSurface('flat', 'md', 'xl'),
          p: 3,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              ...createNeumorphicSurface('raised', 'sm', 'lg'),
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <CampaignIcon sx={{ color: '#10b981', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Marketing & Promotions
          </Typography>
        </Box>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={marketingEnabled}
                onChange={(e) => setMarketingEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10b981',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981',
                  },
                }}
              />
            }
            label="Receive marketing communications"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={promotionalEnabled}
                onChange={(e) => setPromotionalEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10b981',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981',
                  },
                }}
              />
            }
            label="Receive promotional offers and discounts"
          />
        </FormGroup>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            ...createNeumorphicSurface('raised', 'md', 'xl'),
            backgroundColor: '#e53e3e',
            color: 'white',
            px: 6,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            border: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#c02e2e',
              transform: 'translateY(-2px)',
              boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.2), -4px -4px 12px rgba(255, 255, 255, 0.9)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          }}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationSettingsPage;
