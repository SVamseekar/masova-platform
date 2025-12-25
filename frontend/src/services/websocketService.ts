import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import API_CONFIG from '../config/api.config';

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: string;
  items: Array<{
    menuItemId?: string;
    name: string;
    quantity: number;
    variant?: string;
    customizations?: string[];
  }>;
  customerName: string;
  orderType: string;
  priority: string;
  preparationTime?: number;
  createdAt: string;
  storeId: string;
}

export interface OrderTrackingUpdate {
  orderId: string;
  orderNumber: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedDeliveryTime?: string;
  timestamp: string;
}

type LocationCallback = (location: DriverLocation) => void;
type KitchenOrderCallback = (order: KitchenOrder) => void;
type OrderTrackingCallback = (update: OrderTrackingUpdate) => void;

class WebSocketService {
  private client: Client | null = null;
  private orderClient: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private locationCallbacks: Map<string, LocationCallback[]> = new Map();
  private kitchenCallbacks: Map<string, KitchenOrderCallback[]> = new Map();
  private orderTrackingCallbacks: Map<string, OrderTrackingCallback[]> = new Map();

  // Phase 1: Connection monitoring
  private disconnectTime: number | null = null;
  private disconnectWarningTimer: NodeJS.Timeout | null = null;
  private disconnectLogoutTimer: NodeJS.Timeout | null = null;
  private onConnectionLost?: () => void;
  private onAutoLogout?: () => void;

