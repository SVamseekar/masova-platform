import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';


const mockTransaction = {
  transactionId: 'txn-1',
  orderId: 'order-1',
  razorpayOrderId: 'order_mock123',
  razorpayPaymentId: 'pay_mock456',
  amount: 927,
  status: 'SUCCESS',
  paymentMethod: 'UPI',
  customerId: '1',
  customerEmail: 'customer@example.com',
  storeId: '1',
  currency: 'INR',
  createdAt: '2025-01-15T10:30:00Z',
  paidAt: '2025-01-15T10:31:00Z',
  razorpayKeyId: 'rzp_test_mock_key',
};

const mockRefund = {
  id: 'refund-1',
  transactionId: 'txn-1',
  orderId: 'order-1',
  razorpayRefundId: 'rfnd_mock789',
  razorpayPaymentId: 'pay_mock456',
  amount: 927,
  status: 'PROCESSED',
  type: 'FULL',
  reason: 'Customer requested cancellation',
  initiatedBy: 'manager-1',
  customerId: '1',
  speed: 'normal',
  createdAt: '2025-01-15T12:00:00Z',
  updatedAt: '2025-01-15T12:05:00Z',
  processedAt: '2025-01-15T12:05:00Z',
};

export const paymentHandlers = [
  http.post(apiUrl('/payments/initiate'), () =>
    HttpResponse.json({ ...mockTransaction, status: 'INITIATED', paidAt: undefined }),
  ),

  http.post(apiUrl('/payments/cash'), () =>
    HttpResponse.json({ ...mockTransaction, paymentMethod: 'CASH' }),
  ),

  http.post(apiUrl('/payments/verify'), () =>
    HttpResponse.json(mockTransaction),
  ),

  http.get(apiUrl('/payments/:transactionId'), () =>
    HttpResponse.json(mockTransaction),
  ),

  http.get(apiUrl('/payments/order/:orderId'), () =>
    HttpResponse.json(mockTransaction),
  ),

  http.get(apiUrl('/payments/customer/:customerId'), () =>
    HttpResponse.json([mockTransaction]),
  ),

  http.get(apiUrl('/payments/store'), () =>
    HttpResponse.json([mockTransaction]),
  ),

  http.get(apiUrl('/payments/reconciliation'), () =>
    HttpResponse.json({
      reportDate: '2025-01-15',
      storeId: '1',
      totalTransactions: 50,
      successfulTransactions: 48,
      failedTransactions: 2,
      refundedTransactions: 3,
      totalAmount: 45000,
      successfulAmount: 43000,
      refundedAmount: 2000,
      netAmount: 41000,
      paymentMethodBreakdown: { UPI: 30, CARD: 15, CASH: 5 },
      unreconciledCount: 1,
    }),
  ),

  http.post(apiUrl('/payments/:transactionId/reconcile'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(apiUrl('/payments/refund'), () =>
    HttpResponse.json(mockRefund),
  ),

  http.get(apiUrl('/payments/refund/:refundId'), () =>
    HttpResponse.json(mockRefund),
  ),

  http.get(apiUrl('/payments/refund/transaction/:transactionId'), () =>
    HttpResponse.json([mockRefund]),
  ),

  http.get(apiUrl('/payments/refund/order/:orderId'), () =>
    HttpResponse.json([mockRefund]),
  ),

  http.get(apiUrl('/payments/refund/customer/:customerId'), () =>
    HttpResponse.json([mockRefund]),
  ),
];
