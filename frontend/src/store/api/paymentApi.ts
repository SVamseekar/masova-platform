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
  countryCode?: string;  // ISO 3166-1 alpha-2; null = India = Razorpay
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
  status: 'INITIATED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
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
    baseUrl: API_CONFIG.BASE_URL,
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
        url: '/api/payments/initiate',
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
        url: '/api/payments/cash',
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
        url: '/api/payments/verify',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Get transaction by ID
    getTransaction: builder.query<PaymentResponse, string>({
      query: (transactionId) => `/api/payments/${transactionId}`,
      providesTags: (result, error, transactionId) => [{ type: 'Payment', id: transactionId }],
    }),

    // Get transaction by order ID
    getTransactionByOrderId: builder.query<PaymentResponse, string>({
      query: (orderId) => `/api/payments?orderId=${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Payment', id: `order-${orderId}` }],
    }),

    // Get transactions by customer ID
    getTransactionsByCustomerId: builder.query<PaymentResponse[], string>({
      query: (customerId) => `/api/payments?customerId=${customerId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ transactionId }) => ({ type: 'Payment' as const, id: transactionId })), 'Payment']
          : ['Payment'],
    }),

    // Get transactions by store ID
    getTransactionsByStoreId: builder.query<PaymentResponse[], string | undefined>({
      query: (storeId) => `/api/payments${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) =>
        result
          ? [...result.map(({ transactionId }) => ({ type: 'Payment' as const, id: transactionId })), { type: 'Payment', id: storeId || 'DEFAULT' }]
          : [{ type: 'Payment', id: storeId || 'DEFAULT' }],
    }),

    // Get reconciliation report
    getReconciliationReport: builder.query<ReconciliationReport, { date: string }>({
      query: ({ date }) => ({
        url: '/api/payments?reconciliation=true',
        params: { date },
      }),
      providesTags: ['Reconciliation'],
    }),

    // Mark as reconciled
    markAsReconciled: builder.mutation<void, { transactionId: string; reconciledBy: string }>({
      query: ({ transactionId, reconciledBy }) => ({
        url: `/api/payments/${transactionId}/reconcile`,
        method: 'POST',
        params: { reconciledBy },
      }),
      invalidatesTags: ['Payment', 'Reconciliation'],
    }),

    // Initiate refund
    initiateRefund: builder.mutation<Refund, RefundRequest>({
      query: (request) => ({
        url: '/api/payments/refund',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Payment', 'Refund'],
    }),

    // Get refund by ID
    getRefund: builder.query<Refund, string>({
      query: (refundId) => `/api/payments/refund/${refundId}`,
      providesTags: (result, error, refundId) => [{ type: 'Refund', id: refundId }],
    }),

    // Get refunds by transaction ID
    getRefundsByTransactionId: builder.query<Refund[], string>({
      query: (transactionId) => `/api/payments/refund?transactionId=${transactionId}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),

    // Get refunds by order ID
    getRefundsByOrderId: builder.query<Refund[], string>({
      query: (orderId) => `/api/payments/refund?orderId=${orderId}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),

    // Get refunds by customer ID
    getRefundsByCustomerId: builder.query<Refund[], string>({
      query: (customerId) => `/api/payments/refund?customerId=${customerId}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
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
} = paymentApi;
