/**
 * Derive manager KPIs / charts from store orders when analytics APIs return 0 or fail.
 * Business day is Europe/Berlin unless another IANA zone is passed.
 */

export type StoreOrderRow = {
  createdAt: string;
  status?: string | null;
  paymentStatus?: string | null;
  total?: number;
  totalAmount?: number;
  orderType?: string | null;
  items?: Array<{
    menuItemId?: string;
    name?: string;
    quantity?: number;
    price?: number;
  }>;
};

const SALE_STATUSES = new Set(['COMPLETED', 'DELIVERED', 'SERVED']);

export function calendarDayKey(iso: string | Date, timeZone = 'Europe/Berlin'): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function orderMoney(order: StoreOrderRow): number {
  const n = Number(order.totalAmount ?? order.total ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function isSaleOrder(order: StoreOrderRow): boolean {
  const status = String(order.status || '').toUpperCase();
  if (status === 'CANCELLED') return false;
  if (SALE_STATUSES.has(status)) return true;
  return String(order.paymentStatus || '').toUpperCase() === 'PAID';
}

export function deriveTopProducts(orders: StoreOrderRow[], limit = 8) {
  const map = new Map<string, { itemId: string; itemName: string; quantitySold: number; revenue: number }>();
  for (const o of orders) {
    if (!isSaleOrder(o)) continue;
    for (const item of o.items || []) {
      const name = item.name || 'Item';
      const id = item.menuItemId || name;
      const prev = map.get(id) || { itemId: id, itemName: name, quantitySold: 0, revenue: 0 };
      prev.quantitySold += item.quantity || 0;
      prev.revenue += (item.price || 0) * (item.quantity || 0);
      map.set(id, prev);
    }
  }
  const ranked = [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  const total = ranked.reduce((s, r) => s + r.revenue, 0);
  return ranked.map((row, i) => ({
    ...row,
    rank: i + 1,
    category: 'FOOD',
    unitPrice: row.quantitySold > 0 ? row.revenue / row.quantitySold : 0,
    percentOfTotalRevenue: total > 0 ? (row.revenue / total) * 100 : 0,
    trend: 'UP' as const,
  }));
}

export function deriveOrderTypeBreakdown(orders: StoreOrderRow[]) {
  const map = new Map<string, { count: number; sales: number }>();
  const sales = orders.filter(isSaleOrder);
  for (const o of sales) {
    const type = String(o.orderType || 'UNKNOWN').toUpperCase();
    const prev = map.get(type) || { count: 0, sales: 0 };
    prev.count += 1;
    prev.sales += orderMoney(o);
    map.set(type, prev);
  }
  const totalSales = [...map.values()].reduce((s, r) => s + r.sales, 0);
  const totalOrders = sales.length;
  const breakdown = [...map.entries()].map(([orderType, r]) => ({
    orderType,
    count: r.count,
    sales: r.sales,
    percentage: totalSales > 0 ? (r.sales / totalSales) * 100 : 0,
    averageOrderValue: r.count > 0 ? r.sales / r.count : 0,
  }));
  return { breakdown, totalSales, totalOrders };
}

export function derivePeakHours(orders: StoreOrderRow[], timeZone = 'Europe/Berlin') {
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    orderCount: 0,
    sales: 0,
    averageOrderValue: 0,
  }));
  const sales = orders.filter(isSaleOrder);
  for (const o of sales) {
    const d = new Date(o.createdAt);
    if (!Number.isFinite(d.getTime())) continue;
    let hour = d.getHours();
    try {
      hour = Number(
        new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(d),
      );
    } catch {
      /* keep local hour */
    }
    if (hour < 0 || hour > 23) continue;
    hourly[hour].orderCount += 1;
    hourly[hour].sales += orderMoney(o);
  }
  hourly.forEach((h) => {
    h.averageOrderValue = h.orderCount > 0 ? h.sales / h.orderCount : 0;
  });
  const active = hourly.filter((h) => h.orderCount > 0);
  let peakHour = 19;
  let slowestHour = 15;
  if (active.length) {
    peakHour = active.reduce((a, b) => (b.orderCount > a.orderCount ? b : a)).hour;
    slowestHour = active.reduce((a, b) => (b.orderCount < a.orderCount ? b : a)).hour;
  }
  return {
    hourlyData: hourly,
    peakHour,
    slowestHour,
    peakHourSales: hourly[peakHour].sales,
    peakHourOrders: hourly[peakHour].orderCount,
  };
}

