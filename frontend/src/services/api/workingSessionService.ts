import { apiClient } from './apiClient';

export class WorkingSessionService {
  static async startSession() {
    return apiClient.post('/api/users/sessions/start');
  }

  static async endSession() {
    return apiClient.post('/api/users/sessions/end');
  }

  static async getCurrentSession() {
    try {
      return await apiClient.get('/api/users/sessions/current');
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async addBreakTime(employeeId: string, breakMinutes: number) {
    return apiClient.post(`/api/users/sessions/${employeeId}/break`, {
      breakMinutes,
    });
  }

  static async getEmployeeSessions(employeeId: string, startDate: string, endDate: string) {
    return apiClient.get(
      `/api/users/sessions/${employeeId}?startDate=${startDate}&endDate=${endDate}`
    );
  }

  static async getActiveStoreSessions(storeId: string) {
    return apiClient.get(`/api/users/sessions/store/${storeId}/active`);
  }

  static async approveSession(sessionId: string) {
    return apiClient.post(`/api/users/sessions/${sessionId}/approve`);
  }

  static async rejectSession(sessionId: string, reason: string) {
    return apiClient.post(`/api/users/sessions/${sessionId}/reject`, { reason });
  }
}
