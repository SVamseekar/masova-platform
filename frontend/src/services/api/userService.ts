// src/services/api/userService.ts
export class UserService {
  static async login(credentials: any): Promise<any> {
    // Mock implementation
    return {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      user: { id: '1', type: 'CUSTOMER', name: 'Mock User', email: credentials.email }
    };
  }
}