import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  deliveryApi,
  useGetAvailableDriversQuery,
  useAutoDispatchMutation,
  useGetOptimizedRouteMutation,
  useUpdateLocationMutation,
  useTrackOrderQuery,
  useGetETAQuery,
  useGetDeliveryMetricsQuery,
  useGetTodayMetricsQuery,
  useGetDriverPerformanceQuery,
  useGetDriverPerformanceTodayQuery,
  useGetDriverStatusQuery,
  useGetDriverPendingDeliveriesQuery,
  useCheckDeliveryZoneQuery,
  useGetDeliveryZoneFeeQuery,
  useListDeliveryZonesQuery,
  useValidateDeliveryZoneQuery,
  useAcceptDeliveryMutation,
  useRejectDeliveryMutation,
  useGenerateDeliveryOTPMutation,
  useRegenerateDeliveryOTPMutation,
} from './deliveryApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('deliveryApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(deliveryApi.reducerPath).toBe('deliveryApi');
    });

    it('should define all expected endpoints', () => {
      const endpoints = deliveryApi.endpoints;
      expect(endpoints.getAvailableDrivers).toBeDefined();
      expect(endpoints.autoDispatch).toBeDefined();
      expect(endpoints.getOptimizedRoute).toBeDefined();
      expect(endpoints.updateLocation).toBeDefined();
      expect(endpoints.trackOrder).toBeDefined();
      expect(endpoints.getETA).toBeDefined();
      expect(endpoints.getDeliveryMetrics).toBeDefined();
      expect(endpoints.getTodayMetrics).toBeDefined();
      expect(endpoints.acceptDelivery).toBeDefined();
      expect(endpoints.rejectDelivery).toBeDefined();
      expect(endpoints.generateDeliveryOTP).toBeDefined();
      expect(endpoints.regenerateDeliveryOTP).toBeDefined();
    });
  });

  describe('query endpoints', () => {
    it('should fetch available drivers', async () => {
      const { result } = renderHook(() => useGetAvailableDriversQuery('1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBe(2);
      expect(result.current.data![0].name).toBe('Rajesh Kumar');
    });

    it('should track an order', async () => {
      const { result } = renderHook(() => useTrackOrderQuery('order-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.orderId).toBe('order-1');
      expect(result.current.data!.status).toBe('IN_TRANSIT');
    });

    it('should fetch ETA for an order', async () => {
      const { result } = renderHook(() => useGetETAQuery('order-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.confidence).toBe('HIGH');
      expect(result.current.data!.timeRemaining).toBe(15);
    });

    it('should fetch delivery metrics', async () => {
      const { result } = renderHook(
        () => useGetDeliveryMetricsQuery({}),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.totalDeliveries).toBe(150);
    });

    it('should fetch today metrics', async () => {
      const { result } = renderHook(() => useGetTodayMetricsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.activeDeliveries).toBe(3);
    });

    it('should fetch driver performance', async () => {
      const { result } = renderHook(() => useGetDriverPerformanceQuery('driver-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch driver performance today', async () => {
      const { result } = renderHook(() => useGetDriverPerformanceTodayQuery('driver-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch driver status', async () => {
      const { result } = renderHook(() => useGetDriverStatusQuery('driver-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch driver pending deliveries', async () => {
      const { result } = renderHook(() => useGetDriverPendingDeliveriesQuery('driver-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should check delivery zone', async () => {
      const { result } = renderHook(
        () => useCheckDeliveryZoneQuery({ latitude: 17.385, longitude: 78.4867 }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch delivery zone fee', async () => {
      const { result } = renderHook(
        () => useGetDeliveryZoneFeeQuery({ latitude: 17.385, longitude: 78.4867 }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should list delivery zones', async () => {
      const { result } = renderHook(() => useListDeliveryZonesQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBe(2);
    });

    it('should validate delivery zone', async () => {
      const { result } = renderHook(
        () => useValidateDeliveryZoneQuery({ latitude: 17.385, longitude: 78.4867 }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });

  describe('mutation endpoints', () => {
    it('should auto-dispatch a driver', async () => {
      const { result } = renderHook(() => useAutoDispatchMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [autoDispatch] = result.current;
      autoDispatch({ orderId: 'order-1', storeId: '1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
      expect(result.current[1].data!.driverName).toBe('Rajesh Kumar');
      expect(result.current[1].data!.dispatchMethod).toBe('AUTO');
    });

    it('should get optimized route with transform', async () => {
      const { result } = renderHook(() => useGetOptimizedRouteMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [getRoute] = result.current;
      getRoute({
        origin: { latitude: 17.385, longitude: 78.4867 },
        destination: { latitude: 17.39, longitude: 78.49 },
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      const data = result.current[1].data;
      expect(data).toBeDefined();
      expect(data!.distanceKm).toBeDefined();
      expect(data!.durationMinutes).toBeDefined();
    });

    it('should update driver location', async () => {
      const { result } = renderHook(() => useUpdateLocationMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updateLocation] = result.current;
      updateLocation({ driverId: 'driver-1', latitude: 17.385, longitude: 78.4867 });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should accept a delivery', async () => {
      const { result } = renderHook(() => useAcceptDeliveryMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [accept] = result.current;
      accept({ orderId: 'order-1', driverId: 'driver-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should reject a delivery', async () => {
      const { result } = renderHook(() => useRejectDeliveryMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [reject] = result.current;
      reject({ orderId: 'order-1', driverId: 'driver-1', reason: 'Too far' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should generate delivery OTP', async () => {
      const { result } = renderHook(() => useGenerateDeliveryOTPMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [generateOTP] = result.current;
      generateOTP('order-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should regenerate delivery OTP', async () => {
      const { result } = renderHook(() => useRegenerateDeliveryOTPMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [regenerateOTP] = result.current;
      regenerateOTP('order-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('error handling', () => {
    it('should handle tracking error for nonexistent order', async () => {
      server.use(
        http.get(`${API}/delivery/track/:orderId`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHook(() => useTrackOrderQuery('nonexistent'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
