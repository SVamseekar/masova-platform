import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { API_CONFIG } from '../../config/api.config';

export interface InitiatePaymentRequest {
  orderId: string;
  amount: number; // Amount in rupees - will be converted to string for BigDecimal precision
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  storeId: string;
  orderType?: string; // For payment analytics categorization
  paymentMethod?: string; // For payment analytics categorization
  notes?: string;
  countryCode?: string;  // ISO 3166-1 alpha-2; null/IN = India = Razorpay
  currency?: string;     // ISO 4217 from cart/store; required for correct Stripe currency
}

export interface PaymentCallbackRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string;
}

export interface PaymentResponse {
  transactionId: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  status: 'INITIATED' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIAL_REFUND';
  paymentMethod?: 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'CASH' | 'AGGREGATOR_COLLECTED' | 'OTHER';
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  storeId: string;
  currency: string;
  createdAt: string;
  paidAt?: string;
  razorpayKeyId?: string; // Public key for Razorpay integration
  // Global-4 Stripe fields
  paymentGateway?: 'RAZORPAY' | 'STRIPE';
  stripeClientSecret?: string;
  stripePublishableKey?: string;
  stripeFeeMinorUnits?: number;
  paymentMethodType?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  type: 'FULL' | 'PARTIAL';
  reason: string;
  initiatedBy: string;
  notes?: string;
  speed?: 'normal' | 'optimum';
}

