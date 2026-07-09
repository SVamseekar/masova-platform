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

export function sumOrderTotals(
  orders: Array<{ totalAmount?: number; total?: number }>
): number {
  return orders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);
}
