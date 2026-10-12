import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  useCheckDeliveryRadiusQuery,
  storeApi,
  useGetStoreQuery,
  useGetStoreByCodeQuery,
  useGetActiveStoresQuery,
  useGetActiveStoresProtectedQuery,
  useGetStoresByRegionQuery,
  useGetNearbyStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useGetOperationalStatusQuery,
  useGetStoreMetricsQuery,
} from './storeApi';
import { TEST_API_BASE } from '../../test/testApiBase';

const API = TEST_API_BASE;



const mockStore = {
  id: 'store-1',
  name: 'MaSoVa Downtown',
  storeCode: 'MVD-001',
  address: { street: '123 Main St', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  status: 'ACTIVE',
  operatingConfig: { weeklySchedule: {} },
};

describe('storeApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(storeApi.reducerPath).toBe('storeApi');
    });

    it('should define all expected endpoints', () => {
      const endpoints = storeApi.endpoints;
      expect(endpoints.getStore).toBeDefined();
      expect(endpoints.getStoreByCode).toBeDefined();
      expect(endpoints.getActiveStores).toBeDefined();
      expect(endpoints.getActiveStoresProtected).toBeDefined();
      expect(endpoints.getStoresByRegion).toBeDefined();
      expect(endpoints.getNearbyStores).toBeDefined();
      expect(endpoints.createStore).toBeDefined();
      expect(endpoints.updateStore).toBeDefined();
      expect(endpoints.getOperationalStatus).toBeDefined();
      expect(endpoints.getStoreMetrics).toBeDefined();
    });
  });

  describe('query endpoints', () => {
    it('should fetch store by ID', async () => {
      server.use(
        http.get(`${API}/stores/:storeId`, () => HttpResponse.json(mockStore)),
      );

      const { result } = renderHook(() => useGetStoreQuery('store-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.name).toBe('MaSoVa Downtown');
    });

    it('should fetch store by code', async () => {
      server.use(
        http.get(`${API}/stores`, () => HttpResponse.json([mockStore])),
      );

      const { result } = renderHook(() => useGetStoreByCodeQuery('MVD-001'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch active stores (public)', async () => {
      server.use(
        http.get(`${API}/stores`, () => HttpResponse.json([mockStore])),
      );

      const { result } = renderHook(() => useGetActiveStoresQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch active stores (protected)', async () => {
      server.use(
        http.get(`${API}/stores`, () => HttpResponse.json([mockStore])),
      );

      const { result } = renderHook(() => useGetActiveStoresProtectedQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch stores by region', async () => {
      server.use(
        http.get(`${API}/stores`, () => HttpResponse.json([mockStore])),
      );

      const { result } = renderHook(() => useGetStoresByRegionQuery('region-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch nearby stores', async () => {
      server.use(
        http.get(`${API}/stores/nearby`, () => HttpResponse.json([mockStore])),
      );

      const { result } = renderHook(
        () => useGetNearbyStoresQuery({ latitude: 17.385, longitude: 78.4867 }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch operational status', async () => {
      server.use(
        http.get(`${API}/stores/operational-status`, () =>
          HttpResponse.json({ isOperational: true }),
        ),
      );

      const { result } = renderHook(() => useGetOperationalStatusQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isOperational).toBe(true);
    });

    it('should fetch store metrics', async () => {
      server.use(
        http.get(`${API}/stores/metrics`, () =>
          HttpResponse.json({
            totalOrders: 120,
            activeOrders: 5,
            totalRevenue: 45000,
            averageOrderValue: 375,
            activeEmployees: 8,
          }),
        ),
      );

      const { result } = renderHook(() => useGetStoreMetricsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.totalOrders).toBe(120);
    });
  });

  describe('mutation endpoints', () => {
    it('should create a store', async () => {
      server.use(
        http.post(`${API}/stores`, () => HttpResponse.json(mockStore)),
      );

      const { result } = renderHook(() => useCreateStoreMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [create] = result.current;
      create({
        name: 'New Store',
        storeCode: 'MVD-002',
        address: { street: '456 Ave', city: 'Hyderabad', state: 'Telangana', pincode: '500002' },
        operatingConfig: { weeklySchedule: mockStore.operatingConfig.weeklySchedule },
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update a store', async () => {
      server.use(
        http.patch(`${API}/stores/:storeId`, () => HttpResponse.json(mockStore)),
      );

      const { result } = renderHook(() => useUpdateStoreMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [update] = result.current;
      update({ storeId: 'store-1', data: { name: 'Updated Store' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('error handling', () => {
    it('should handle store not found', async () => {
      server.use(
        http.get(`${API}/stores/:storeId`, () =>
          HttpResponse.json({ message: 'Store not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHook(() => useGetStoreQuery('nonexistent'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('delivery area check', () => {
    const inRange = [{ id: 'mongo-1', storeCode: 'DOM001', name: 'Berlin', operatingConfig: { deliveryRadiusKm: 8.5 } }];

    it('treats a store in the server list as in range, matched by store code or id', async () => {
      server.use(http.get(`${API}/stores`, () => HttpResponse.json(inRange)));
      const byCode = renderHook(() => useCheckDeliveryRadiusQuery({ storeId: 'DOM001', latitude: 52.52, longitude: 13.39 }), { wrapper: DefaultTestWrapper });
      await waitFor(() => expect(byCode.result.current.isSuccess).toBe(true));
      expect(byCode.result.current.data).toMatchObject({ withinRadius: true, deliveryRadiusKm: 8.5 });
      const byId = renderHook(() => useCheckDeliveryRadiusQuery({ storeId: 'mongo-1', latitude: 52.52, longitude: 13.38 }), { wrapper: DefaultTestWrapper });
      await waitFor(() => expect(byId.result.current.isSuccess).toBe(true));
      expect(byId.result.current.data?.withinRadius).toBe(true);
    });

    it('treats a store missing from the server list as out of range, with no radius figure', async () => {
      server.use(http.get(`${API}/stores`, () => HttpResponse.json(inRange)));
      const { result } = renderHook(() => useCheckDeliveryRadiusQuery({ storeId: 'DOM002', latitude: 52.52, longitude: 13.37 }), { wrapper: DefaultTestWrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.withinRadius).toBe(false);
      expect(result.current.data?.deliveryRadiusKm).toBeUndefined();
    });
  });
});
