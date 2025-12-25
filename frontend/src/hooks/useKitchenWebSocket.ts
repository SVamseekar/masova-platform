import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, KitchenOrder } from '../services/websocketService';

interface UseKitchenWebSocketOptions {
  storeId: string;
  onOrderUpdate?: (order: KitchenOrder) => void;
  enabled?: boolean;
}

interface UseKitchenWebSocketResult {
  isConnected: boolean;
  error: string | null;
  reconnect: () => Promise<void>;
}

/**
 * Custom hook for KDS WebSocket integration (RT-001)
 *
 * Connects to the Order Service WebSocket and subscribes to kitchen queue updates
 * for the specified store. Automatically handles reconnection and cleanup.
 */
export function useKitchenWebSocket({
  storeId,
  onOrderUpdate,
  enabled = true
}: UseKitchenWebSocketOptions): UseKitchenWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const connectionAttemptRef = useRef(0);
  const maxRetries = 3;

  const connect = useCallback(async () => {
    if (!storeId || !enabled) {
      return;
    }

    try {
      setError(null);
      connectionAttemptRef.current += 1;

      // Connect to Order Service WebSocket if not already connected
      if (!websocketService.isOrderServiceConnected()) {
        console.log(`[KDS WebSocket] Connecting to Order Service (attempt ${connectionAttemptRef.current})`);
        await websocketService.connectToOrderService();
      }

      // Subscribe to kitchen queue for this store
      if (onOrderUpdate) {
        unsubscribeRef.current = websocketService.subscribeToKitchenQueue(storeId, (order) => {
          console.log(`[KDS WebSocket] Order update received: ${order.orderNumber} - ${order.status}`);
          onOrderUpdate(order);
        });
      }

      setIsConnected(true);
      connectionAttemptRef.current = 0;
      console.log(`[KDS WebSocket] Connected and subscribed to store: ${storeId}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to WebSocket';
      console.error(`[KDS WebSocket] Connection error:`, err);
      setError(errorMessage);
      setIsConnected(false);

      // Retry connection if under max retries
      if (connectionAttemptRef.current < maxRetries) {
        console.log(`[KDS WebSocket] Retrying connection in 5 seconds...`);
        setTimeout(() => connect(), 5000);
      }
    }
  }, [storeId, enabled, onOrderUpdate]);

  const reconnect = useCallback(async () => {
    // Cleanup existing connection
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    websocketService.disconnectFromOrderService();
    setIsConnected(false);
    connectionAttemptRef.current = 0;

    // Reconnect
    await connect();
  }, [connect]);

  useEffect(() => {
    if (enabled && storeId) {
      connect();
    }

    return () => {
      // Cleanup on unmount or when storeId/enabled changes
      if (unsubscribeRef.current) {
        console.log(`[KDS WebSocket] Cleaning up subscription for store: ${storeId}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [storeId, enabled, connect]);

  // Cleanup WebSocket on window unload
  useEffect(() => {
    const handleUnload = () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      websocketService.disconnectFromOrderService();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return {
    isConnected,
    error,
    reconnect
  };
}

export default useKitchenWebSocket;