export interface Refund {
  id: string;
  transactionId: string;
  orderId: string;
  razorpayRefundId: string;
  razorpayPaymentId: string;
  amount: number;
  status: 'INITIATED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'PENDING_APPROVAL' | 'REJECTED';
  type: 'FULL' | 'PARTIAL';
  reason: string;
  initiatedBy: string;
  customerId: string;
  speed: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface ReconciliationReport {
  reportDate: string;
  storeId: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  totalAmount: number;
  successfulAmount: number;
  refundedAmount: number;
  netAmount: number;
  paymentMethodBreakdown: Record<string, number>;
  unreconciledCount: number;
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_CONFIG.PAYMENT_SERVICE_URL}/payments`,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart?.selectedStoreId;

      // Add authorization token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Add user context headers
      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
        if (user.storeId) {
          headers.set('X-User-Store-Id', user.storeId);
        }
      }

      // Add selected store for managers/customers
      if (selectedStoreId) {
        headers.set('X-Selected-Store-Id', selectedStoreId);
      }

      return headers;
    },
  }),
  tagTypes: ['Payment', 'Refund', 'Reconciliation'],
  endpoints: (builder) => ({
    // Initiate payment
    initiatePayment: builder.mutation<PaymentResponse, InitiatePaymentRequest>({
      query: (request) => ({
        url: '/initiate',
        method: 'POST',
        body: {
          ...request,
          // Convert amount to string with 2 decimal places for BigDecimal precision
          amount: request.amount.toFixed(2),
        },
      }),
      invalidatesTags: ['Payment'],
    }),

    // Record cash payment
    recordCashPayment: builder.mutation<PaymentResponse, InitiatePaymentRequest>({
      query: (request) => ({
        url: '/cash',
        method: 'POST',
        body: {
          ...request,
          // Convert amount to string with 2 decimal places for BigDecimal precision
          amount: request.amount.toFixed(2),
        },
      }),
      invalidatesTags: ['Payment'],
    }),

    // Verify payment
    verifyPayment: builder.mutation<PaymentResponse, PaymentCallbackRequest>({
      query: (request) => ({
        url: '/verify',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Get transaction by ID
    getTransaction: builder.query<PaymentResponse, string>({
      query: (transactionId) => `/${transactionId}`,
      providesTags: (result, error, transactionId) => [{ type: 'Payment', id: transactionId }],
    }),

    // Get transaction by order ID — canonical GET /payments?orderId= (legacy /order/{id} still on BE)
    getTransactionByOrderId: builder.query<PaymentResponse, string>({
      query: (orderId) => `?orderId=${encodeURIComponent(orderId)}`,
      providesTags: (result, error, orderId) => [{ type: 'Payment', id: `order-${orderId}` }],
    }),

    // Get transactions by customer ID — canonical GET /payments?customerId=
    getTransactionsByCustomerId: builder.query<PaymentResponse[], string>({
      query: (customerId) => `?customerId=${encodeURIComponent(customerId)}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ transactionId }) => ({ type: 'Payment' as const, id: transactionId })), 'Payment']
          : ['Payment'],
    }),

    // Get transactions by store — canonical GET /payments (store from X-Selected-Store-Id / X-User-Store-Id)
    // Optional storeId query kept for BE /store alias compatibility
    getTransactionsByStoreId: builder.query<PaymentResponse[], string | undefined>({
      query: (storeId) => (storeId ? `?storeId=${encodeURIComponent(storeId)}` : ''),
      providesTags: (result, error, storeId) =>
        result
          ? [...result.map(({ transactionId }) => ({ type: 'Payment' as const, id: transactionId })), { type: 'Payment', id: storeId || 'DEFAULT' }]
          : [{ type: 'Payment', id: storeId || 'DEFAULT' }],
    }),

    // Get reconciliation report — canonical GET /payments?reconciliation=true&date=
    getReconciliationReport: builder.query<ReconciliationReport, { date: string }>({
      query: ({ date }) => ({
        url: '',
        params: { reconciliation: true, date },
      }),
      providesTags: ['Reconciliation'],
    }),

    // Mark as reconciled
    markAsReconciled: builder.mutation<void, { transactionId: string; reconciledBy: string }>({
      query: ({ transactionId, reconciledBy }) => ({
        url: `/${transactionId}/reconcile`,
        method: 'POST',
        params: { reconciledBy },
      }),
      invalidatesTags: ['Payment', 'Reconciliation'],
    }),

    // Initiate refund
    initiateRefund: builder.mutation<Refund, RefundRequest>({
      query: (request) => ({
        url: '/refund',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Payment', 'Refund'],
    }),

    // Get refund by ID
    getRefund: builder.query<Refund, string>({
      query: (refundId) => `/refund/${refundId}`,
      providesTags: (result, error, refundId) => [{ type: 'Refund', id: refundId }],
    }),

    // Get refunds by transaction ID — canonical GET /refund?transactionId=
    getRefundsByTransactionId: builder.query<Refund[], string>({
      query: (transactionId) => `/refund?transactionId=${encodeURIComponent(transactionId)}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),

    // Get refunds by order ID — canonical GET /refund?orderId=
    getRefundsByOrderId: builder.query<Refund[], string>({
      query: (orderId) => `/refund?orderId=${encodeURIComponent(orderId)}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),

    // Get refunds by customer ID — canonical GET /refund?customerId=
    getRefundsByCustomerId: builder.query<Refund[], string>({
      query: (customerId) => `/refund?customerId=${encodeURIComponent(customerId)}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),

    // List refunds (canonical GET /refund?transactionId|orderId|customerId|storeId|status)
    getRefunds: builder.query<
      Refund[],
      { transactionId?: string; orderId?: string; customerId?: string; storeId?: string; status?: string }
    >({
      query: ({ transactionId, orderId, customerId, storeId, status }) => {
        const params = new URLSearchParams();
        if (transactionId) params.append('transactionId', transactionId);
        if (orderId) params.append('orderId', orderId);
        if (customerId) params.append('customerId', customerId);
        if (storeId) params.append('storeId', storeId);
        if (status) params.append('status', status);
        const qs = params.toString();
        return qs ? `/refund?${qs}` : '/refund';
      },
      providesTags: ['Refund'],
    }),

    getPendingRefunds: builder.query<Refund[], string | undefined>({
      query: (storeId) => `/refund?${storeId ? `storeId=${encodeURIComponent(storeId)}&` : ''}status=PENDING_APPROVAL`,
      providesTags: ['Refund'],
    }),

    // Request refund pending manager approval (no money moved)
    requestRefundApproval: builder.mutation<Refund, RefundRequest>({
      query: (request) => ({
        url: '/refund/request',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Payment', 'Refund'],
    }),

    approveRefund: builder.mutation<Refund, string>({
      query: (refundId) => ({
        url: `/refund/${refundId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Payment', 'Refund'],
    }),

    rejectRefund: builder.mutation<Refund, { refundId: string; reason?: string }>({
      query: ({ refundId, reason }) => ({
        url: `/refund/${refundId}/reject`,
        method: 'POST',
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: ['Payment', 'Refund'],
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
  useRecordCashPaymentMutation,
  useVerifyPaymentMutation,
  useGetTransactionQuery,
  useGetTransactionByOrderIdQuery,
  useGetTransactionsByCustomerIdQuery,
  useGetTransactionsByStoreIdQuery,
  useGetReconciliationReportQuery,
  useMarkAsReconciledMutation,
  useInitiateRefundMutation,
  useGetRefundQuery,
  useGetRefundsByTransactionIdQuery,
  useGetRefundsByOrderIdQuery,
  useGetRefundsByCustomerIdQuery,
  useGetRefundsQuery,
  useGetPendingRefundsQuery,
  useRequestRefundApprovalMutation,
  useApproveRefundMutation,
  useRejectRefundMutation,
} = paymentApi;
