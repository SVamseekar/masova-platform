import type { CartItem } from '../../../store/slices/cartSlice';
import { checkoutCartConfiguration } from '../../checkout/components/checkoutContext';
import type { Order } from '../../../store/api/orderApi';
import type { PaymentMethodCode } from '../../../utils/paymentMethods';

const key = 'checkoutPaymentContext';
export interface PaymentContext {
  orderId: string;
  storeId: string;
  userId: string | null;
  cartConfiguration: string;
  orderType: Order['orderType'];
  method: PaymentMethodCode;
}
export function readPaymentContext(): PaymentContext | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null') as PaymentContext | null;
    return value && typeof value.orderId === 'string' && typeof value.storeId === 'string' && typeof value.cartConfiguration === 'string' ? value : null;
  } catch { return null; }
}
export function savePaymentContext(context: PaymentContext): boolean {
  try { sessionStorage.setItem(key, JSON.stringify(context)); sessionStorage.setItem('activeOrderId', context.orderId); return true; }
  catch { return false; }
}
export function clearPaymentContext(orderId: string) {
  if (readPaymentContext()?.orderId === orderId) sessionStorage.removeItem(key);
}
export const matchesPaymentContext = (context: PaymentContext, storeId: string | null, userId: string | null, items: CartItem[]) =>
  context.storeId === storeId && context.userId === userId && context.cartConfiguration === checkoutCartConfiguration(items);

/** Only a known rejection permits another create request; a lost response may have committed. */
export function isKnownOrderRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) return false;
  return [400, 401, 403, 404, 422, 429].includes(Number(error.status));
}
