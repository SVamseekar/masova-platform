import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  orderApi,
  useGetOrdersQuery,
  useGetOrderQuery,
  useTrackOrderQuery,
  useGetKitchenQueueQuery,
  useGetOrdersByStatusQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useGetCustomerOrdersQuery,
  useGetOrderByNumberQuery,
  useGetStoreOrdersQuery,
  useMoveToNextStageMutation,
  useAssignDriverMutation,
  useUpdatePaymentStatusMutation,
  useUpdateOrderItemsMutation,
  useUpdateOrderPriorityMutation,
  useSearchOrdersQuery,
  useAddQualityCheckpointMutation,
  useGetQualityCheckpointsQuery,
  useGetAveragePreparationTimeQuery,
  useGetOrdersByDateQuery,
  useGetOrdersByDateRangeQuery,
  useGetActiveDeliveriesCountQuery,
} from './orderApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('orderApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(orderApi.reducerPath).toBe('orderApi');
    });

    it('should define all expected endpoints', () => {
      const endpoints = orderApi.endpoints;
      expect(endpoints.getOrders).toBeDefined();
      expect(endpoints.getOrder).toBeDefined();
      expect(endpoints.trackOrder).toBeDefined();
      expect(endpoints.getKitchenQueue).toBeDefined();
      expect(endpoints.createOrder).toBeDefined();
      expect(endpoints.updateOrderStatus).toBeDefined();
      expect(endpoints.cancelOrder).toBeDefined();
      expect(endpoints.moveToNextStage).toBeDefined();
      expect(endpoints.assignDriver).toBeDefined();
      expect(endpoints.updatePaymentStatus).toBeDefined();
      expect(endpoints.searchOrders).toBeDefined();
      expect(endpoints.addQualityCheckpoint).toBeDefined();
      expect(endpoints.getOrdersByDate).toBeDefined();
      expect(endpoints.getActiveDeliveriesCount).toBeDefined();
    });
  });

  describe('query endpoints', () => {
    it('should fetch all orders', async () => {
      const { result } = renderHook(() => useGetOrdersQuery({}), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data!.length).toBeGreaterThan(0);
    });

    it('should fetch a single order by ID', async () => {
      const { result } = renderHook(() => useGetOrderQuery('order-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.id).toBe('order-1');
    });

    it('should track an order by ID (public endpoint)', async () => {
      const { result } = renderHook(() => useTrackOrderQuery('order-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.status).toBe('DISPATCHED');
    });

    it('should fetch kitchen queue', async () => {
      const { result } = renderHook(() => useGetKitchenQueueQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch orders by status', async () => {
      const { result } = renderHook(() => useGetOrdersByStatusQuery('RECEIVED'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch customer orders', async () => {
      const { result } = renderHook(() => useGetCustomerOrdersQuery('1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch order by order number', async () => {
      const { result } = renderHook(() => useGetOrderByNumberQuery('ORD-20250101-001'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch store orders', async () => {
      const { result } = renderHook(() => useGetStoreOrdersQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should search orders', async () => {
      const { result } = renderHook(
        () => useSearchOrdersQuery({ storeId: '1', query: 'pizza' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch quality checkpoints', async () => {
      const { result } = renderHook(() => useGetQualityCheckpointsQuery('order-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch average preparation time', async () => {
      const { result } = renderHook(
        () => useGetAveragePreparationTimeQuery({ date: '2025-01-15' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(18);
    });

    it('should fetch orders by date', async () => {
      const { result } = renderHook(() => useGetOrdersByDateQuery('2025-01-15'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch orders by date range', async () => {
      const { result } = renderHook(
        () => useGetOrdersByDateRangeQuery({ startDate: '2025-01-01', endDate: '2025-01-31' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch active deliveries count', async () => {
      const { result } = renderHook(() => useGetActiveDeliveriesCountQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.count).toBe(3);
    });
  });

  describe('mutation endpoints', () => {
    it('should create an order', async () => {
      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [createOrder] = result.current;
      createOrder({
        storeId: '1',
        customerName: 'Test User',
        items: [{ menuItemId: '1', name: 'Pizza', quantity: 1, price: 299 }],
        orderType: 'DELIVERY',
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });

    it('should update order status', async () => {
      const { result } = renderHook(() => useUpdateOrderStatusMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updateStatus] = result.current;
      updateStatus({ orderId: 'order-1', status: 'PREPARING' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });

    it('should cancel an order', async () => {
      const { result } = renderHook(() => useCancelOrderMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [cancelOrder] = result.current;
      cancelOrder({ orderId: 'order-1', reason: 'Customer request' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data?.status).toBe('CANCELLED');
    });

    it('should move order to next stage', async () => {
      const { result } = renderHook(() => useMoveToNextStageMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [moveToNext] = result.current;
      moveToNext('order-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should assign a driver', async () => {
      const { result } = renderHook(() => useAssignDriverMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [assignDriver] = result.current;
      assignDriver({ orderId: 'order-1', driverId: 'driver-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update payment status', async () => {
      const { result } = renderHook(() => useUpdatePaymentStatusMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updatePayment] = result.current;
      updatePayment({ orderId: 'order-1', status: 'PAID' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update order items', async () => {
      const { result } = renderHook(() => useUpdateOrderItemsMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updateItems] = result.current;
      updateItems({
        orderId: 'order-1',
        items: [{ menuItemId: '1', name: 'Pizza', quantity: 2, price: 299 }],
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update order priority', async () => {
      const { result } = renderHook(() => useUpdateOrderPriorityMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updatePriority] = result.current;
      updatePriority({ orderId: 'order-1', priority: 'URGENT' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should add quality checkpoint', async () => {
      const { result } = renderHook(() => useAddQualityCheckpointMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [addCheckpoint] = result.current;
      addCheckpoint({
        orderId: 'order-1',
        checkpoint: {
          checkpointName: 'Temperature Check',
          type: 'TEMPERATURE',
          status: 'PASSED',
        },
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('error handling', () => {
    it('should handle order not found', async () => {
      server.use(
        http.get(`${API}/orders/:orderId`, () =>
          HttpResponse.json({ message: 'Order not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHook(() => useGetOrderQuery('nonexistent'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('should handle create order failure', async () => {
      server.use(
        http.post(`${API}/orders`, () =>
          HttpResponse.json({ message: 'Validation error' }, { status: 400 }),
        ),
      );

      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [createOrder] = result.current;
      createOrder({
        storeId: '1',
        customerName: 'Test',
        items: [],
        orderType: 'DELIVERY',
      });

      await waitFor(() => expect(result.current[1].isError).toBe(true));
    });
  });
});
