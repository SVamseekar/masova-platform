/**
 * Pure helpers for POS redesign (F2e) — unit-testable, no React.
 */
import { pos } from './posTokens';

export type PosTab = 'orders' | 'history' | 'reports';

export const POS_TABS: readonly { key: PosTab; label: string; shortcut: string }[] = [
  { key: 'orders', label: 'Orders', shortcut: 'F1' },
  { key: 'history', label: 'History', shortcut: 'F2' },
  { key: 'reports', label: 'Reports', shortcut: 'F3' },
] as const;

export type PaymentMethodBadge = {
  backgroundColor: string;
  color: string;
};

/** Semantic payment method chips — token-based, no India-only green for UPI on DE */
export function paymentMethodBadgeStyle(method: string | undefined | null): PaymentMethodBadge {
  switch ((method || '').toUpperCase()) {
    case 'CASH':
      return { backgroundColor: pos.warningSoft, color: pos.warningDark };
    case 'CARD':
      return { backgroundColor: pos.roleSoft, color: pos.roleDark };
    case 'WALLET':
      return { backgroundColor: pos.infoSoft, color: pos.infoDark };
    case 'UPI':
      return { backgroundColor: pos.successSoft, color: pos.successDark };
    default:
      return { backgroundColor: pos.surfaceAlt, color: pos.ink };
  }
}

export function orderStatusBadgeVariant(
  status: string
): 'success' | 'warning' | 'error' | 'secondary' | 'primary' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'secondary' | 'primary'> = {
    PENDING: 'warning',
    CONFIRMED: 'primary',
    PREPARING: 'primary',
    READY: 'success',
    OUT_FOR_DELIVERY: 'secondary',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return map[status] || 'secondary';
}

/** Prefer cart delivery fee; never invent a hard-coded INR amount. */
export function resolvePosDeliveryFee(
  orderType: string,
  subtotal: number,
  cartDeliveryFee: number
): number {
  if (orderType !== 'DELIVERY' || subtotal <= 0) return 0;
  return cartDeliveryFee > 0 ? cartDeliveryFee : 0;
}

/** Locale for POS timestamps — store locale, not hard-coded en-IN */
export function formatPosTime(iso: string, locale?: string | null): string {
  try {
    return new Date(iso).toLocaleTimeString(locale || undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/** IANA zone from store country for business-day filters (Europe-first seed = DE → Berlin). */
const TZ_BY_COUNTRY: Record<string, string> = {
  DE: 'Europe/Berlin',
  AT: 'Europe/Vienna',
  CH: 'Europe/Zurich',
  FR: 'Europe/Paris',
  BE: 'Europe/Brussels',
  NL: 'Europe/Amsterdam',
  ES: 'Europe/Madrid',
  IT: 'Europe/Rome',
  PT: 'Europe/Lisbon',
  PL: 'Europe/Warsaw',
  SE: 'Europe/Stockholm',
  DK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki',
  IE: 'Europe/Dublin',
  GB: 'Europe/London',
  IN: 'Asia/Kolkata',
  US: 'America/New_York',
};

export function businessTimeZoneForCountry(countryCode?: string | null): string | undefined {
  if (!countryCode) return undefined;
  return TZ_BY_COUNTRY[countryCode.toUpperCase()];
}

/** Calendar day in store business timezone (not browser local alone). */
export function calendarDayKey(date: Date, timeZone?: string): string {
  if (!timeZone) {
    return date.toDateString();
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function isSameBusinessDay(
  iso: string,
  countryCode?: string | null,
  now: Date = new Date()
): boolean {
  const tz = businessTimeZoneForCountry(countryCode);
  try {
    return calendarDayKey(new Date(iso), tz) === calendarDayKey(now, tz);
  } catch {
    return new Date(iso).toDateString() === now.toDateString();
  }
}

export function sumOrderTotals(
  orders: Array<{ totalAmount?: number; total?: number }>
): number {
  return orders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);
}

export function ordersInLastMs<T extends { createdAt: string }>(
  orders: T[],
  windowMs: number,
  now: Date = new Date()
): T[] {
  const cutoff = now.getTime() - windowMs;
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

export function deriveTopSellers(
  orders: Array<{ items?: Array<{ name?: string; quantity?: number; price?: number }> }>
): Array<{ name: string; qty: number; revenue: number }> {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items || []) {
      const name = item.name || 'Item';
      const prev = map.get(name) || { name, qty: 0, revenue: 0 };
      prev.qty += item.quantity || 0;
      prev.revenue += (item.price || 0) * (item.quantity || 0);
      map.set(name, prev);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
}

export function derivePaymentMix(
  orders: Array<{ paymentMethod?: string; totalAmount?: number; total?: number }>
): Array<{ method: string; count: number; total: number }> {
  const map = new Map<string, { method: string; count: number; total: number }>();
  for (const o of orders) {
    const method = (o.paymentMethod || 'OTHER').toUpperCase();
    const prev = map.get(method) || { method, count: 0, total: 0 };
    prev.count += 1;
    prev.total += o.totalAmount ?? o.total ?? 0;
    map.set(method, prev);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
