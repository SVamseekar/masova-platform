/**
 * Phase 1: Connection Monitor Provider
 * Monitors backend connection and handles auto-logout on prolonged disconnection
 */

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { ConnectionMonitor } from '../../utils/security';
import { websocketService } from '../../services/websocketService';
import API_CONFIG from '../../config/api.config';

interface ConnectionStatus {
  isConnected: boolean;
  showWarning: boolean;
}

export const ConnectionMonitorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    showWarning: false,
  });

  useEffect(() => {
    let connectionMonitor: ConnectionMonitor | null = null;

    // Handle connection loss - show warning banner
    const handleConnectionLost = () => {
      console.warn('[App] Connection lost - showing warning banner');
      setConnectionStatus({
        isConnected: false,
        showWarning: true,
      });
    };

    // Handle auto-logout after prolonged disconnection
    const handleAutoLogout = () => {
      console.error('[App] Auto-logout triggered due to prolonged disconnection');

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Dispatch logout action
      dispatch(logout());

      // Redirect to login with message
      window.location.href = '/login?reason=connection_lost';
    };

    // Initialize connection monitor
    connectionMonitor = new ConnectionMonitor(handleAutoLogout);
    connectionMonitor.start(API_CONFIG.BASE_URL);

    // Set up WebSocket disconnect callbacks
    websocketService.setConnectionLostCallbacks(handleConnectionLost, handleAutoLogout);

    // Cleanup on unmount
    return () => {
      if (connectionMonitor) {
        connectionMonitor.stop();
      }
    };
  }, [dispatch]);

  return (
    <>
      {/* Connection Warning Banner */}
      {connectionStatus.showWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#ff9800',
            color: 'white',
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          ⚠️ Connection lost. Please refresh the page to continue.
        </div>
      )}
      {children}
    </>
  );
};
