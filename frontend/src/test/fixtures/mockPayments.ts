import type { PaymentResponse, Refund } from '../../store/api/paymentApi';

// ---------------------------------------------------------------------------
// Payment responses
// ---------------------------------------------------------------------------

export const mockPaymentSuccess: PaymentResponse = {
  transactionId: 'txn-1',
  orderId: 'order-1',
  razorpayOrderId: 'rpay_order_abc123',
  razorpayPaymentId: 'rpay_pay_xyz789',
  amount: 39.07,
  status: 'SUCCESS',
  paymentMethod: 'UPI',
  customerId: 'cust-1',
  customerEmail: 'customer@test.com',
  customerPhone: '555-0001',
  storeId: 'store-1',
  currency: 'INR',
  createdAt: '2026-02-15T10:00:00Z',
  paidAt: '2026-02-15T10:01:00Z',
};

export const mockPaymentPending: PaymentResponse = {
  transactionId: 'txn-2',
  orderId: 'order-2',
  razorpayOrderId: 'rpay_order_def456',
  amount: 25.98,
  status: 'PENDING',
  customerId: 'cust-1',
  storeId: 'store-1',
  currency: 'INR',
  createdAt: '2026-02-15T10:05:00Z',
};

export const mockPaymentFailed: PaymentResponse = {
  transactionId: 'txn-3',
  orderId: 'order-3',
  razorpayOrderId: 'rpay_order_ghi789',
  razorpayPaymentId: 'rpay_pay_fail001',
  amount: 34.07,
  status: 'FAILED',
  paymentMethod: 'CARD',
  customerId: 'cust-1',
  storeId: 'store-1',
  currency: 'INR',
  createdAt: '2026-02-15T10:10:00Z',
};

export const mockPaymentCancelled: PaymentResponse = {
  transactionId: 'txn-4',
  orderId: 'order-8',
  razorpayOrderId: 'rpay_order_jkl012',
  amount: 39.07,
  status: 'CANCELLED',
  customerId: 'cust-1',
  storeId: 'store-1',
  currency: 'INR',
  createdAt: '2026-02-15T10:12:00Z',
};

export const mockPaymentRefunded: PaymentResponse = {
  ...mockPaymentSuccess,
  transactionId: 'txn-5',
  orderId: 'order-8',
  status: 'REFUNDED',
};

export const mockPaymentCash: PaymentResponse = {
  transactionId: 'txn-6',
  orderId: 'order-10',
  razorpayOrderId: 'rpay_order_cash001',
  amount: 34.07,
  status: 'SUCCESS',
  paymentMethod: 'CASH',
  customerId: 'cust-1',
  storeId: 'store-1',
  currency: 'INR',
  createdAt: '2026-02-15T10:15:00Z',
  paidAt: '2026-02-15T10:15:00Z',
};

// ---------------------------------------------------------------------------
// Payment list
// ---------------------------------------------------------------------------

export const mockPaymentList: PaymentResponse[] = [
  mockPaymentSuccess,
  mockPaymentPending,
  mockPaymentFailed,
  mockPaymentCancelled,
  mockPaymentCash,
];

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export const mockRefundFull: Refund = {
  id: 'refund-1',
  transactionId: 'txn-1',
  orderId: 'order-8',
  razorpayRefundId: 'rpay_rfnd_abc123',
  razorpayPaymentId: 'rpay_pay_xyz789',
  amount: 39.07,
  status: 'PROCESSED',
  type: 'FULL',
  reason: 'Customer requested cancellation',
  initiatedBy: 'user-2',
  customerId: 'cust-1',
  speed: 'normal',
  createdAt: '2026-02-15T10:15:00Z',
  updatedAt: '2026-02-15T10:20:00Z',
  processedAt: '2026-02-15T10:20:00Z',
};

export const mockRefundPartial: Refund = {
  id: 'refund-2',
  transactionId: 'txn-1',
  orderId: 'order-1',
  razorpayRefundId: 'rpay_rfnd_def456',
  razorpayPaymentId: 'rpay_pay_xyz789',
  amount: 12.99,
  status: 'PROCESSING',
  type: 'PARTIAL',
  reason: 'Item was unavailable',
  initiatedBy: 'user-2',
  customerId: 'cust-1',
  speed: 'optimum',
  notes: 'Refund for 1x Margherita Pizza',
  createdAt: '2026-02-15T10:25:00Z',
  updatedAt: '2026-02-15T10:25:00Z',
};

export const mockRefundFailed: Refund = {
  id: 'refund-3',
  transactionId: 'txn-3',
  orderId: 'order-3',
  razorpayRefundId: 'rpay_rfnd_fail001',
  razorpayPaymentId: 'rpay_pay_fail001',
  amount: 34.07,
  status: 'FAILED',
  type: 'FULL',
  reason: 'Order quality issue',
  initiatedBy: 'user-2',
  customerId: 'cust-1',
  speed: 'normal',
  createdAt: '2026-02-15T10:30:00Z',
  updatedAt: '2026-02-15T10:35:00Z',
};

export const mockRefundList: Refund[] = [
  mockRefundFull,
  mockRefundPartial,
  mockRefundFailed,
];
