import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

interface NavigationMapProps {
  destination: string;
  currentLocation?: { latitude: number; longitude: number };
}

const NavigationMap: React.FC<NavigationMapProps> = ({ destination, currentLocation }) => {
  // Note: This is a placeholder for Google Maps integration
  // In production, you would use Google Maps JavaScript API or React wrapper like @react-google-maps/api

  return (
    <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Navigation to Delivery Location
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Click "Open in Google Maps" to navigate using your preferred maps app.
      </Alert>

      {/* Placeholder Map Area */}
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: 'grey.200',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          p: 3
        }}
      >
        <Typography variant="h4" gutterBottom>
          🗺️
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Map Integration Placeholder
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Destination: {destination}
        </Typography>
        {currentLocation && (
          <Typography variant="caption" color="text.secondary" align="center">
            Your Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Typography>
        )}
      </Box>

      <Alert severity="warning" sx={{ mt: 2 }}>
        <Typography variant="caption">
          <strong>For Production:</strong> Integrate Google Maps API with your API key in .env file.
          Add REACT_APP_GOOGLE_MAPS_API_KEY to enable real-time navigation.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default NavigationMap;
