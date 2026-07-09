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

const pendingRefund = {
  ...mockRefund,
  id: 'refund-pending-1',
  razorpayRefundId: '',
  status: 'PENDING_APPROVAL',
  reason: 'Agent requested refund — awaiting manager approval',
  initiatedBy: 'customer-1',
  processedAt: undefined,
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

  // Canonical list: GET /payments?orderId|customerId|storeId|reconciliation+date
  http.get(apiUrl('/payments'), ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('reconciliation') === 'true') {
      return HttpResponse.json({
        reportDate: url.searchParams.get('date') || '2025-01-15',
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
      });
    }
    if (url.searchParams.get('orderId')) {
      return HttpResponse.json(mockTransaction);
    }
    if (url.searchParams.get('customerId') || url.searchParams.get('storeId') || true) {
      return HttpResponse.json([mockTransaction]);
    }
    return HttpResponse.json([mockTransaction]);
  }),

  // Legacy path aliases (still served by BE)
  http.get(apiUrl('/payments/store'), () =>
    HttpResponse.json([mockTransaction]),
  ),

  http.get(apiUrl('/payments/customer/:customerId'), () =>
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

  http.post(apiUrl('/payments/refund'), () =>
    HttpResponse.json(mockRefund),
  ),

  http.post(apiUrl('/payments/refund/request'), () =>
    HttpResponse.json(pendingRefund),
  ),

  http.get(apiUrl('/payments/refund'), ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const transactionId = url.searchParams.get('transactionId');
    const orderId = url.searchParams.get('orderId');
    const customerId = url.searchParams.get('customerId');

    if (status === 'PENDING_APPROVAL') {
      return HttpResponse.json([pendingRefund]);
    }
    if (transactionId || orderId || customerId) {
      return HttpResponse.json([mockRefund]);
    }
    return HttpResponse.json([mockRefund, pendingRefund]);
  }),

  http.post(apiUrl('/payments/refund/:refundId/approve'), ({ params }) =>
    HttpResponse.json({ ...pendingRefund, id: params.refundId, status: 'PROCESSED', processedAt: new Date().toISOString() }),
  ),

  http.post(apiUrl('/payments/refund/:refundId/reject'), ({ params }) =>
    HttpResponse.json({ ...pendingRefund, id: params.refundId, status: 'REJECTED' }),
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

  http.post(apiUrl('/payments/:transactionId/reconcile'), () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Parameterized route last — :transactionId would match "store" / "reconciliation" otherwise
  http.get(apiUrl('/payments/:transactionId'), () =>
    HttpResponse.json(mockTransaction),
  ),

  http.get(apiUrl('/payments/order/:orderId'), () =>
    HttpResponse.json(mockTransaction),
  ),
];