export function deriveSalesTrend(orders: StoreOrderRow[], days: number, timeZone = 'Europe/Berlin', now = new Date()) {
  const buckets = new Map<string, { sales: number; orderCount: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    buckets.set(calendarDayKey(d, timeZone), { sales: 0, orderCount: 0 });
  }
  for (const o of orders) {
    if (!isSaleOrder(o)) continue;
    const key = calendarDayKey(o.createdAt, timeZone);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.sales += orderMoney(o);
    bucket.orderCount += 1;
  }
  const dataPoints = [...buckets.entries()].map(([date, b]) => ({
    date,
    label: date.slice(5),
    sales: b.sales,
    orderCount: b.orderCount,
    averageOrderValue: b.orderCount > 0 ? b.sales / b.orderCount : 0,
  }));
  const totalSales = dataPoints.reduce((s, p) => s + p.sales, 0);
  const totalOrders = dataPoints.reduce((s, p) => s + p.orderCount, 0);
  return {
    period: days <= 7 ? 'WEEKLY' : 'MONTHLY',
    dataPoints,
    totalSales,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
    percentChangeFromPreviousPeriod: 0,
    trend: 'UP' as const,
  };
}

export function summarizeStoreOrders(
  orders: StoreOrderRow[] | undefined | null,
  timeZone = 'Europe/Berlin',
  now = new Date(),
) {
  const list = orders || [];
  const todayKey = calendarDayKey(now, timeZone);
  const today = list.filter((o) => calendarDayKey(o.createdAt, timeZone) === todayKey);
  const weekMs = 7 * 86400000;
  const monthMs = 30 * 86400000;
  const nowMs = now.getTime();
  const week = list.filter((o) => nowMs - new Date(o.createdAt).getTime() < weekMs);
  const month = list.filter((o) => nowMs - new Date(o.createdAt).getTime() < monthMs);
  const todaySalesRows = today.filter(isSaleOrder);
  const weekSalesRows = week.filter(isSaleOrder);
  const monthSalesRows = month.filter(isSaleOrder);
  const sum = (rows: StoreOrderRow[]) => rows.reduce((s, o) => s + orderMoney(o), 0);
  const top = deriveTopProducts(weekSalesRows.length ? weekSalesRows : monthSalesRows);
  return {
    todaySales: sum(todaySalesRows),
    todayOrderCount: todaySalesRows.length,
    todayTicketCount: today.length,
    weekSales: sum(weekSalesRows),
    weekOrders: weekSalesRows.length,
    monthSales: sum(monthSalesRows),
    monthOrders: monthSalesRows.length,
    topProducts: top,
    typeBreakdown: deriveOrderTypeBreakdown(monthSalesRows.length ? monthSalesRows : list),
    peakHours: derivePeakHours(todaySalesRows.length ? todaySalesRows : weekSalesRows, timeZone),
    trendWeekly: deriveSalesTrend(list, 7, timeZone, now),
    trendMonthly: deriveSalesTrend(list, 30, timeZone, now),
  };
}

