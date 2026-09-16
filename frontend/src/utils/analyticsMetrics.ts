/**
 * Pure helpers for manager Dashboard / Analytics KPI panels (F2c).
 * Keeps cents-vs-major assumptions out of JSX and makes unit tests cheap.
 */

export const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: 'Dine-In',
  PICKUP: 'Pickup',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery',
  DRIVE_THRU: 'Drive-Thru',
};

export interface OrderTypeBreakdownRow {
  orderType: string;
  label: string;
  count: number;
  sales: number;
  percentage: number;
  averageOrderValue: number;
}

export interface OrderTypeBreakdownPayload {
  breakdown?: Array<{
    orderType?: string;
    count?: number;
    sales?: number;
    percentage?: number;
    averageOrderValue?: number;
  }>;
  totalSales?: number;
  totalOrders?: number;
}

/** Normalize API order-type breakdown → rows safe for dashboard/charts. */
export function normalizeOrderTypeBreakdown(
  data: OrderTypeBreakdownPayload | null | undefined,
): OrderTypeBreakdownRow[] {
  if (!data?.breakdown || !Array.isArray(data.breakdown)) return [];
  return data.breakdown.map((item) => {
    const orderType = String(item.orderType ?? 'UNKNOWN');
    return {
      orderType,
      label: ORDER_TYPE_LABELS[orderType] || orderType.replace(/_/g, ' '),
      count: Number(item.count) || 0,
      sales: Number(item.sales) || 0,
      percentage: Number(item.percentage) || 0,
      averageOrderValue: Number(item.averageOrderValue) || 0,
    };
  });
}

/** Prefer menu name; never render blank when API returns null itemName. */
export function productDisplayName(
  itemName: string | null | undefined,
  itemId: string | null | undefined,
): string {
  const name = (itemName ?? '').trim();
  if (name) return name;
  const id = (itemId ?? '').trim();
  if (!id) return 'Unknown item';
  if (id.length <= 12) return id;
  return `Item ${id.slice(0, 8)}…`;
}

export interface SalesForecastPayload {
  forecasts?: Array<{ date?: string; forecastedSales?: number }>;
  /** Canonical field after transform */
  accuracy?: number;
  /** Backend BI field */
  modelAccuracy?: number;
  confidenceLevel?: number;
  algorithm?: string;
  period?: string;
  forecastPeriod?: string;
}

/** Map BI sales-forecast payload → fields the dashboard already reads. */
export function mapSalesForecastResponse<T extends SalesForecastPayload>(
  raw: T | null | undefined,
): T & { accuracy: number; period: string; forecasts: NonNullable<T['forecasts']> } {
  const empty = {
    ...(raw ?? ({} as T)),
    forecasts: (raw?.forecasts ?? []) as NonNullable<T['forecasts']>,
    accuracy: 0,
    period: 'WEEKLY',
  };
  if (!raw) return empty;

  const accuracyRaw = raw.accuracy ?? raw.modelAccuracy ?? raw.confidenceLevel ?? 0;
  const accuracyNum = typeof accuracyRaw === 'number' ? accuracyRaw : Number(accuracyRaw) || 0;
  // Backend may return 0–1 or 0–100
  const accuracy = accuracyNum > 0 && accuracyNum <= 1 ? accuracyNum * 100 : accuracyNum;

  return {
    ...raw,
    forecasts: Array.isArray(raw.forecasts) ? raw.forecasts : [],
    accuracy,
    period: String(raw.period ?? raw.forecastPeriod ?? 'WEEKLY'),
  };
}

export interface PeakHoursPayload {
  hourlyData?: Array<{ hour: number; orderCount: number; sales?: number; label?: string }>;
  peakHour?: number;
  slowestHour?: number;
  peakHourSales?: number;
  peakHourOrders?: number;
}

/** Hours that actually had orders (seed may dump everything into hour 0). */
export function activePeakHours(
  data: PeakHoursPayload | null | undefined,
): Array<{ hour: number; orderCount: number; sales: number; label: string }> {
  if (!data?.hourlyData) return [];
  return data.hourlyData
    .filter((h) => (h.orderCount ?? 0) > 0)
    .map((h) => ({
      hour: h.hour,
      orderCount: h.orderCount ?? 0,
      sales: Number(h.sales) || 0,
      label: h.label || `${h.hour}:00`,
    }));
}

/**
 * Analytics money fields from intelligence-service are major units (EUR euros),
 * not minor units — always format with formatMajorAmount, never formatMoney.
 * This helper documents the contract for tests.
 */
export function analyticsAmountIsMajorUnits(): true {
  return true;
}
