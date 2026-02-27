import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const analyticsHandlers = [
  http.get(`${API}/api/analytics/sales/today`, () =>
    HttpResponse.json({
      todaySales: 15000,
      yesterdaySalesAtSameTime: 13500,
      lastYearSameDaySales: 12000,
      todayOrderCount: 45,
      yesterdayOrderCountAtSameTime: 40,
      lastYearSameDayOrderCount: 35,
      percentChangeFromYesterday: 11.1,
      percentChangeFromLastYear: 25.0,
      trend: 'UP',
    }),
  ),

  http.get(`${API}/api/analytics/avgOrderValue/today`, () =>
    HttpResponse.json({
      averageOrderValue: 333,
      yesterdayAverageOrderValue: 337,
      percentChange: -1.2,
      trend: 'STABLE',
      totalOrders: 45,
      totalSales: 15000,
    }),
  ),

  http.get(`${API}/api/analytics/drivers/status`, () =>
    HttpResponse.json({
      totalDrivers: 8,
      availableDrivers: 5,
      busyDrivers: 3,
      activeDeliveries: 3,
      completedTodayDeliveries: 12,
    }),
  ),

  http.get(`${API}/api/analytics/staff/:staffId/performance/today`, () =>
    HttpResponse.json({
      staffId: '2',
      staffName: 'Staff Member',
      ordersProcessedToday: 15,
      salesGeneratedToday: 5000,
      averageOrderValue: 333,
      rank: 2,
      performanceLevel: 'GOOD',
    }),
  ),

  http.get(`${API}/api/analytics/sales/trends/:period`, () =>
    HttpResponse.json({
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
    }),
  ),

  http.get(`${API}/api/analytics/sales/breakdown/order-type`, () =>
    HttpResponse.json({
      breakdown: [
        { orderType: 'DELIVERY', count: 20, sales: 7500, percentage: 50, averageOrderValue: 375 },
        { orderType: 'DINE_IN', count: 15, sales: 4500, percentage: 30, averageOrderValue: 300 },
        { orderType: 'TAKEAWAY', count: 10, sales: 3000, percentage: 20, averageOrderValue: 300 },
      ],
      totalSales: 15000,
      totalOrders: 45,
    }),
  ),

  http.get(`${API}/api/analytics/sales/peak-hours`, () =>
    HttpResponse.json({
      hourlyData: [
        { hour: 12, label: '12 PM', orderCount: 15, sales: 5000, averageOrderValue: 333 },
        { hour: 13, label: '1 PM', orderCount: 12, sales: 4000, averageOrderValue: 333 },
        { hour: 19, label: '7 PM', orderCount: 10, sales: 3500, averageOrderValue: 350 },
      ],
      peakHour: 12,
      slowestHour: 3,
      peakHourSales: 5000,
      peakHourOrders: 15,
    }),
  ),

  http.get(`${API}/api/analytics/staff/leaderboard`, () =>
    HttpResponse.json({
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
    }),
  ),

  http.get(`${API}/api/analytics/products/top-selling`, () =>
    HttpResponse.json({
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
    }),
  ),

  http.post(`${API}/api/analytics/cache/clear`, () =>
    HttpResponse.json({ status: 'success', message: 'Cache cleared', storeId: '1' }),
  ),
];
