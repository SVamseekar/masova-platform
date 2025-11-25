import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { API_CONFIG } from '../../config/api.config';

export interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  storeId: string;
  notes?: string;
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
  paymentMethod?: 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'CASH' | 'OTHER';
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  storeId: string;
  currency: string;
  createdAt: string;
  paidAt?: string;
  razorpayKeyId?: string; // Public key for Razorpay integration
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
    baseUrl: `${API_CONFIG.PAYMENT_SERVICE_URL}/api/payments`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
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
        body: request,
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

    // Get transaction by order ID
    getTransactionByOrderId: builder.query<PaymentResponse, string>({
      query: (orderId) => `/order/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Payment', id: `order-${orderId}` }],
    }),

    // Get transactions by customer ID
    getTransactionsByCustomerId: builder.query<PaymentResponse[], string>({
      query: (customerId) => `/customer/${customerId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ transactionId }) => ({ type: 'Payment' as const, id: transactionId })), 'Payment']
          : ['Payment'],
    }),

    // Get transactions by store ID
    getTransactionsByStoreId: builder.query<PaymentResponse[], string>({
      query: (storeId) => `/store/${storeId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ transactionId }) => ({ type: 'Payment' as const, id: transactionId })), 'Payment']
          : ['Payment'],
    }),

    // Get reconciliation report
    getReconciliationReport: builder.query<ReconciliationReport, { storeId: string; date: string }>({
      query: ({ storeId, date }) => ({
        url: '/reconciliation',
        params: { storeId, date },
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

    // Get refunds by transaction ID
    getRefundsByTransactionId: builder.query<Refund[], string>({
      query: (transactionId) => `/refund/transaction/${transactionId}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),

    // Get refunds by order ID
    getRefundsByOrderId: builder.query<Refund[], string>({
      query: (orderId) => `/refund/order/${orderId}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),

    // Get refunds by customer ID
    getRefundsByCustomerId: builder.query<Refund[], string>({
      query: (customerId) => `/refund/customer/${customerId}`,
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Refund' as const, id })), 'Refund'] : ['Refund'],
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
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
