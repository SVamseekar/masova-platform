import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, OrderTrackingUpdate } from '../services/websocketService';

interface UseCustomerOrdersWebSocketOptions {
  customerId: string;
  onOrderUpdate?: (update: OrderTrackingUpdate) => void;
  enabled?: boolean;
}

interface UseCustomerOrdersWebSocketResult {
  isConnected: boolean;
  error: string | null;
  recentUpdates: OrderTrackingUpdate[];
  reconnect: () => Promise<void>;
}

/**
 * Custom hook for customer-level order updates WebSocket integration (RT-002)
 *
 * Connects to the Order Service WebSocket and subscribes to all order updates
 * for a specific customer. This enables real-time notifications when any of
 * the customer's orders change status.
 *
 * Use this for the Order History page or customer dashboard to show live
 * updates across all orders without needing to refresh.
 */
export function useCustomerOrdersWebSocket({
  customerId,
  onOrderUpdate,
  enabled = true
}: UseCustomerOrdersWebSocketOptions): UseCustomerOrdersWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<OrderTrackingUpdate[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const connectionAttemptRef = useRef(0);
  const maxRetries = 3;
  const maxRecentUpdates = 10; // Keep last 10 updates

  const connect = useCallback(async () => {
    if (!customerId || !enabled) {
      return;
    }

    try {
      setError(null);
      connectionAttemptRef.current += 1;

      // Connect to Order Service WebSocket if not already connected
      if (!websocketService.isOrderServiceConnected()) {
        console.log(`[Customer Orders WebSocket] Connecting to Order Service (attempt ${connectionAttemptRef.current})`);
        await websocketService.connectToOrderService();
      }

      // Subscribe to all order updates for this customer
      unsubscribeRef.current = websocketService.subscribeToCustomerOrders(customerId, (update) => {
        console.log(`[Customer Orders WebSocket] Update received: Order ${update.orderNumber} - ${update.status}`);

        // Add to recent updates (keep most recent first)
        setRecentUpdates(prev => {
          const newUpdates = [update, ...prev.filter(u => u.orderId !== update.orderId)];
          return newUpdates.slice(0, maxRecentUpdates);
        });

        if (onOrderUpdate) {
          onOrderUpdate(update);
        }
      });

      setIsConnected(true);
      connectionAttemptRef.current = 0;
      console.log(`[Customer Orders WebSocket] Connected and subscribed to customer: ${customerId}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to WebSocket';
      console.error(`[Customer Orders WebSocket] Connection error:`, err);
      setError(errorMessage);
      setIsConnected(false);

      // Retry connection if under max retries
      if (connectionAttemptRef.current < maxRetries) {
        console.log(`[Customer Orders WebSocket] Retrying connection in 5 seconds...`);
        setTimeout(() => connect(), 5000);
      }
    }
  }, [customerId, enabled, onOrderUpdate]);

  const reconnect = useCallback(async () => {
    // Cleanup existing connection
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    websocketService.disconnectFromOrderService();
    setIsConnected(false);
    setRecentUpdates([]);
    connectionAttemptRef.current = 0;

    // Reconnect
    await connect();
  }, [connect]);

  useEffect(() => {
    if (enabled && customerId) {
      connect();
    }

    return () => {
      // Cleanup on unmount or when customerId/enabled changes
      if (unsubscribeRef.current) {
        console.log(`[Customer Orders WebSocket] Cleaning up subscription for customer: ${customerId}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [customerId, enabled, connect]);

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
    recentUpdates,
    reconnect
  };
}

export default useCustomerOrdersWebSocket;
