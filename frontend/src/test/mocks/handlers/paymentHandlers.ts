import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
  http.post(`${API}/api/payments/initiate`, () =>
    HttpResponse.json({ ...mockTransaction, status: 'INITIATED', paidAt: undefined }),
  ),

  http.post(`${API}/api/payments/cash`, () =>
    HttpResponse.json({ ...mockTransaction, paymentMethod: 'CASH' }),
  ),

  http.post(`${API}/api/payments/verify`, () =>
    HttpResponse.json(mockTransaction),
  ),

  http.get(`${API}/api/payments`, () =>
    HttpResponse.json([mockTransaction]),
  ),

  http.get(`${API}/api/payments/:transactionId`, () =>
    HttpResponse.json(mockTransaction),
  ),

  http.post(`${API}/api/payments/:transactionId/reconcile`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${API}/api/payments/refund`, () =>
    HttpResponse.json(mockRefund),
  ),

  http.get(`${API}/api/payments/refund/:refundId`, () =>
    HttpResponse.json(mockRefund),
  ),

  http.get(`${API}/api/payments/refund`, () =>
    HttpResponse.json([mockRefund]),
  ),
];
