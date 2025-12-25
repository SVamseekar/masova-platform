// src/apps/POSSystem/POSSystem.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import POSDashboard from './POSDashboard';

/**
 * POS System Application
 * Main entry point for Point of Sale system
 * Handles walk-in orders, quick service, and staff operations
 * All functionality (Orders, Analytics, Reports, History) is now unified in POSDashboard
 */
const POSSystem: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<POSDashboard />} />
      {/* Redirect old routes to main dashboard */}
      <Route path="/history" element={<Navigate to="/pos" replace />} />
      <Route path="/reports" element={<Navigate to="/pos" replace />} />
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
};

export default POSSystem;
