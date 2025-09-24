import { apiClient } from './apiClient';

export class AnalyticsService {
  static async getSalesAnalytics(storeId: string, period: string): Promise<{
    todaySales: number;
    yesterdaySales: number;
    lastYearSameDaySales: number;
    percentageChange: number;
    weeklySales: number;
  }> {
    return apiClient.get(`/api/analytics/sales/${storeId}?period=${period}`);
  }

  static async getKitchenMetrics(storeId: string): Promise<{
    averagePrepTime: number;
    ovenUtilization: number;
    orderThroughput: number;
    qualityScore: number;
  }> {
    return apiClient.get(`/api/analytics/kitchen/${storeId}`);
  }

  static async getStaffPerformance(storeId: string): Promise<any[]> {
    return apiClient.get(`/api/analytics/staff/${storeId}`);
  }
}
