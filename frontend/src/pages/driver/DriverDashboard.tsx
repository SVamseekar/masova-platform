import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { LocalShipping as DeliveryIcon } from '@mui/icons-material';

const DriverDashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <DeliveryIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Driver Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Driver interface coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default DriverDashboard;