/**
 * Pure helpers for KDS board — unit-testable without React.
 */

export type KdsOrderType = 'DELIVERY' | 'COLLECTION' | 'DINE_IN';

export type KdsStatus =
  | 'RECEIVED'
  | 'PREPARING'
  | 'OVEN'
  | 'BAKED'
  | 'READY'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

/** Active cook-path columns (live-shift primary board) */
export const COOK_STATUSES: readonly KdsStatus[] = [
  'RECEIVED',
  'PREPARING',
  'OVEN',
  'BAKED',
  'READY',
] as const;

/** Post-kitchen handoff columns (compact secondary board) */
export const HANDOFF_STATUSES: readonly KdsStatus[] = [
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'SERVED',
  'COMPLETED',
] as const;

export const COLUMN_META: Record<
  string,
  { title: string; short: string }
> = {
  RECEIVED: { title: 'New Orders', short: 'New' },
  PREPARING: { title: 'Preparing', short: 'Prep' },
  OVEN: { title: 'In Oven', short: 'Oven' },
  BAKED: { title: 'Baked', short: 'Baked' },
  READY: { title: 'Ready', short: 'Ready' },
  DISPATCHED: { title: 'Dispatched', short: 'Disp.' },
  OUT_FOR_DELIVERY: { title: 'Out for Delivery', short: 'OFD' },
  SERVED: { title: 'Served', short: 'Served' },
  COMPLETED: { title: 'Picked Up', short: 'Pickup' },
};

export interface SortableTicket {
  id: string;
  status: string;
  priority: 'NORMAL' | 'URGENT' | string;
  receivedAt: Date;
}

/** Urgent first, then oldest first (FIFO within priority). */
export function sortKitchenTickets<T extends SortableTicket>(tickets: T[]): T[] {
  return [...tickets].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return a.receivedAt.getTime() - b.receivedAt.getTime();
  });
}

export function filterByStatus<T extends { status: string }>(
  tickets: T[],
  status: string
): T[] {
  return tickets.filter((t) => t.status === status);
}

/** Minutes since received (floor). Negative clamped to 0. */
export function elapsedMinutes(receivedAt: Date, now: Date): number {
  const mins = Math.floor((now.getTime() - receivedAt.getTime()) / 60_000);
  return Math.max(0, mins);
}

export function formatElapsed(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Urgency band for border/KPI coloring.
 * Based on real wall-clock age — not an estimate.
 */
export function urgencyBand(mins: number): 'ok' | 'warn' | 'critical' {
  if (mins >= 10) return 'critical';
  if (mins >= 5) return 'warn';
  return 'ok';
}

/**
 * Kitchen status flow for "Next Stage".
 * Delivery advances to DISPATCHED; dine-in / collection stop at READY.
 */
export function nextKitchenStatus(
  current: string,
  orderType: KdsOrderType
): string | null {
  const flow =
    orderType === 'DELIVERY'
      ? ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY', 'DISPATCHED']
      : ['RECEIVED', 'PREPARING', 'OVEN', 'BAKED', 'READY'];
  const idx = flow.indexOf(current);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1] ?? null;
}

export function terminalStatusForType(orderType: KdsOrderType): 'SERVED' | 'COMPLETED' | null {
  if (orderType === 'DINE_IN') return 'SERVED';
  if (orderType === 'COLLECTION') return 'COMPLETED';
  return null; // DELIVERY ends via driver, not KDS complete
}

export function mapApiOrderType(
  orderType: string | undefined
): KdsOrderType {
  if (orderType === 'TAKEAWAY') return 'COLLECTION';
  if (orderType === 'DINE_IN') return 'DINE_IN';
  return 'DELIVERY';
}

export function isActiveKitchenStatus(status: string): boolean {
  return !['DELIVERED', 'CANCELLED', 'SERVED', 'COMPLETED'].includes(status);
}

export interface QueueMetrics {
  activeCount: number;
  avgWaitMins: number;
  maxWaitMins: number;
  urgentCount: number;
  newCount: number;
}

export function computeQueueMetrics(
  tickets: Array<{ status: string; priority: string; receivedAt: Date }>,
  now: Date
): QueueMetrics {
  const active = tickets.filter((t) => isActiveKitchenStatus(t.status));
  const waits = active.map((t) => elapsedMinutes(t.receivedAt, now));
  const avgWaitMins =
    waits.length > 0 ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
  const maxWaitMins = waits.length > 0 ? Math.max(...waits) : 0;
  return {
    activeCount: active.length,
    avgWaitMins,
    maxWaitMins,
    urgentCount: active.filter((t) => t.priority === 'URGENT').length,
    newCount: tickets.filter((t) => t.status === 'RECEIVED').length,
  };
}

/**
 * Oven remaining minutes. Uses real actualOvenTime when present;
 * otherwise a labeled estimate (default 7m oven cycle).
 */
export function ovenRemainingLabel(
  opts: {
    status: string;
    actualOvenTime?: number;
    ovenStartedAt?: Date;
    now: Date;
    estimateMinutes?: number;
  }
): { text: string; isEstimate: boolean } | null {
  if (opts.status !== 'OVEN') return null;
  const estimate = opts.estimateMinutes ?? 7;

  if (typeof opts.actualOvenTime === 'number' && opts.actualOvenTime >= 0) {
    return { text: `${opts.actualOvenTime}m oven (actual)`, isEstimate: false };
  }

  if (opts.ovenStartedAt) {
    const elapsed = elapsedMinutes(opts.ovenStartedAt, opts.now);
    const remaining = estimate - elapsed;
    if (remaining > 0) {
      return { text: `${remaining}m left`, isEstimate: true };
    }
    return { text: 'Ready!', isEstimate: true };
  }

  return { text: `~${estimate}m oven`, isEstimate: true };
}
