/** View-layer types mirroring analytics API responses (not exported from store). */

export interface StaffRankingItem {
  rank: number;
  staffId: string;
  staffName: string;
  ordersProcessed: number;
  salesGenerated: number;
  averageOrderValue?: number;
  performanceLevel: string;
  percentOfTotalSales?: number;
}

export interface ProductRankingItem {
  rank: number;
  itemId: string;
  itemName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  percentOfTotalRevenue: number;
}

export interface ChurnPredictionItem {
  customerId: string;
  customerName: string;
  daysSinceLastOrder: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SalesForecastItem {
  date: string;
  forecastedSales: number;
}

export interface OrderTypeBreakdownEntry {
  count?: number;
  revenue?: number;
  total?: number;
}