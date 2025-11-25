import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

const DriverProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Mock driver stats (in production, fetch from API)
  const driverStats = {
    totalDeliveries: 247,
    rating: 4.8,
    onTimePercentage: 96,
    totalDistance: 1342,
    avgDeliveryTime: 26,
    earnings: {
      today: 960,
      week: 6750,
      month: 28340
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Chip
                  label="Active Driver"
                  color="success"
                  size="small"
                  icon={<LocalShippingIcon />}
                />
                <Chip
                  label={`⭐ ${driverStats.rating}`}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Personal Information
          </Typography>
          <Divider sx={{ my: 2 }} />
          <List disablePadding>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Full Name"
                secondary={`${user?.firstName} ${user?.lastName}`}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Email"
                secondary={user?.email}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PhoneIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Phone"
                secondary={user?.phoneNumber || 'Not provided'}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BadgeIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Employee ID"
                secondary={user?._id?.slice(-8).toUpperCase()}
              />
            </ListItem>
            {user?.address && (
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LocationOnIcon color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Address"
                  secondary={typeof user.address === 'string' ? user.address : `${user.address.street}, ${user.address.city}`}
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Performance Statistics
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <LocalShippingIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {driverStats.totalDeliveries}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Deliveries
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {driverStats.rating}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average Rating
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {driverStats.onTimePercentage}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  On-Time Rate
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {driverStats.avgDeliveryTime}m
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Time
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Total Distance Covered
          </Typography>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            {driverStats.totalDistance} km
          </Typography>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Earnings Summary
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Today
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                ₹{driverStats.earnings.today}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                This Week
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                ₹{driverStats.earnings.week}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                This Month
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                ₹{driverStats.earnings.month}
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            * Earnings calculated at 20% commission rate per delivery
          </Typography>
        </CardContent>
      </Card>

      {/* Actions */}
      <Stack spacing={2}>
        <Button variant="outlined" fullWidth>
          Edit Profile
        </Button>
        <Button variant="outlined" color="error" fullWidth>
          Report an Issue
        </Button>
      </Stack>
    </Container>
  );
};

export default DriverProfilePage;
