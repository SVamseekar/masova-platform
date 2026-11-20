/**
 * Connection Monitor Provider
 * Keep authentication independent of network reachability and preserve workspace context.
 */
import React, { useEffect, useState } from 'react';
import { ConnectionMonitor } from '../../utils/security';
import { websocketService } from '../../services/websocketService';
import API_CONFIG from '../../config/api.config';

export const ConnectionMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  useEffect(() => {
    const lost = () => setShowWarning(true);
    const restored = () => setShowWarning(false);
    const monitor = new ConnectionMonitor(lost);
    monitor.start(API_CONFIG.BASE_URL);
    // Both connection-loss durations describe reachability, never token validity.
    websocketService.setConnectionLostCallbacks(lost, lost, restored);
    return () => {
      monitor.stop();
      websocketService.setConnectionLostCallbacks(undefined, undefined, undefined);
    };
  }, []);
  return <>
    {showWarning && <div role="status" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      backgroundColor: '#FFF1DA', color: '#7B4700', padding: '12px 24px',
      textAlign: 'center', fontSize: '14px', fontFamily: 'Geist, Inter, system-ui, sans-serif',
    }}>
      Connection unavailable. Live updates may be delayed. Trying to reconnect.
    </div>}
    {children}
  </>;
};
