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

type LocationCallback = (location: DriverLocation) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private locationCallbacks: Map<string, LocationCallback[]> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new SockJS(`${API_CONFIG.BASE_URL}/ws/delivery`);

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
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP Error:', frame);
            reject(new Error('WebSocket connection failed'));
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
}

// Export singleton instance
export const websocketService = new WebSocketService();