export type StoreOrderSummary = {
  storeId?: string;
  today?: string;
  todaySales?: number;
  todayOrderCount?: number;
  weekSales?: number;
  weekOrderCount?: number;
  rangeSales?: number;
  rangeOrderCount?: number;
  liveOrderCount?: number;
  pendingPaymentCount?: number;
  daily?: Array<{ date: string; sales: number; orderCount: number }>;
  hours?: Array<{ hour: number; label?: string; sales: number; orderCount: number }>;
  orderTypes?: Array<{
    orderType: string;
    count: number;
    sales: number;
    percentage?: number;
    averageOrderValue?: number;
  }>;
  topProducts?: Array<{
    rank?: number;
    itemId: string;
    itemName: string;
    quantitySold: number;
    revenue: number;
    unitPrice?: number;
    percentOfTotalRevenue?: number;
    category?: string;
    trend?: string;
  }>;
  staff?: Array<{
    rank?: number;
    staffId: string;
    staffName: string;
    ordersProcessed: number;
    salesGenerated: number;
    averageOrderValue?: number;
    percentOfTotalSales?: number;
    performanceLevel?: string;
  }>;
};

export function derivedFromSummary(summary: StoreOrderSummary | undefined | null) {
  const s = summary || {};
  const daily = s.daily || [];
  const hours = (s.hours || []).map((h) => ({
    hour: h.hour,
    label: h.label || `${String(h.hour).padStart(2, '0')}:00`,
    orderCount: h.orderCount || 0,
    sales: h.sales || 0,
    averageOrderValue: (h.orderCount || 0) > 0 ? (h.sales || 0) / h.orderCount : 0,
  }));
  const activeHours = hours.filter((h) => h.orderCount > 0);
  const peakHour = activeHours.length
    ? activeHours.reduce((a, b) => (b.orderCount > a.orderCount ? b : a)).hour
    : 19;
  const slowestHour = activeHours.length
    ? activeHours.reduce((a, b) => (b.orderCount < a.orderCount ? b : a)).hour
    : 15;
  const weeklyDays = daily.slice(-7);
  const toTrend = (rows: typeof daily, period: 'WEEKLY' | 'MONTHLY') => {
    const dataPoints = rows.map((d) => ({
      date: d.date,
      label: d.date.slice(5),
      sales: d.sales || 0,
      orderCount: d.orderCount || 0,
      averageOrderValue: (d.orderCount || 0) > 0 ? (d.sales || 0) / d.orderCount : 0,
    }));
    const totalSales = dataPoints.reduce((sum, p) => sum + p.sales, 0);
    const totalOrders = dataPoints.reduce((sum, p) => sum + p.orderCount, 0);
    return {
      period,
      dataPoints,
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      percentChangeFromPreviousPeriod: 0,
      trend: 'UP' as const,
    };
  };
  return {
    todaySales: s.todaySales || 0,
    todayOrderCount: s.todayOrderCount || 0,
    todayTicketCount: s.todayOrderCount || 0,
    weekSales: s.weekSales || 0,
    weekOrders: s.weekOrderCount || 0,
    monthSales: s.rangeSales || 0,
    monthOrders: s.rangeOrderCount || 0,
    liveOrderCount: s.liveOrderCount || 0,
    pendingPaymentCount: s.pendingPaymentCount || 0,
    topProducts: (s.topProducts || []).map((p, i) => ({
      rank: p.rank || i + 1,
      itemId: p.itemId,
      itemName: p.itemName,
      category: p.category || 'FOOD',
      quantitySold: p.quantitySold,
      revenue: p.revenue,
      unitPrice: p.unitPrice || 0,
      percentOfTotalRevenue: p.percentOfTotalRevenue || 0,
      trend: 'UP' as const,
    })),
    typeBreakdown: {
      breakdown: s.orderTypes || [],
      totalSales: s.rangeSales || 0,
      totalOrders: s.rangeOrderCount || 0,
    },
    peakHours: {
      hourlyData: hours,
      peakHour,
      slowestHour,
      peakHourSales: hours[peakHour]?.sales || 0,
      peakHourOrders: hours[peakHour]?.orderCount || 0,
    },
    trendWeekly: toTrend(weeklyDays, 'WEEKLY'),
    trendMonthly: toTrend(daily, 'MONTHLY'),
    staff: s.staff || [],
  };
}
