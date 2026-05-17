import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const analyticsHandlers = [
  http.get(`${API}/api/analytics`, () =>
    HttpResponse.json({
      type: 'sales',
      period: 'TODAY',
      data: {
        todaySales: 15000,
        todayOrderCount: 45,
        percentChangeFromYesterday: 11.1,
        trend: 'UP',
        averageOrderValue: 333,
        topProducts: [{ rank: 1, itemName: 'Margherita Pizza', revenue: 8970 }],
        peakHours: [{ hour: 12, label: '12 PM', orderCount: 15 }],
        staffLeaderboard: [{ rank: 1, staffName: 'Staff Member', ordersProcessed: 25 }],
        orderBreakdown: [{ orderType: 'DELIVERY', count: 20, percentage: 50 }],
        driverStatus: { totalDrivers: 8, availableDrivers: 5 },
        salesTrends: [{ date: '2025-01-15', sales: 15000 }],
      },
    }),
  ),

  http.post(`${API}/api/analytics/cache/clear`, () =>
    HttpResponse.json({ status: 'success', message: 'Cache cleared', storeId: '1' }),
  ),

  http.get(`${API}/api/bi`, () =>
    HttpResponse.json({
      type: 'sales-forecast',
      period: 'WEEKLY',
      data: {
        forecast: [{ date: '2025-01-20', predictedSales: 16000 }],
        confidence: 0.85,
      },
    }),
  ),

  http.get(`${API}/api/bi/reports`, () =>
    HttpResponse.json({
      type: 'executive-summary',
      period: 'MONTH',
      data: {
        totalRevenue: 450000,
        totalOrders: 1350,
        averageOrderValue: 333,
        topPerformingStore: 'MaSoVa Mumbai',
      },
    }),
  ),
];
