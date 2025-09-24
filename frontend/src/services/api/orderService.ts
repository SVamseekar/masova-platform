import { apiClient } from './apiClient';
import { Order } from './types';

export class OrderService {
  static async createOrder(orderData: any): Promise<Order> {
    return apiClient.post('/api/orders', orderData);
  }

  static async getOrder(orderId: string): Promise<Order> {
    return apiClient.get(`/api/orders/${orderId}`);
  }

  static async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    return apiClient.put(`/api/orders/${orderId}/status`, { status });
  }

  static async getCustomerOrders(customerId: string): Promise<Order[]> {
    return apiClient.get(`/api/orders/customer/${customerId}`);
  }

  static async getStoreOrders(storeId: string): Promise<Order[]> {
    return apiClient.get(`/api/orders/store/${storeId}`);
  }

  static async getActiveOrders(): Promise<Order[]> {
    return apiClient.get('/api/orders/active');
  }

  static async trackOrder(orderId: string): Promise<{
    status: string;
    estimatedDeliveryTime: string;
    driverLocation?: { lat: number; lng: number };
  }> {
    return apiClient.get(`/api/orders/${orderId}/track`);
  }
}
