import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
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

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
        http.get(`${API}/stores/code/:storeCode`, () => HttpResponse.json(mockStore)),
      );

      const { result } = renderHook(() => useGetStoreByCodeQuery('MVD-001'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch active stores (public)', async () => {
      server.use(
        http.get(`${API}/stores/public`, () => HttpResponse.json([mockStore])),
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
        http.get(`${API}/stores/region/:regionId`, () => HttpResponse.json([mockStore])),
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
        operatingConfig: { weeklySchedule: {} as any },
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update a store', async () => {
      server.use(
        http.put(`${API}/stores/:storeId`, () => HttpResponse.json(mockStore)),
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
});
