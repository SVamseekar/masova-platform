/**
 * Pure helpers for Manager Quick Info + inventory alerts.
 * Kept free of React so Vitest can unit-test without RTK.
 *
 * ## Metric → API map (F2a)
 * | Section     | Metric                    | Source API / query                                      |
 * |-------------|---------------------------|---------------------------------------------------------|
 * | dashboard   | Orders today              | GET /analytics?type=sales&storeId=                      |
 * | dashboard   | Trending menus            | GET /analytics?type=top-products&…                      |
 * | dashboard   | On shift                  | GET /sessions (active store sessions)                   |
 * | orders      | Live / pending / refunds  | GET /orders?storeId= (client filters)                   |
 * | orders      | Active deliveries         | GET active deliveries count for store                   |
 * | inventory   | Low / out of stock        | GET /inventory?lowStock=true|outOfStock=true&storeId=   |
 * | inventory   | POs pending approval      | GET /purchase-orders?pending=true&storeId=              |
 * | inventory   | Waste this week           | GET /waste?startDate=&endDate= → sumWasteCost           |
 * | operations  | Drivers                   | GET /analytics?type=drivers&storeId=                    |
 * | operations  | Kiosks active/inactive    | GET kiosk accounts for store                            |
 * | people      | On shift / leaderboard    | sessions + staff leaderboard                            |
 * | people      | Customers                 | customer stats for store                                |
 * | analytics   | Revenue / orders KPIs     | GET /bi/reports?type=executive-summary                  |
 * | ai          | Live / event / stub counts| AGENT_CATALOG status tallies (not mock KPIs)            |
 * | compliance  | Signing failures          | GET /fiscal/failures?storeId=                           |
 */

export interface WasteCostLike {
  totalCost?: number | null;
  wasteCost?: number | null;
  cost?: number | null;
  storeId?: string | null;
}

export interface NamedStockItem {
  itemName?: string | null;
  itemCode?: string | null;
  name?: string | null;
}

/** Sum waste cost fields from waste API rows (seed uses totalCost). */
export function sumWasteCost(rows: WasteCostLike[] | undefined | null): number {
  if (!rows?.length) return 0;
  return rows.reduce((sum, r) => {
    const cost = r.totalCost ?? r.wasteCost ?? r.cost ?? 0;
    const n = typeof cost === 'number' ? cost : Number(cost);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

/** Optional store filter when waste list is not store-scoped by the API. */
export function filterWasteByStore(
  rows: WasteCostLike[] | undefined | null,
  storeId: string | undefined | null,
): WasteCostLike[] {
  if (!rows?.length) return [];
  if (!storeId) return [...rows];
  return rows.filter((r) => !r.storeId || r.storeId === storeId);
}

export function countItems<T>(items: T[] | undefined | null): number {
  return items?.length ?? 0;
}

/** Top N display names for low-stock hint strip. */
export function topStockItemNames(
  items: NamedStockItem[] | undefined | null,
  limit = 3,
): string[] {
  if (!items?.length) return [];
  return items
    .slice(0, limit)
    .map((i) => i.itemName || i.name || i.itemCode || '')
    .filter(Boolean);
}

export type OrderLikeForSnapshot = {
  status?: string | null;
  paymentStatus?: string | null;
  updatedAt?: string | null;
};

const TERMINAL_ORDER = new Set(['COMPLETED', 'CANCELLED', 'DELIVERED']);

export function countLiveOrders(orders: OrderLikeForSnapshot[] | undefined | null): number {
  if (!orders?.length) return 0;
  return orders.filter((o) => !TERMINAL_ORDER.has(String(o.status ?? ''))).length;
}

export function countPendingPayments(orders: OrderLikeForSnapshot[] | undefined | null): number {
  if (!orders?.length) return 0;
  return orders.filter((o) => o.paymentStatus === 'PENDING').length;
}

/** Refunds whose updatedAt is on the given ISO date (YYYY-MM-DD). */
export function countRefundsOnDate(
  orders: OrderLikeForSnapshot[] | undefined | null,
  isoDate: string,
): number {
  if (!orders?.length) return 0;
  return orders.filter(
    (o) => o.paymentStatus === 'REFUNDED' && (o.updatedAt?.startsWith(isoDate) ?? false),
  ).length;
}

export type AgentStatus = 'active' | 'stub' | 'event-driven';

export interface AgentStatusEntry {
  id: string;
  status: AgentStatus;
}

export interface AgentStatusCounts {
  active: number;
  eventDriven: number;
  stub: number;
  total: number;
}

/** Derive Quick Info AI tallies from the shared agent catalog. */
export function countAgentStatuses(agents: AgentStatusEntry[]): AgentStatusCounts {
  const counts: AgentStatusCounts = { active: 0, eventDriven: 0, stub: 0, total: agents.length };
  for (const a of agents) {
    if (a.status === 'active') counts.active += 1;
    else if (a.status === 'event-driven') counts.eventDriven += 1;
    else counts.stub += 1;
  }
  return counts;
}
