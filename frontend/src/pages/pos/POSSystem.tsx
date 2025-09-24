// src/pages/pos/POSSystem.tsx
import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { PointOfSale as POSIcon } from '@mui/icons-material';

const POSSystem: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <POSIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          POS System
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Point of Sale interface coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default POSSystem;