  /**
   * Set callbacks for connection loss events
   */
  setConnectionLostCallbacks(
    onConnectionLost?: () => void,
    onAutoLogout?: () => void
  ): void {
    this.onConnectionLost = onConnectionLost;
    this.onAutoLogout = onAutoLogout;
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnect(): void {
    console.warn('[WebSocket] Connection lost');

    this.disconnectTime = Date.now();

    // Clear any existing timers
    this.clearDisconnectTimers();

    // Show warning after 30 seconds of disconnection
    this.disconnectWarningTimer = setTimeout(() => {
      console.warn('[WebSocket] Prolonged disconnection detected (30s)');
      if (this.onConnectionLost) {
        this.onConnectionLost();
      }
    }, 30000); // 30 seconds

    // Auto-logout after 60 seconds of disconnection
    this.disconnectLogoutTimer = setTimeout(() => {
      console.error('[WebSocket] Connection lost for 60s - initiating auto-logout');
      if (this.onAutoLogout) {
        this.onAutoLogout();
      }
    }, 60000); // 60 seconds
  }

  /**
   * Handle WebSocket reconnection
   */
  private handleReconnect(): void {
    console.log('[WebSocket] Connection restored');

    // Clear disconnect timers
    this.clearDisconnectTimers();
    this.disconnectTime = null;
  }

  /**
   * Clear disconnect timers
   */
  private clearDisconnectTimers(): void {
    if (this.disconnectWarningTimer) {
      clearTimeout(this.disconnectWarningTimer);
      this.disconnectWarningTimer = null;
    }

    if (this.disconnectLogoutTimer) {
      clearTimeout(this.disconnectLogoutTimer);
      this.disconnectLogoutTimer = null;
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Connect directly to delivery service WebSocket (not through API Gateway)
        const deliveryServiceUrl = 'http://localhost:8090';
        const socket = new SockJS(`${deliveryServiceUrl}/ws/delivery`);

        this.client = new Client({
          webSocketFactory: () => socket as any,
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('WebSocket Connected');
            this.handleReconnect();
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP Error:', frame);
            reject(new Error('WebSocket connection failed'));
          },
          onDisconnect: () => {
            // Phase 1: Handle disconnection
            this.handleDisconnect();
          },
        });

        this.client.activate();
      } catch (error) {
        console.error('WebSocket Connection Error:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    // Clear timers before disconnecting
    this.clearDisconnectTimers();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.subscriptions.clear();
    this.locationCallbacks.clear();
  }

  subscribeToDriverLocation(driverId: string, callback: LocationCallback): () => void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return () => {};
    }

    const topic = `/topic/driver/${driverId}/location`;

    // Add callback to list
    if (!this.locationCallbacks.has(driverId)) {
      this.locationCallbacks.set(driverId, []);
    }
    this.locationCallbacks.get(driverId)!.push(callback);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(topic)) {
      const subscription = this.client.subscribe(topic, (message) => {
        try {
          const location: DriverLocation = JSON.parse(message.body);
          const callbacks = this.locationCallbacks.get(driverId) || [];
          callbacks.forEach(cb => cb(location));
        } catch (error) {
          console.error('Error parsing location update:', error);
        }
      });
      this.subscriptions.set(topic, subscription);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.locationCallbacks.get(driverId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // If no more callbacks, unsubscribe from topic
      if (callbacks.length === 0) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(topic);
        }
        this.locationCallbacks.delete(driverId);
      }
    };
  }

  sendLocationUpdate(driverId: string, location: Omit<DriverLocation, 'driverId'>): void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: '/app/location-update',
      body: JSON.stringify({
        driverId,
        ...location,
      }),
    });
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // ==================== ORDER SERVICE WEBSOCKET (RT-001, RT-002) ====================

  /**
   * Connect to Order Service WebSocket for KDS and customer tracking
   */
  connectToOrderService(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Connect to order service WebSocket using configured URL
        const socket = new SockJS(`${API_CONFIG.WS_URL}/orders`);

        this.orderClient = new Client({
          webSocketFactory: () => socket as any,
          debug: (str) => {
            if (str.includes('error') || str.includes('Error')) {
              console.error('Order STOMP Debug:', str);
            }
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('Order WebSocket Connected');
            resolve();
          },
          onStompError: (frame) => {
            console.error('Order STOMP Error:', frame);
            reject(new Error('Order WebSocket connection failed'));
          },
          onDisconnect: () => {
            console.log('Order WebSocket Disconnected');
          },
        });

        this.orderClient.activate();
      } catch (error) {
        console.error('Order WebSocket Connection Error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Order Service WebSocket
   */
  disconnectFromOrderService(): void {
    if (this.orderClient) {
      this.orderClient.deactivate();
      this.orderClient = null;
    }
    // Clear kitchen and order tracking callbacks
    this.kitchenCallbacks.clear();
    this.orderTrackingCallbacks.clear();
  }

  /**
   * Subscribe to kitchen queue updates for a specific store (RT-001)
   * Used by KDS to receive real-time order updates
   */
  subscribeToKitchenQueue(storeId: string, callback: KitchenOrderCallback): () => void {
    if (!this.orderClient || !this.orderClient.connected) {
      console.error('Order WebSocket not connected');
      return () => {};
    }

    const topic = `/topic/store/${storeId}/kitchen`;

    // Add callback to list
    if (!this.kitchenCallbacks.has(storeId)) {
      this.kitchenCallbacks.set(storeId, []);
    }
    this.kitchenCallbacks.get(storeId)!.push(callback);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(topic)) {
      const subscription = this.orderClient.subscribe(topic, (message) => {
        try {
          const order: KitchenOrder = JSON.parse(message.body);
          console.log('Kitchen order update received:', order.orderNumber);
          const callbacks = this.kitchenCallbacks.get(storeId) || [];
          callbacks.forEach(cb => cb(order));
        } catch (error) {
          console.error('Error parsing kitchen order update:', error);
        }
      });
      this.subscriptions.set(topic, subscription);
      console.log(`Subscribed to kitchen queue: ${topic}`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.kitchenCallbacks.get(storeId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(topic);
        }
        this.kitchenCallbacks.delete(storeId);
        console.log(`Unsubscribed from kitchen queue: ${topic}`);
      }
    };
  }

  /**
   * Subscribe to order tracking updates for a specific order (RT-002)
   * Used by customers to track their delivery
   */
  subscribeToOrderTracking(orderId: string, callback: OrderTrackingCallback): () => void {
    if (!this.orderClient || !this.orderClient.connected) {
      console.error('Order WebSocket not connected');
      return () => {};
    }

    const topic = `/topic/order/${orderId}/tracking`;

    // Add callback to list
    if (!this.orderTrackingCallbacks.has(orderId)) {
      this.orderTrackingCallbacks.set(orderId, []);
    }
    this.orderTrackingCallbacks.get(orderId)!.push(callback);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(topic)) {
      const subscription = this.orderClient.subscribe(topic, (message) => {
        try {
          const update: OrderTrackingUpdate = JSON.parse(message.body);
          console.log('Order tracking update received:', update.orderNumber, update.status);
          const callbacks = this.orderTrackingCallbacks.get(orderId) || [];
          callbacks.forEach(cb => cb(update));
        } catch (error) {
          console.error('Error parsing order tracking update:', error);
        }
      });
      this.subscriptions.set(topic, subscription);
      console.log(`Subscribed to order tracking: ${topic}`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.orderTrackingCallbacks.get(orderId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(topic);
        }
        this.orderTrackingCallbacks.delete(orderId);
        console.log(`Unsubscribed from order tracking: ${topic}`);
      }
    };
  }

  /**
   * Subscribe to customer's personal order updates (RT-002)
   */
  subscribeToCustomerOrders(customerId: string, callback: OrderTrackingCallback): () => void {
    if (!this.orderClient || !this.orderClient.connected) {
      console.error('Order WebSocket not connected');
      return () => {};
    }

    const topic = `/queue/customer/${customerId}/orders`;

    if (!this.subscriptions.has(topic)) {
      const subscription = this.orderClient.subscribe(topic, (message) => {
        try {
          const update: OrderTrackingUpdate = JSON.parse(message.body);
          console.log('Customer order update received:', update.orderNumber);
          callback(update);
        } catch (error) {
          console.error('Error parsing customer order update:', error);
        }
      });
      this.subscriptions.set(topic, subscription);
      console.log(`Subscribed to customer orders: ${topic}`);
    }

    return () => {
      const subscription = this.subscriptions.get(topic);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(topic);
        console.log(`Unsubscribed from customer orders: ${topic}`);
      }
    };
  }

  /**
   * Check if Order Service WebSocket is connected
   */
  isOrderServiceConnected(): boolean {
    return this.orderClient?.connected || false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
