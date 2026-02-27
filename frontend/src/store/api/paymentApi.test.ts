import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  paymentApi,
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
} from './paymentApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('paymentApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(paymentApi.reducerPath).toBe('paymentApi');
    });

    it('should define all expected endpoints', () => {
      const endpoints = paymentApi.endpoints;
      expect(endpoints.initiatePayment).toBeDefined();
      expect(endpoints.recordCashPayment).toBeDefined();
      expect(endpoints.verifyPayment).toBeDefined();
      expect(endpoints.getTransaction).toBeDefined();
      expect(endpoints.getTransactionByOrderId).toBeDefined();
      expect(endpoints.getTransactionsByCustomerId).toBeDefined();
      expect(endpoints.getTransactionsByStoreId).toBeDefined();
      expect(endpoints.getReconciliationReport).toBeDefined();
      expect(endpoints.markAsReconciled).toBeDefined();
      expect(endpoints.initiateRefund).toBeDefined();
      expect(endpoints.getRefund).toBeDefined();
      expect(endpoints.getRefundsByTransactionId).toBeDefined();
      expect(endpoints.getRefundsByOrderId).toBeDefined();
      expect(endpoints.getRefundsByCustomerId).toBeDefined();
    });
  });

  describe('query endpoints', () => {
    it('should fetch transaction by ID', async () => {
      const { result } = renderHook(() => useGetTransactionQuery('txn-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.transactionId).toBe('txn-1');
      expect(result.current.data!.status).toBe('SUCCESS');
    });

    it('should fetch transaction by order ID', async () => {
      const { result } = renderHook(() => useGetTransactionByOrderIdQuery('order-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch transactions by customer ID', async () => {
      const { result } = renderHook(() => useGetTransactionsByCustomerIdQuery('1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch transactions by store ID', async () => {
      const { result } = renderHook(() => useGetTransactionsByStoreIdQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch reconciliation report', async () => {
      const { result } = renderHook(
        () => useGetReconciliationReportQuery({ date: '2025-01-15' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.totalTransactions).toBe(50);
    });

    it('should fetch refund by ID', async () => {
      const { result } = renderHook(() => useGetRefundQuery('refund-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.status).toBe('PROCESSED');
    });

    it('should fetch refunds by transaction ID', async () => {
      const { result } = renderHook(() => useGetRefundsByTransactionIdQuery('txn-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch refunds by order ID', async () => {
      const { result } = renderHook(() => useGetRefundsByOrderIdQuery('order-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch refunds by customer ID', async () => {
      const { result } = renderHook(() => useGetRefundsByCustomerIdQuery('1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });

  describe('mutation endpoints', () => {
    it('should initiate a payment', async () => {
      const { result } = renderHook(() => useInitiatePaymentMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [initiate] = result.current;
      initiate({
        orderId: 'order-1',
        amount: 927,
        customerId: '1',
        storeId: '1',
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
      expect(result.current[1].data!.status).toBe('INITIATED');
    });

    it('should record a cash payment', async () => {
      const { result } = renderHook(() => useRecordCashPaymentMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [recordCash] = result.current;
      recordCash({
        orderId: 'order-1',
        amount: 500,
        customerId: '1',
        storeId: '1',
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data!.paymentMethod).toBe('CASH');
    });

    it('should verify a payment', async () => {
      const { result } = renderHook(() => useVerifyPaymentMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [verify] = result.current;
      verify({
        razorpayOrderId: 'order_mock123',
        razorpayPaymentId: 'pay_mock456',
        razorpaySignature: 'sig_mock789',
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should mark as reconciled', async () => {
      const { result } = renderHook(() => useMarkAsReconciledMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [markReconciled] = result.current;
      markReconciled({ transactionId: 'txn-1', reconciledBy: 'manager-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should initiate a refund', async () => {
      const { result } = renderHook(() => useInitiateRefundMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [initiateRefund] = result.current;
      initiateRefund({
        transactionId: 'txn-1',
        amount: 927,
        type: 'FULL',
        reason: 'Customer cancellation',
        initiatedBy: 'manager-1',
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle payment initiation failure', async () => {
      server.use(
        http.post(`${API}/payments/initiate`, () =>
          HttpResponse.json({ message: 'Payment failed' }, { status: 500 }),
        ),
      );

      const { result } = renderHook(() => useInitiatePaymentMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [initiate] = result.current;
      initiate({ orderId: 'order-1', amount: 927, customerId: '1', storeId: '1' });

      await waitFor(() => expect(result.current[1].isError).toBe(true));
    });
  });
});
