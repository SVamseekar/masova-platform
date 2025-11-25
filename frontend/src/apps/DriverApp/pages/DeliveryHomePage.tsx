import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useStartWorkingSessionMutation, useEndWorkingSessionMutation } from '../../../store/api/sessionApi';

interface DeliveryHomePageProps {
  isOnline: boolean;
  setIsOnline: (value: boolean) => void;
  setActiveDeliveries: (value: number) => void;
}

const DeliveryHomePage: React.FC<DeliveryHomePageProps> = ({ isOnline, setIsOnline, setActiveDeliveries }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [startSession] = useStartWorkingSessionMutation();
  const [endSession] = useEndWorkingSessionMutation();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Mock stats for today
  const [todayStats] = useState({
    deliveries: 8,
    earnings: 960,
    distance: 45.2,
    avgDeliveryTime: 28
  });

  // Get current location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(coords);
          setLocationError('');
          setIsLoadingLocation(false);
          resolve(coords);
        },
        (error) => {
          setIsLoadingLocation(false);
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

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

  const handleToggleOnline = async () => {
    try {
      if (!isOnline) {
        // Going online - start session with GPS
        const coords = await getCurrentLocation();

        if (user?._id) {
          await startSession({
            userId: user._id,
            location: {
              type: 'Point',
              coordinates: [coords.longitude, coords.latitude]
            }
          }).unwrap();

          setIsOnline(true);
          setSessionStartTime(new Date());
          setActiveDeliveries(0);
        }
      } else {
        // Going offline - end session
        if (user?._id) {
          const coords = await getCurrentLocation();
          await endSession({
            userId: user._id,
            location: {
              type: 'Point',
              coordinates: [coords.longitude, coords.latitude]
            }
          }).unwrap();

          setIsOnline(false);
          setSessionStartTime(null);
          setElapsedTime('00:00:00');
        }
      }
    } catch (error: any) {
      console.error('Error toggling online status:', error);
      setLocationError(error.message || 'Failed to update status');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Online/Offline Toggle Card */}
      <Card sx={{ mb: 3, bgcolor: isOnline ? 'success.light' : 'grey.100' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {isOnline ? '🟢 You are Online' : '⚫ You are Offline'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isOnline
                  ? 'Ready to accept delivery orders'
                  : 'Turn online to start accepting deliveries'}
              </Typography>
            </Box>
            <Box>
              {isLoadingLocation ? (
                <CircularProgress size={40} />
              ) : (
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOnline}
                      onChange={handleToggleOnline}
                      color="success"
                      size="medium"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              )}
            </Box>
          </Stack>

          {isOnline && sessionStartTime && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Session Duration
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {elapsedTime}
                  </Typography>
                </Box>
                {location && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      GPS Location
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {locationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {locationError}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Today's Performance
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocalShippingIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {todayStats.deliveries}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MonetizationOnIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                ₹{todayStats.earnings}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {todayStats.distance}km
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {todayStats.avgDeliveryTime}m
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            How It Works
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                1. Go Online
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toggle the switch above to go online. GPS location is required for clock-in.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                2. Accept Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New delivery orders will appear in the "Active" tab. Accept and start delivery.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                3. Navigate & Deliver
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the map navigation to reach the customer. Mark as delivered when complete.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                4. Return to Store
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After delivery, return to store to pick up the next order.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {!isOnline && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<LocationOnIcon />}
            onClick={handleToggleOnline}
            disabled={isLoadingLocation}
            sx={{ px: 4, py: 1.5 }}
          >
            {isLoadingLocation ? 'Getting Location...' : 'Go Online & Start Deliveries'}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default DeliveryHomePage;
