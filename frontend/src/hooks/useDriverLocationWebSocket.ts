import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService, DriverLocation } from '../services/websocketService';

interface UseDriverLocationWebSocketOptions {
  driverId: string;
  orderId?: string;
  onLocationUpdate?: (location: DriverLocation) => void;
  enabled?: boolean;
}

interface UseDriverLocationWebSocketReturn {
  location: DriverLocation | null;
  isConnected: boolean;
  error: Error | null;
  lastUpdateTime: Date | null;
}

/**
 * Hook for subscribing to real-time driver location updates via WebSocket.
 * RT-003: Real-time location UI implementation.
 *
 * @param options Configuration options including driverId and callbacks
 * @returns Current location, connection status, and error state
 */
export const useDriverLocationWebSocket = ({
  driverId,
  orderId,
  onLocationUpdate,
  enabled = true,
}: UseDriverLocationWebSocketOptions): UseDriverLocationWebSocketReturn => {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationUpdate = useCallback((newLocation: DriverLocation) => {
    setLocation(newLocation);
    setLastUpdateTime(new Date());
    setError(null);

    if (onLocationUpdate) {
      onLocationUpdate(newLocation);
    }
  }, [onLocationUpdate]);

  const connect = useCallback(async () => {
    if (!enabled || !driverId) {
      return;
    }

    try {
      // Connect to delivery service WebSocket (uses existing connect method)
      await websocketService.connect();
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      // Subscribe to driver location updates
      unsubscribeRef.current = websocketService.subscribeToDriverLocation(
        driverId,
        handleLocationUpdate
      );

      console.log(`[useDriverLocationWebSocket] Connected and subscribed to driver ${driverId}`);
    } catch (err) {
      console.error('[useDriverLocationWebSocket] Connection error:', err);
      setIsConnected(false);
      setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket'));

      // Attempt reconnection with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current += 1;

        console.log(`[useDriverLocationWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, [driverId, enabled, handleLocationUpdate]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    console.log('[useDriverLocationWebSocket] Disconnected');
  }, []);

  useEffect(() => {
    if (enabled && driverId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [driverId, enabled, connect, disconnect]);

  // Auto-reconnect on visibility change (tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && driverId && !isConnected) {
        console.log('[useDriverLocationWebSocket] Tab became visible, reconnecting...');
        reconnectAttempts.current = 0;
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, driverId, isConnected, connect]);

  return {
    location,
    isConnected,
    error,
    lastUpdateTime,
  };
};

export default useDriverLocationWebSocket;
