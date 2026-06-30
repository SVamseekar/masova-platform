import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

export const analyticsHandlers = [
  http.get(apiUrl('/analytics'), ({ request }) => {
    const type = new URL(request.url).searchParams.get('type');
    switch (type) {
      case 'sales':
        return HttpResponse.json({
          todaySales: 15000,
          yesterdaySalesAtSameTime: 13500,
          lastYearSameDaySales: 12000,
          todayOrderCount: 45,
          yesterdayOrderCountAtSameTime: 40,
          lastYearSameDayOrderCount: 35,
          percentChangeFromYesterday: 11.1,
          percentChangeFromLastYear: 25.0,
          trend: 'UP',
        });
      case 'aov':
        return HttpResponse.json({
          averageOrderValue: 333,
          yesterdayAverageOrderValue: 337,
          percentChange: -1.2,
          trend: 'STABLE',
          totalOrders: 45,
          totalSales: 15000,
        });
      case 'drivers':
        return HttpResponse.json({
          totalDrivers: 8,
          availableDrivers: 5,
          busyDrivers: 3,
          activeDeliveries: 3,
          completedTodayDeliveries: 12,
        });
      case 'staff-performance':
        return HttpResponse.json({
          staffId: '2',
          staffName: 'Staff Member',
          ordersProcessedToday: 15,
          salesGeneratedToday: 5000,
          averageOrderValue: 333,
          rank: 2,
          performanceLevel: 'GOOD',
        });
      case 'sales-trends':
        return HttpResponse.json({
          period: 'WEEKLY',
          dataPoints: [
            { date: '2025-01-13', label: 'Mon', sales: 12000, orderCount: 35, averageOrderValue: 343 },
            { date: '2025-01-14', label: 'Tue', sales: 14000, orderCount: 42, averageOrderValue: 333 },
            { date: '2025-01-15', label: 'Wed', sales: 15000, orderCount: 45, averageOrderValue: 333 },
          ],
          totalSales: 41000,
          totalOrders: 122,
          averageOrderValue: 336,
          percentChangeFromPreviousPeriod: 8.5,
          trend: 'UP',
        });
      case 'order-breakdown':
        return HttpResponse.json({
          breakdown: [
            { orderType: 'DELIVERY', count: 20, sales: 7500, percentage: 50, averageOrderValue: 375 },
            { orderType: 'DINE_IN', count: 15, sales: 4500, percentage: 30, averageOrderValue: 300 },
            { orderType: 'TAKEAWAY', count: 10, sales: 3000, percentage: 20, averageOrderValue: 300 },
          ],
          totalSales: 15000,
          totalOrders: 45,
        });
      case 'peak-hours':
        return HttpResponse.json({
          hourlyData: [
            { hour: 12, label: '12 PM', orderCount: 15, sales: 5000, averageOrderValue: 333 },
            { hour: 13, label: '1 PM', orderCount: 12, sales: 4000, averageOrderValue: 333 },
            { hour: 19, label: '7 PM', orderCount: 10, sales: 3500, averageOrderValue: 350 },
          ],
          peakHour: 12,
          slowestHour: 3,
          peakHourSales: 5000,
          peakHourOrders: 15,
        });
      case 'staff-leaderboard':
        return HttpResponse.json({
          rankings: [
            {
              rank: 1,
              staffId: '2',
              staffName: 'Staff Member',
              ordersProcessed: 25,
              salesGenerated: 8500,
              averageOrderValue: 340,
              performanceLevel: 'EXCELLENT',
              percentOfTotalSales: 57,
            },
          ],
          period: 'TODAY',
          totalStaff: 5,
        });
      case 'top-products':
        return HttpResponse.json({
          topProducts: [
            {
              rank: 1,
              itemId: '1',
              itemName: 'Margherita Pizza',
              category: 'PIZZA',
              quantitySold: 30,
              revenue: 8970,
              unitPrice: 299,
              percentOfTotalRevenue: 60,
              trend: 'UP',
            },
          ],
          period: 'TODAY',
          sortBy: 'revenue',
        });
      default:
        return HttpResponse.json({ error: 'unknown type' }, { status: 400 });
    }
  }),

  http.get(apiUrl('/bi'), ({ request }) => {
    const type = new URL(request.url).searchParams.get('type');
    switch (type) {
      case 'sales-forecast':
        return HttpResponse.json({ forecasts: [], algorithm: 'linear', accuracy: 0.85, period: 'WEEKLY' });
      case 'customer-behavior':
        return HttpResponse.json({ patterns: [], totalCustomers: 100, segmentation: {} });
      case 'churn':
        return HttpResponse.json({ predictions: [], totalAtRisk: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 });
      case 'demand-forecast':
        return HttpResponse.json({ forecasts: [], period: 'WEEKLY', accuracy: 0.8 });
      case 'cost-analysis':
        return HttpResponse.json({ breakdown: [], totalCosts: 0, profitMargin: 0, period: 'MONTHLY' });
      default:
        return HttpResponse.json({ error: 'unknown type' }, { status: 400 });
    }
  }),

  http.get(apiUrl('/bi/reports'), () =>
    HttpResponse.json({
      revenue: { total: 100000, change: 5, trend: 'UP' },
      orders: { total: 500, change: 3, trend: 'UP' },
      customers: { new: 20, returning: 80, atRisk: 5 },
      performance: { avgOrderValue: 350, customerSatisfaction: 4.5, deliveryOnTime: 92 },
      topInsights: [],
      alerts: [],
    }),
  ),

  http.post(apiUrl('/analytics/cache/clear'), () =>
    HttpResponse.json({ status: 'success', message: 'Cache cleared', storeId: '1' }),
  ),
];