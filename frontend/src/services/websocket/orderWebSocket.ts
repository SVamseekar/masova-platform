import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import API_CONFIG from '../../config/api.config';
import type { Order } from '../../types/order';

export type OrderUpdateCallback = (order: Order) => void;

export class OrderWebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        console.log('WebSocket already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('WebSocket connection in progress');
        return;
      }

      this.isConnecting = true;

      // Create WebSocket client with SockJS fallback
      this.client = new Client({
        webSocketFactory: () => new SockJS(`${API_CONFIG.ORDER_SERVICE_URL}/ws/orders`),

        connectHeaders: {
          // Add any auth headers if needed
        },

        debug: (str) => {
          console.log('[WebSocket Debug]', str);
        },

        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: (frame) => {
          console.log('WebSocket connected:', frame);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        },

        onStompError: (frame) => {
          console.error('WebSocket STOMP error:', frame);
          this.isConnecting = false;
          reject(new Error(frame.headers['message'] || 'STOMP error'));
        },

        onWebSocketError: (event) => {
          console.error('WebSocket error:', event);
          this.isConnecting = false;
        },

        onDisconnect: () => {
          console.log('WebSocket disconnected');
          this.handleDisconnect();
        },
      });

      this.client.activate();
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.client) {
      // Unsubscribe from all topics
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      // Deactivate client
      this.client.deactivate();
      this.client = null;
      console.log('WebSocket disconnected and cleaned up');
    }
  }

  /**
   * Handle disconnection and attempt reconnect
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  }

  /**
   * Subscribe to all order updates
   */
  subscribeToAllOrders(callback: OrderUpdateCallback): string {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected');
    }

    const subscriptionId = 'all-orders';

    if (this.subscriptions.has(subscriptionId)) {
      console.log('Already subscribed to all orders');
      return subscriptionId;
    }

    const subscription = this.client.subscribe('/topic/orders', (message: IMessage) => {
      try {
        const order: Order = JSON.parse(message.body);
        callback(order);
      } catch (error) {
        console.error('Error parsing order update:', error);
      }
    });

    this.subscriptions.set(subscriptionId, subscription);
    console.log('Subscribed to all orders');
    return subscriptionId;
  }

  /**
   * Subscribe to store-specific order updates
   */
  subscribeToStoreOrders(storeId: string, callback: OrderUpdateCallback): string {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected');
    }

    const subscriptionId = `store-${storeId}-orders`;

    if (this.subscriptions.has(subscriptionId)) {
      console.log(`Already subscribed to store ${storeId} orders`);
      return subscriptionId;
    }

    const subscription = this.client.subscribe(`/topic/store/${storeId}/orders`, (message: IMessage) => {
      try {
        const order: Order = JSON.parse(message.body);
        callback(order);
      } catch (error) {
        console.error('Error parsing store order update:', error);
      }
    });

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`Subscribed to store ${storeId} orders`);
    return subscriptionId;
  }

  /**
   * Subscribe to kitchen queue updates for a specific store
   */
  subscribeToKitchenQueue(storeId: string, callback: OrderUpdateCallback): string {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected');
    }

    const subscriptionId = `store-${storeId}-kitchen`;

    if (this.subscriptions.has(subscriptionId)) {
      console.log(`Already subscribed to store ${storeId} kitchen queue`);
      return subscriptionId;
    }

    const subscription = this.client.subscribe(`/topic/store/${storeId}/kitchen`, (message: IMessage) => {
      try {
        const order: Order = JSON.parse(message.body);
        callback(order);
      } catch (error) {
        console.error('Error parsing kitchen queue update:', error);
      }
    });

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`Subscribed to store ${storeId} kitchen queue`);
    return subscriptionId;
  }

  /**
   * Subscribe to customer-specific order updates
   */
  subscribeToCustomerOrders(customerId: string, callback: OrderUpdateCallback): string {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected');
    }

    const subscriptionId = `customer-${customerId}-orders`;

    if (this.subscriptions.has(subscriptionId)) {
      console.log(`Already subscribed to customer ${customerId} orders`);
      return subscriptionId;
    }

    const subscription = this.client.subscribe(`/queue/customer/${customerId}/orders`, (message: IMessage) => {
      try {
        const order: Order = JSON.parse(message.body);
        callback(order);
      } catch (error) {
        console.error('Error parsing customer order update:', error);
      }
    });

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`Subscribed to customer ${customerId} orders`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from ${subscriptionId}`);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Send a message to the server (if needed)
   */
  sendOrderUpdate(order: Order): void {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.client.publish({
      destination: '/app/orders/update',
      body: JSON.stringify(order),
    });

    console.log('Sent order update:', order.orderNumber);
  }
}

// Export singleton instance
export const orderWebSocket = new OrderWebSocketService();
