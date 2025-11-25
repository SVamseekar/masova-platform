import { useEffect, useRef, useCallback } from 'react';
import { orderWebSocket, OrderUpdateCallback } from '../services/websocket/orderWebSocket';
import { useAppDispatch } from '../store/hooks';
import { orderApi } from '../store/api/orderApi';

export interface UseOrderWebSocketOptions {
  storeId?: string;
  customerId?: string;
  subscribeToKitchen?: boolean;
  subscribeToStore?: boolean;
  subscribeToCustomer?: boolean;
  onOrderUpdate?: OrderUpdateCallback;
  autoConnect?: boolean;
}

/**
 * React hook for WebSocket order updates
 *
 * Usage:
 * ```tsx
 * const { isConnected, error } = useOrderWebSocket({
 *   storeId: '123',
 *   subscribeToKitchen: true,
 *   onOrderUpdate: (order) => console.log('Order updated:', order)
 * });
 * ```
 */
export const useOrderWebSocket = (options: UseOrderWebSocketOptions = {}) => {
  const {
    storeId,
    customerId,
    subscribeToKitchen = false,
    subscribeToStore = false,
    subscribeToCustomer = false,
    onOrderUpdate,
    autoConnect = true,
  } = options;

  const dispatch = useAppDispatch();
  const subscriptionIdsRef = useRef<string[]>([]);
  const isConnectedRef = useRef(false);
  const connectionAttemptedRef = useRef(false);

  // Default callback that invalidates RTK Query cache
  const defaultCallback = useCallback((order: any) => {
    console.log('Order update received via WebSocket:', order.orderNumber);

    // Invalidate relevant caches to trigger refetch
    dispatch(orderApi.util.invalidateTags([
      { type: 'Order', id: order.id },
      { type: 'Orders', id: 'LIST' },
      'KitchenQueue',
    ]));

    // Call custom callback if provided
    if (onOrderUpdate) {
      onOrderUpdate(order);
    }
  }, [dispatch, onOrderUpdate]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (isConnectedRef.current || connectionAttemptedRef.current) {
      return;
    }

    connectionAttemptedRef.current = true;

    try {
      await orderWebSocket.connect();
      isConnectedRef.current = true;
      console.log('WebSocket connected successfully');
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      connectionAttemptedRef.current = false;
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Unsubscribe from all subscriptions
    subscriptionIdsRef.current.forEach((id) => {
      orderWebSocket.unsubscribe(id);
    });
    subscriptionIdsRef.current = [];

    orderWebSocket.disconnect();
    isConnectedRef.current = false;
    connectionAttemptedRef.current = false;
    console.log('WebSocket disconnected');
  }, []);

  // Subscribe to topics
  useEffect(() => {
    if (!autoConnect || !isConnectedRef.current) {
      return;
    }

    const newSubscriptionIds: string[] = [];

    try {
      // Subscribe to kitchen queue
      if (subscribeToKitchen && storeId) {
        const subId = orderWebSocket.subscribeToKitchenQueue(storeId, defaultCallback);
        newSubscriptionIds.push(subId);
      }

      // Subscribe to store orders
      if (subscribeToStore && storeId) {
        const subId = orderWebSocket.subscribeToStoreOrders(storeId, defaultCallback);
        newSubscriptionIds.push(subId);
      }

      // Subscribe to customer orders
      if (subscribeToCustomer && customerId) {
        const subId = orderWebSocket.subscribeToCustomerOrders(customerId, defaultCallback);
        newSubscriptionIds.push(subId);
      }

      subscriptionIdsRef.current = newSubscriptionIds;
    } catch (error) {
      console.error('Failed to subscribe to WebSocket topics:', error);
    }

    // Cleanup subscriptions on unmount or when dependencies change
    return () => {
      subscriptionIdsRef.current.forEach((id) => {
        orderWebSocket.unsubscribe(id);
      });
      subscriptionIdsRef.current = [];
    };
  }, [subscribeToKitchen, subscribeToStore, subscribeToCustomer, storeId, customerId, defaultCallback, autoConnect]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected: orderWebSocket.isConnected(),
    connect,
    disconnect,
    error: null, // Could be enhanced to track errors
  };
};
