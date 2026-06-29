/** Derived payment summary from order records for dashboard views. */

export interface OrderPaymentRecord {
  id: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  isOrderPayment?: boolean;
  transactionId?: string;
  paymentGateway?: string;
  paymentMethodType?: string;
  currency?: string;
  stripeFeeMinorUnits?: number;
}