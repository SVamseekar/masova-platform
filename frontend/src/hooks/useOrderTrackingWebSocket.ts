import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, OrderTrackingUpdate } from '../services/websocketService';

interface UseOrderTrackingWebSocketOptions {
  orderId: string;
  onOrderUpdate?: (update: OrderTrackingUpdate) => void;
  enabled?: boolean;
}

interface UseOrderTrackingWebSocketResult {
  isConnected: boolean;
  error: string | null;
  lastUpdate: OrderTrackingUpdate | null;
  reconnect: () => Promise<void>;
}

/**
 * Custom hook for customer order tracking WebSocket integration (RT-002)
 *
 * Connects to the Order Service WebSocket and subscribes to tracking updates
 * for the specified order. Automatically handles reconnection and cleanup.
 *
 * This enables real-time order status updates without polling, providing
 * instant feedback when order status changes (RECEIVED -> PREPARING -> etc.)
 */
export function useOrderTrackingWebSocket({
  orderId,
  onOrderUpdate,
  enabled = true
}: UseOrderTrackingWebSocketOptions): UseOrderTrackingWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<OrderTrackingUpdate | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const connectionAttemptRef = useRef(0);
  const maxRetries = 3;

  const connect = useCallback(async () => {
    if (!orderId || !enabled) {
      return;
    }

    try {
      setError(null);
      connectionAttemptRef.current += 1;

      // Connect to Order Service WebSocket if not already connected
      if (!websocketService.isOrderServiceConnected()) {
        console.log(`[Order Tracking WebSocket] Connecting to Order Service (attempt ${connectionAttemptRef.current})`);
        await websocketService.connectToOrderService();
      }

      // Subscribe to order tracking updates for this specific order
      unsubscribeRef.current = websocketService.subscribeToOrderTracking(orderId, (update) => {
        console.log(`[Order Tracking WebSocket] Update received for order ${update.orderNumber}: ${update.status}`);
        setLastUpdate(update);

        if (onOrderUpdate) {
          onOrderUpdate(update);
        }
      });

      setIsConnected(true);
      connectionAttemptRef.current = 0;
      console.log(`[Order Tracking WebSocket] Connected and subscribed to order: ${orderId}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to WebSocket';
      console.error(`[Order Tracking WebSocket] Connection error:`, err);
      setError(errorMessage);
      setIsConnected(false);

      // Retry connection if under max retries
      if (connectionAttemptRef.current < maxRetries) {
        console.log(`[Order Tracking WebSocket] Retrying connection in 5 seconds...`);
        setTimeout(() => connect(), 5000);
      }
    }
  }, [orderId, enabled, onOrderUpdate]);

  const reconnect = useCallback(async () => {
    // Cleanup existing connection
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    websocketService.disconnectFromOrderService();
    setIsConnected(false);
    setLastUpdate(null);
    connectionAttemptRef.current = 0;

    // Reconnect
    await connect();
  }, [connect]);

  useEffect(() => {
    if (enabled && orderId) {
      connect();
    }

    return () => {
      // Cleanup on unmount or when orderId/enabled changes
      if (unsubscribeRef.current) {
        console.log(`[Order Tracking WebSocket] Cleaning up subscription for order: ${orderId}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [orderId, enabled, connect]);

  // Cleanup WebSocket on window unload
  useEffect(() => {
    const handleUnload = () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return {
    isConnected,
    error,
    lastUpdate,
    reconnect
  };
}

export default useOrderTrackingWebSocket;
