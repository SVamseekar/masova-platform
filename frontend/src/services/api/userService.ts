import { apiClient } from './apiClient';

export class UserService {
  static async login(credentials: { email: string; password: string }) {
    return apiClient.post('/api/users/login', credentials);
  }

  static async register(userData: any) {
    return apiClient.post('/api/users/register', userData);
  }

  static async getCurrentUser() {
    return apiClient.get('/api/users/profile');
  }

  static async updateProfile(userId: string, userData: any) {
    return apiClient.put(`/api/users/${userId}`, userData);
  }

  static async changePassword(currentPassword: string, newPassword: string) {
    return apiClient.post('/api/users/change-password', {
      currentPassword,
      newPassword,
    });
  }

  static async logout() {
    return apiClient.post('/api/users/logout');
  }

  static async getStoreEmployees(storeId: string) {
    return apiClient.get(`/api/users/store/${storeId}`);
  }

  static async canTakeOrders(userId: string) {
    return apiClient.get(`/api/users/${userId}/can-take-orders`);
  }
}
