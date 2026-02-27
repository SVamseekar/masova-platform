import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  inventoryApi,
  useCreateInventoryItemMutation,
  useGetAllInventoryItemsQuery,
  useGetInventoryItemByIdQuery,
  useGetItemsByCategoryQuery,
  useSearchInventoryItemsQuery,
  useUpdateInventoryItemMutation,
  useAdjustStockMutation,
  useReserveStockMutation,
  useReleaseReservedStockMutation,
  useConsumeReservedStockMutation,
  useGetLowStockItemsQuery,
  useGetOutOfStockItemsQuery,
  useGetExpiringItemsQuery,
  useGetTotalInventoryValueQuery,
  useGetInventoryValueByCategoryQuery,
  useDeleteInventoryItemMutation,
  useCreateSupplierMutation,
  useGetAllSuppliersQuery,
  useGetSupplierByIdQuery,
  useGetActiveSuppliersQuery,
  useGetPreferredSuppliersQuery,
  useSearchSuppliersQuery,
  useGetAllPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useRecordWasteMutation,
  useGetAllWasteRecordsQuery,
  useGetWasteTrendQuery,
} from './inventoryApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('inventoryApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(inventoryApi.reducerPath).toBe('inventoryApi');
    });

    it('should define inventory item endpoints', () => {
      const endpoints = inventoryApi.endpoints;
      expect(endpoints.createInventoryItem).toBeDefined();
      expect(endpoints.getAllInventoryItems).toBeDefined();
      expect(endpoints.getInventoryItemById).toBeDefined();
      expect(endpoints.updateInventoryItem).toBeDefined();
      expect(endpoints.adjustStock).toBeDefined();
      expect(endpoints.reserveStock).toBeDefined();
      expect(endpoints.getLowStockItems).toBeDefined();
      expect(endpoints.getOutOfStockItems).toBeDefined();
      expect(endpoints.getExpiringItems).toBeDefined();
    });

    it('should define supplier endpoints', () => {
      const endpoints = inventoryApi.endpoints;
      expect(endpoints.createSupplier).toBeDefined();
      expect(endpoints.getAllSuppliers).toBeDefined();
      expect(endpoints.getSupplierById).toBeDefined();
      expect(endpoints.updateSupplier).toBeDefined();
    });

    it('should define purchase order endpoints', () => {
      const endpoints = inventoryApi.endpoints;
      expect(endpoints.createPurchaseOrder).toBeDefined();
      expect(endpoints.getAllPurchaseOrders).toBeDefined();
      expect(endpoints.approvePurchaseOrder).toBeDefined();
    });

    it('should define waste analysis endpoints', () => {
      const endpoints = inventoryApi.endpoints;
      expect(endpoints.recordWaste).toBeDefined();
      expect(endpoints.getAllWasteRecords).toBeDefined();
      expect(endpoints.getWasteTrend).toBeDefined();
    });
  });

  describe('inventory item queries', () => {
    it('should fetch all inventory items', async () => {
      const { result } = renderHook(() => useGetAllInventoryItemsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBe(2);
    });

    it('should fetch inventory item by ID', async () => {
      const { result } = renderHook(() => useGetInventoryItemByIdQuery('inv-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.itemName).toBe('Tomatoes');
    });

    it('should fetch items by category', async () => {
      const { result } = renderHook(
        () => useGetItemsByCategoryQuery({ category: 'RAW_MATERIAL' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should search inventory items', async () => {
      const { result } = renderHook(
        () => useSearchInventoryItemsQuery({ query: 'tomato' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch low stock items', async () => {
      const { result } = renderHook(() => useGetLowStockItemsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBeGreaterThan(0);
    });

    it('should fetch out of stock items', async () => {
      const { result } = renderHook(() => useGetOutOfStockItemsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch expiring items', async () => {
      const { result } = renderHook(() => useGetExpiringItemsQuery({ days: 7 }), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch total inventory value', async () => {
      const { result } = renderHook(() => useGetTotalInventoryValueQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.totalValue).toBe(125000);
    });

    it('should fetch inventory value by category', async () => {
      const { result } = renderHook(() => useGetInventoryValueByCategoryQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });

  describe('inventory item mutations', () => {
    it('should create an inventory item', async () => {
      const { result } = renderHook(() => useCreateInventoryItemMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [create] = result.current;
      create({ itemName: 'New Item', itemCode: 'RAW-003', category: 'RAW_MATERIAL', storeId: '1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update an inventory item', async () => {
      const { result } = renderHook(() => useUpdateInventoryItemMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [update] = result.current;
      update({ id: 'inv-1', item: { itemName: 'Updated Tomatoes' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should adjust stock', async () => {
      const { result } = renderHook(() => useAdjustStockMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [adjust] = result.current;
      adjust({ id: 'inv-1', adjustment: { quantity: 10, reason: 'Restock', adjustedBy: 'manager-1' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should reserve stock', async () => {
      const { result } = renderHook(() => useReserveStockMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [reserve] = result.current;
      reserve({ id: 'inv-1', reservation: { quantity: 5, orderId: 'order-1', reservedBy: 'staff-1' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should release reserved stock', async () => {
      const { result } = renderHook(() => useReleaseReservedStockMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [release] = result.current;
      release({ id: 'inv-1', quantity: 5, orderId: 'order-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should consume reserved stock', async () => {
      const { result } = renderHook(() => useConsumeReservedStockMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [consume] = result.current;
      consume({ id: 'inv-1', quantity: 5, orderId: 'order-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should delete an inventory item', async () => {
      const { result } = renderHook(() => useDeleteInventoryItemMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [deleteItem] = result.current;
      deleteItem('inv-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('supplier queries and mutations', () => {
    it('should fetch all suppliers', async () => {
      const { result } = renderHook(() => useGetAllSuppliersQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBe(2);
    });

    it('should fetch supplier by ID', async () => {
      const { result } = renderHook(() => useGetSupplierByIdQuery('sup-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch active suppliers', async () => {
      const { result } = renderHook(() => useGetActiveSuppliersQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch preferred suppliers', async () => {
      const { result } = renderHook(() => useGetPreferredSuppliersQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should search suppliers', async () => {
      const { result } = renderHook(() => useSearchSuppliersQuery('Fresh'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should create a supplier', async () => {
      const { result } = renderHook(() => useCreateSupplierMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [create] = result.current;
      create({ supplierName: 'New Supplier', status: 'ACTIVE' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('purchase order queries and mutations', () => {
    it('should fetch all purchase orders', async () => {
      const { result } = renderHook(() => useGetAllPurchaseOrdersQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should create a purchase order', async () => {
      const { result } = renderHook(() => useCreatePurchaseOrderMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [create] = result.current;
      create({ storeId: '1', supplierId: 'sup-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('waste analysis queries and mutations', () => {
    it('should fetch all waste records', async () => {
      const { result } = renderHook(() => useGetAllWasteRecordsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should record waste', async () => {
      const { result } = renderHook(() => useRecordWasteMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [record] = result.current;
      record({ itemName: 'Tomatoes', quantity: 2, wasteCost: 80 });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should fetch waste trend', async () => {
      const { result } = renderHook(() => useGetWasteTrendQuery({ months: 3 }), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });
});
