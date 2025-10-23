// src/apps/POSSystem/POSSystem.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import POSDashboard from './POSDashboard';
import OrderHistory from './OrderHistory';
import Reports from './Reports';

/**
 * POS System Application
 * Main entry point for Point of Sale system
 * Handles walk-in orders, quick service, and staff operations
 */
const POSSystem: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<POSDashboard />} />
      <Route path="/history" element={<OrderHistory />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
};

export default POSSystem;
